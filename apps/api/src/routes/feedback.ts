import { Router } from "express";
import { z } from "zod";
import { prisma } from "@essay-app/db";
import type { ApiResponse } from "@essay-app/types";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { completeLLM } from "../services/llm";

const router = Router({ mergeParams: true });
router.use(requireAuth);

async function assertProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.essayProject.findFirst({ where: { id: projectId, userId } });
  if (!project) throw new AppError(404, "Project not found");
  return project;
}

const createCommentSchema = z.object({
  artifactType: z.enum(["source_set", "thesis", "outline", "section_draft", "final_draft"]),
  artifactId: z.string(),
  content: z.string().min(1),
});

const updateCommentSchema = z.object({
  resolved: z.boolean().optional(),
  content: z.string().min(1).optional(),
});

// POST /projects/:id/comments
router.post("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);
    const data = createCommentSchema.parse(req.body);

    const comment = await prisma.feedbackComment.create({
      data: { projectId: project.id, ...data },
    });

    const response: ApiResponse<typeof comment> = { success: true, data: comment };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

// GET /projects/:id/comments
router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);
    const comments = await prisma.feedbackComment.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
    });

    const response: ApiResponse<typeof comments> = { success: true, data: comments };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// PATCH /projects/:id/comments/:commentId
router.patch("/:commentId", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);
    const { resolved, content } = updateCommentSchema.parse(req.body);

    const comment = await prisma.feedbackComment.findFirst({
      where: { id: req.params["commentId"], projectId: project.id },
    });
    if (!comment) throw new AppError(404, "Comment not found");

    const updated = await prisma.feedbackComment.update({
      where: { id: comment.id },
      data: { ...(resolved !== undefined ? { resolved } : {}), ...(content ? { content } : {}) },
    });

    const response: ApiResponse<typeof updated> = { success: true, data: updated };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/regenerate-with-feedback
router.post("/regenerate", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);
    const { artifactType, artifactId, feedback } = z
      .object({
        artifactType: z.enum(["thesis", "outline", "section_draft"]),
        artifactId: z.string(),
        feedback: z.string().min(1),
      })
      .parse(req.body);

    let taskType: "thesis_generation" | "outline_generation" | "section_draft" = "thesis_generation";
    let context = "";

    if (artifactType === "thesis") {
      const thesis = await prisma.thesisVersion.findFirst({ where: { id: artifactId, projectId: project.id } });
      if (!thesis) throw new AppError(404, "Thesis not found");
      context = `Current thesis: "${thesis.thesis}"`;
      taskType = "thesis_generation";
    } else if (artifactType === "outline") {
      const outline = await prisma.outlineVersion.findFirst({ where: { id: artifactId, projectId: project.id } });
      if (!outline) throw new AppError(404, "Outline not found");
      context = `Current outline sections: ${JSON.stringify(outline.sections)}`;
      taskType = "outline_generation";
    } else if (artifactType === "section_draft") {
      const draft = await prisma.sectionDraft.findFirst({ where: { id: artifactId, projectId: project.id } });
      if (!draft) throw new AppError(404, "Draft not found");
      context = `Current section "${draft.sectionName}": "${draft.content.slice(0, 500)}..."`;
      taskType = "section_draft";
    }

    const start = Date.now();
    const llmResponse = await completeLLM({
      taskType,
      systemPrompt: "You are an expert academic writing assistant. Revise the artifact based on the feedback provided.",
      userPrompt: `${context}\n\nUser feedback: "${feedback}"\n\nPlease regenerate the artifact incorporating the feedback.`,
      maxTokens: 2000,
      temperature: 0.7,
    });

    await prisma.generationRun.create({
      data: {
        projectId: project.id,
        taskType,
        provider: llmResponse.provider,
        model: llmResponse.model,
        promptTokens: llmResponse.promptTokens,
        completionTokens: llmResponse.completionTokens,
        cost: llmResponse.cost,
        latencyMs: Date.now() - start,
        success: true,
      },
    });

    const response: ApiResponse = { success: true, data: { regeneratedContent: llmResponse.content } };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

export default router;
