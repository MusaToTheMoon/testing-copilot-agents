import { Router } from "express";
import { z } from "zod";
import { prisma } from "@essay-app/db";
import type { ApiResponse } from "@essay-app/types";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { completeLLM } from "../services/llm";

const router = Router({ mergeParams: true });
router.use(requireAuth);

const searchSchema = z.object({
  query: z.string().min(3),
  limit: z.number().int().min(1).max(20).default(5),
});

const uploadSourceSchema = z.object({
  title: z.string().min(1),
  authors: z.array(z.string()).min(1),
  year: z.number().int().optional(),
  type: z.enum(["journal", "book", "news", "blog", "website", "pdf", "user_upload"]),
  url: z.string().url().optional(),
  doi: z.string().optional(),
  abstract: z.string().optional(),
});

async function assertProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.essayProject.findFirst({ where: { id: projectId, userId } });
  if (!project) throw new AppError(404, "Project not found");
  return project;
}

// POST /projects/:id/research/search
router.post("/search", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);
    const { query, limit } = searchSchema.parse(req.body);

    const start = Date.now();
    const llmResponse = await completeLLM({
      taskType: "research_query",
      systemPrompt: `You are a research assistant helping write a ${project.essayType} essay. Find relevant academic sources.`,
      userPrompt: `Find ${limit} relevant sources for: "${query}"\nEssay topic: "${project.prompt}"\nReturn JSON with sources array.`,
      jsonMode: true,
      maxTokens: 1500,
    });

    let sources: Array<Record<string, unknown>> = [];
    try {
      const parsed = JSON.parse(llmResponse.content) as { sources?: Array<Record<string, unknown>> };
      sources = parsed.sources ?? [];
    } catch {
      sources = [];
    }

    // Log generation run
    await prisma.generationRun.create({
      data: {
        projectId: project.id,
        taskType: "research_query",
        provider: llmResponse.provider,
        model: llmResponse.model,
        promptTokens: llmResponse.promptTokens,
        completionTokens: llmResponse.completionTokens,
        cost: llmResponse.cost,
        latencyMs: Date.now() - start,
        success: true,
      },
    });

    const response: ApiResponse = { success: true, data: { sources } };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/research/upload
router.post("/upload", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);
    const data = uploadSourceSchema.parse(req.body);

    // Summarize the source
    const llmResponse = await completeLLM({
      taskType: "source_summarization",
      systemPrompt: "You are a research assistant. Summarize the source concisely for use in an essay.",
      userPrompt: `Summarize this source:\nTitle: ${data.title}\nAuthors: ${data.authors.join(", ")}\nAbstract: ${data.abstract ?? "N/A"}`,
      maxTokens: 300,
    });

    const source = await prisma.sourceDocument.create({
      data: {
        projectId: project.id,
        ...data,
        summary: llmResponse.content,
        relevanceScore: 0.8,
      },
    });

    const response: ApiResponse<typeof source> = { success: true, data: source };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/research/approve-source
router.post("/approve-source", async (req: AuthenticatedRequest, res, next) => {
  try {
    await assertProjectOwnership(req.params["id"]!, req.userId!);
    const { sourceId, approved } = z
      .object({ sourceId: z.string(), approved: z.boolean() })
      .parse(req.body);

    const source = await prisma.sourceDocument.updateMany({
      where: { id: sourceId, projectId: req.params["id"] },
      data: { approved },
    });

    if (source.count === 0) throw new AppError(404, "Source not found");
    const response: ApiResponse = { success: true, message: `Source ${approved ? "approved" : "unapproved"}` };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// DELETE /projects/:id/research/source/:sourceId
router.delete("/source/:sourceId", async (req: AuthenticatedRequest, res, next) => {
  try {
    await assertProjectOwnership(req.params["id"]!, req.userId!);

    const result = await prisma.sourceDocument.deleteMany({
      where: { id: req.params["sourceId"], projectId: req.params["id"] },
    });

    if (result.count === 0) throw new AppError(404, "Source not found");
    const response: ApiResponse = { success: true, message: "Source deleted" };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

export default router;
