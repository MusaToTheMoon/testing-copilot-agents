import { Router } from "express";
import { z } from "zod";
import { prisma } from "@essay-app/db";
import type { ApiResponse, OutlineSection } from "@essay-app/types";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { completeLLM } from "../services/llm";
import { getNextStage } from "@essay-app/workflow";
import { allocateSectionBudgets } from "@essay-app/word-tools";

const router = Router({ mergeParams: true });
router.use(requireAuth);

async function assertProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.essayProject.findFirst({ where: { id: projectId, userId } });
  if (!project) throw new AppError(404, "Project not found");
  return project;
}

// POST /projects/:id/outline/generate
router.post("/generate", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);

    const [latestThesis, sources] = await Promise.all([
      prisma.thesisVersion.findFirst({
        where: { projectId: project.id, approved: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sourceDocument.findMany({ where: { projectId: project.id, approved: true } }),
    ]);

    const start = Date.now();
    const llmResponse = await completeLLM({
      taskType: "outline_generation",
      systemPrompt: `You are an expert academic writing assistant. Generate a detailed essay outline.`,
      userPrompt: `Generate an outline for a ${project.targetWordCount}-word ${project.essayType} essay.\nThesis: "${latestThesis?.thesis ?? "Not yet defined"}"\nPrompt: "${project.prompt}"\nSources: ${sources.map((s) => `[${s.id}] ${s.title}`).join(", ")}\n\nReturn JSON with sections array. Each section: { id, name, goal, targetWords, sourceIds, order }.`,
      jsonMode: true,
      maxTokens: 2000,
    });

    let sections: OutlineSection[] = [];
    try {
      const parsed = JSON.parse(llmResponse.content) as { sections?: OutlineSection[] };
      sections = parsed.sections ?? [];
    } catch {
      // Fallback: generate default structure
      const bodyCount = Math.max(2, Math.floor(project.targetWordCount / 500) - 2);
      const budgets = allocateSectionBudgets(project.targetWordCount, bodyCount);
      sections = [
        { id: "intro", name: "Introduction", goal: "Present thesis and context", targetWords: budgets.intro, sourceIds: [], order: 1 },
        ...budgets.body.map((words, i) => ({
          id: `body-${i + 1}`,
          name: `Body Section ${i + 1}`,
          goal: "Develop a key argument with evidence",
          targetWords: words,
          sourceIds: [],
          order: i + 2,
        })),
        { id: "conclusion", name: "Conclusion", goal: "Synthesize and restate thesis", targetWords: budgets.conclusion, sourceIds: [], order: bodyCount + 2 },
      ];
    }

    const outlineVersion = await prisma.outlineVersion.create({
      data: { projectId: project.id, sections: sections as object[] },
    });

    const nextStage = getNextStage(project.stage as Parameters<typeof getNextStage>[0], "GENERATE_OUTLINE");
    if (nextStage) {
      await prisma.essayProject.update({ where: { id: project.id }, data: { stage: nextStage } });
    }

    await prisma.generationRun.create({
      data: {
        projectId: project.id,
        taskType: "outline_generation",
        provider: llmResponse.provider,
        model: llmResponse.model,
        promptTokens: llmResponse.promptTokens,
        completionTokens: llmResponse.completionTokens,
        cost: llmResponse.cost,
        latencyMs: Date.now() - start,
        success: true,
      },
    });

    const response: ApiResponse<typeof outlineVersion> = { success: true, data: outlineVersion };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/outline/approve
router.post("/approve", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);
    const { outlineVersionId } = z.object({ outlineVersionId: z.string() }).parse(req.body);

    const outline = await prisma.outlineVersion.findFirst({
      where: { id: outlineVersionId, projectId: project.id },
    });
    if (!outline) throw new AppError(404, "Outline version not found");

    await prisma.outlineVersion.update({ where: { id: outlineVersionId }, data: { approved: true } });

    const nextStage = getNextStage(project.stage as Parameters<typeof getNextStage>[0], "APPROVE_OUTLINE");
    if (nextStage) {
      await prisma.essayProject.update({ where: { id: project.id }, data: { stage: nextStage } });
    }

    const response: ApiResponse = { success: true, message: "Outline approved" };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

export default router;
