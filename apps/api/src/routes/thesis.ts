import { Router } from "express";
import { z } from "zod";
import { prisma } from "@essay-app/db";
import type { ApiResponse } from "@essay-app/types";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { completeLLM } from "../services/llm";
import { getNextStage } from "@essay-app/workflow";

const router = Router({ mergeParams: true });
router.use(requireAuth);

async function assertProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.essayProject.findFirst({ where: { id: projectId, userId } });
  if (!project) throw new AppError(404, "Project not found");
  return project;
}

// POST /projects/:id/thesis/generate
router.post("/generate", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);

    const sources = await prisma.sourceDocument.findMany({
      where: { projectId: project.id, approved: true },
    });

    const start = Date.now();
    const llmResponse = await completeLLM({
      taskType: "thesis_generation",
      systemPrompt: `You are an expert academic writing assistant specializing in ${project.essayType} essays. Generate a sophisticated thesis statement with full JSON output.`,
      userPrompt: `Generate a thesis for this essay:\nPrompt: "${project.prompt}"\nEssay type: ${project.essayType}\nTone: ${project.tone}\nApproved sources:\n${sources.map((s) => `- ${s.title} by ${s.authors.join(", ")} (${s.year ?? "n/a"}): ${s.summary ?? s.abstract ?? ""}`).join("\n")}\n\nReturn JSON with fields: thesis, supportingArguments (array), counterarguments (array), evidenceLinks (array), claimToSourceMapping (array of {claim, sourceId}), conclusionIntent.`,
      jsonMode: true,
      maxTokens: 2000,
      temperature: 0.7,
    });

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(llmResponse.content) as Record<string, unknown>;
    } catch {
      parsed = { thesis: llmResponse.content };
    }

    const thesisVersion = await prisma.thesisVersion.create({
      data: {
        projectId: project.id,
        thesis: (parsed["thesis"] as string) ?? "",
        supportingArguments: (parsed["supportingArguments"] as string[]) ?? [],
        counterarguments: (parsed["counterarguments"] as string[]) ?? [],
        evidenceLinks: (parsed["evidenceLinks"] as string[]) ?? [],
        claimSourceMapping: (parsed["claimToSourceMapping"] as object) ?? [],
        conclusionIntent: (parsed["conclusionIntent"] as string) ?? "",
      },
    });

    // Advance stage to THESIS_DRAFTED
    const nextStage = getNextStage(project.stage as Parameters<typeof getNextStage>[0], "GENERATE_THESIS");
    if (nextStage) {
      await prisma.essayProject.update({ where: { id: project.id }, data: { stage: nextStage } });
    }

    await prisma.generationRun.create({
      data: {
        projectId: project.id,
        taskType: "thesis_generation",
        provider: llmResponse.provider,
        model: llmResponse.model,
        promptTokens: llmResponse.promptTokens,
        completionTokens: llmResponse.completionTokens,
        cost: llmResponse.cost,
        latencyMs: Date.now() - start,
        success: true,
      },
    });

    const response: ApiResponse<typeof thesisVersion> = { success: true, data: thesisVersion };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/thesis/approve
router.post("/approve", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);
    const { thesisVersionId } = z.object({ thesisVersionId: z.string() }).parse(req.body);

    const thesis = await prisma.thesisVersion.findFirst({
      where: { id: thesisVersionId, projectId: project.id },
    });
    if (!thesis) throw new AppError(404, "Thesis version not found");

    await prisma.thesisVersion.update({ where: { id: thesisVersionId }, data: { approved: true } });

    const nextStage = getNextStage(project.stage as Parameters<typeof getNextStage>[0], "APPROVE_THESIS");
    if (nextStage) {
      await prisma.essayProject.update({ where: { id: project.id }, data: { stage: nextStage } });
    }

    const response: ApiResponse = { success: true, message: "Thesis approved" };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

export default router;
