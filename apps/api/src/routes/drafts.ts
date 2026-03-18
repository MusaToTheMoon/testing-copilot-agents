import { Router } from "express";
import { z } from "zod";
import { prisma } from "@essay-app/db";
import type { ApiResponse, OutlineSection } from "@essay-app/types";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { completeLLM } from "../services/llm";
import { countWords } from "@essay-app/word-tools";
import { getNextStage } from "@essay-app/workflow";

const router = Router({ mergeParams: true });
router.use(requireAuth);

async function assertProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.essayProject.findFirst({ where: { id: projectId, userId } });
  if (!project) throw new AppError(404, "Project not found");
  return project;
}

const updateDraftSchema = z.object({
  content: z.string(),
  approved: z.boolean().optional(),
});

// POST /projects/:id/drafts/section/:sectionId/generate
router.post("/section/:sectionId/generate", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);
    const sectionId = req.params["sectionId"]!;

    const [latestOutline, latestThesis, sources] = await Promise.all([
      prisma.outlineVersion.findFirst({
        where: { projectId: project.id, approved: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.thesisVersion.findFirst({
        where: { projectId: project.id, approved: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sourceDocument.findMany({ where: { projectId: project.id, approved: true } }),
    ]);

    if (!latestOutline) throw new AppError(400, "No approved outline found");

    const sections = latestOutline.sections as OutlineSection[];
    const section = sections.find((s) => s.id === sectionId);
    if (!section) throw new AppError(404, "Section not found in outline");

    const sectionSources = sources.filter((s) => section.sourceIds.includes(s.id));

    const start = Date.now();
    const llmResponse = await completeLLM({
      taskType: "section_draft",
      systemPrompt: `You are an expert academic writer. Write in a ${project.tone} tone with formality level ${project.formalityLevel}/5.`,
      userPrompt: `Write the "${section.name}" section of a ${project.essayType} essay.\nSection goal: ${section.goal}\nTarget word count: ${section.targetWords} words\nThesis: "${latestThesis?.thesis ?? "N/A"}"\nSources to use:\n${sectionSources.map((s) => `- ${s.title}: ${s.summary ?? s.abstract ?? ""}`).join("\n")}\nWrite the complete section text only, no headings.`,
      maxTokens: Math.max(section.targetWords * 2, 1000),
      temperature: 0.7,
    });

    const wordCount = countWords(llmResponse.content);

    const existing = await prisma.sectionDraft.findFirst({
      where: { projectId: project.id, sectionId },
    });

    let draft;
    if (existing) {
      draft = await prisma.sectionDraft.update({
        where: { id: existing.id },
        data: { content: llmResponse.content, wordCount, approved: false },
      });
    } else {
      draft = await prisma.sectionDraft.create({
        data: {
          projectId: project.id,
          sectionId,
          sectionName: section.name,
          content: llmResponse.content,
          wordCount,
          targetWordCount: section.targetWords,
        },
      });
    }

    // Advance to DRAFTING if not already there
    if (project.stage === "OUTLINE_APPROVED") {
      const nextStage = getNextStage("OUTLINE_APPROVED", "START_DRAFTING");
      if (nextStage) {
        await prisma.essayProject.update({ where: { id: project.id }, data: { stage: nextStage } });
      }
    }

    await prisma.generationRun.create({
      data: {
        projectId: project.id,
        taskType: "section_draft",
        provider: llmResponse.provider,
        model: llmResponse.model,
        promptTokens: llmResponse.promptTokens,
        completionTokens: llmResponse.completionTokens,
        cost: llmResponse.cost,
        latencyMs: Date.now() - start,
        success: true,
      },
    });

    const response: ApiResponse<typeof draft> = { success: true, data: draft };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// PATCH /projects/:id/drafts/section/:sectionId
router.patch("/section/:sectionId", async (req: AuthenticatedRequest, res, next) => {
  try {
    await assertProjectOwnership(req.params["id"]!, req.userId!);
    const { content, approved } = updateDraftSchema.parse(req.body);
    const sectionId = req.params["sectionId"]!;

    const draft = await prisma.sectionDraft.findFirst({
      where: { sectionId, projectId: req.params["id"] },
    });
    if (!draft) throw new AppError(404, "Section draft not found");

    const wordCount = countWords(content);
    const updated = await prisma.sectionDraft.update({
      where: { id: draft.id },
      data: { content, wordCount, ...(approved !== undefined ? { approved } : {}) },
    });

    const response: ApiResponse<typeof updated> = { success: true, data: updated };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/drafts/assemble
router.post("/assemble", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);

    const [latestOutline, drafts] = await Promise.all([
      prisma.outlineVersion.findFirst({
        where: { projectId: project.id, approved: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sectionDraft.findMany({ where: { projectId: project.id } }),
    ]);

    if (!latestOutline) throw new AppError(400, "No approved outline found");

    const sections = latestOutline.sections as OutlineSection[];
    const assembledSections = sections
      .sort((a, b) => a.order - b.order)
      .map((section) => {
        const draft = drafts.find((d) => d.sectionId === section.id);
        return {
          sectionId: section.id,
          sectionName: section.name,
          content: draft?.content ?? "",
          wordCount: draft?.wordCount ?? 0,
        };
      });

    const totalWords = assembledSections.reduce((sum, s) => sum + s.wordCount, 0);
    const fullText = assembledSections.map((s) => s.content).join("\n\n");

    const response: ApiResponse = {
      success: true,
      data: { sections: assembledSections, totalWords, fullText },
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

export default router;
