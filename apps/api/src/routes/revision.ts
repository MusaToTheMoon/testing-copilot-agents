import { Router } from "express";
import { z } from "zod";
import { prisma } from "@essay-app/db";
import type { ApiResponse, OutlineSection } from "@essay-app/types";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { completeLLM } from "../services/llm";
import { countWords, calculateWordBudget } from "@essay-app/word-tools";
import { getNextStage } from "@essay-app/workflow";

const router = Router({ mergeParams: true });
router.use(requireAuth);

async function assertProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.essayProject.findFirst({ where: { id: projectId, userId } });
  if (!project) throw new AppError(404, "Project not found");
  return project;
}

// POST /projects/:id/revision/structure
router.post("/structure", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);
    const drafts = await prisma.sectionDraft.findMany({ where: { projectId: project.id } });
    const fullText = drafts.map((d) => d.content).join("\n\n");

    const start = Date.now();
    const llmResponse = await completeLLM({
      taskType: "revision",
      systemPrompt: "You are an expert academic editor. Revise for structural coherence and argument flow.",
      userPrompt: `Review the structure of this essay and provide specific revision suggestions:\n\n${fullText}\n\nFocus on: argument flow, logical progression, transitions between sections, and overall cohesion.`,
      maxTokens: 1500,
    });

    await prisma.generationRun.create({
      data: {
        projectId: project.id,
        taskType: "revision",
        provider: llmResponse.provider,
        model: llmResponse.model,
        promptTokens: llmResponse.promptTokens,
        completionTokens: llmResponse.completionTokens,
        cost: llmResponse.cost,
        latencyMs: Date.now() - start,
        success: true,
      },
    });

    // Advance to REVISING stage
    if (project.stage === "DRAFTING") {
      const nextStage = getNextStage("DRAFTING", "START_REVISION");
      if (nextStage) {
        await prisma.essayProject.update({ where: { id: project.id }, data: { stage: nextStage } });
      }
    }

    const response: ApiResponse = { success: true, data: { suggestions: llmResponse.content } };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/revision/style
router.post("/style", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);
    const { sectionId } = z.object({ sectionId: z.string().optional() }).parse(req.body);

    let textToRevise: string;
    let draftId: string | undefined;

    if (sectionId) {
      const draft = await prisma.sectionDraft.findFirst({
        where: { sectionId, projectId: project.id },
      });
      if (!draft) throw new AppError(404, "Section draft not found");
      textToRevise = draft.content;
      draftId = draft.id;
    } else {
      const drafts = await prisma.sectionDraft.findMany({ where: { projectId: project.id } });
      textToRevise = drafts.map((d) => d.content).join("\n\n");
    }

    const start = Date.now();
    const llmResponse = await completeLLM({
      taskType: "revision",
      systemPrompt: `You are an expert academic editor. Revise text for ${project.tone} style and formality level ${project.formalityLevel}/5.`,
      userPrompt: `Revise the following text for style, clarity, and tone consistency. Return only the revised text:\n\n${textToRevise}`,
      maxTokens: Math.max(countWords(textToRevise) * 2, 1000),
      temperature: 0.4,
    });

    if (draftId) {
      const wordCount = countWords(llmResponse.content);
      await prisma.sectionDraft.update({
        where: { id: draftId },
        data: { content: llmResponse.content, wordCount },
      });
    }

    await prisma.generationRun.create({
      data: {
        projectId: project.id,
        taskType: "revision",
        provider: llmResponse.provider,
        model: llmResponse.model,
        promptTokens: llmResponse.promptTokens,
        completionTokens: llmResponse.completionTokens,
        cost: llmResponse.cost,
        latencyMs: Date.now() - start,
        success: true,
      },
    });

    const response: ApiResponse = { success: true, data: { revisedText: llmResponse.content } };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/revision/citations
router.post("/citations", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);
    const sources = await prisma.sourceDocument.findMany({
      where: { projectId: project.id, approved: true },
    });

    const start = Date.now();
    const llmResponse = await completeLLM({
      taskType: "citation_formatting",
      systemPrompt: `You are an expert in academic citation formatting. Format citations in ${project.citationStyle} style.`,
      userPrompt: `Format the following sources as a bibliography in ${project.citationStyle} style:\n${sources.map((s) => `Title: ${s.title}\nAuthors: ${s.authors.join(", ")}\nYear: ${s.year ?? "n/a"}\nType: ${s.type}\nURL: ${s.url ?? "n/a"}\nDOI: ${s.doi ?? "n/a"}`).join("\n---\n")}`,
      maxTokens: 1500,
    });

    await prisma.generationRun.create({
      data: {
        projectId: project.id,
        taskType: "citation_formatting",
        provider: llmResponse.provider,
        model: llmResponse.model,
        promptTokens: llmResponse.promptTokens,
        completionTokens: llmResponse.completionTokens,
        cost: llmResponse.cost,
        latencyMs: Date.now() - start,
        success: true,
      },
    });

    const response: ApiResponse = { success: true, data: { bibliography: llmResponse.content } };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/revision/word-budget
router.post("/word-budget", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);

    const [latestOutline, drafts] = await Promise.all([
      prisma.outlineVersion.findFirst({
        where: { projectId: project.id, approved: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sectionDraft.findMany({ where: { projectId: project.id } }),
    ]);

    const sections = latestOutline
      ? (latestOutline.sections as OutlineSection[]).map((s) => {
          const draft = drafts.find((d) => d.sectionId === s.id);
          return {
            id: s.id,
            name: s.name,
            targetWords: s.targetWords,
            currentText: draft?.content ?? "",
          };
        })
      : drafts.map((d) => ({
          id: d.sectionId,
          name: d.sectionName,
          targetWords: d.targetWordCount,
          currentText: d.content,
        }));

    const budget = calculateWordBudget({
      targetWords: project.targetWordCount,
      sections,
    });

    const response: ApiResponse = { success: true, data: budget };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/revision/approve (advance to READY_TO_EXPORT)
router.post("/approve", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);

    const nextStage = getNextStage(project.stage as Parameters<typeof getNextStage>[0], "APPROVE_REVISION");
    if (!nextStage) throw new AppError(400, "Cannot approve revision in current stage");

    await prisma.essayProject.update({ where: { id: project.id }, data: { stage: nextStage } });
    const response: ApiResponse = { success: true, message: "Revision approved, ready to export" };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

export default router;
