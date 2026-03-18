import { Router } from "express";
import { z } from "zod";
import { prisma } from "@essay-app/db";
import type { ApiResponse } from "@essay-app/types";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { getNextStage, canTransition } from "@essay-app/workflow";

const router = Router();
router.use(requireAuth);

const createProjectSchema = z.object({
  title: z.string().min(1).max(255),
  prompt: z.string().min(10),
  essayType: z.enum([
    "argumentative",
    "analytical",
    "compare_contrast",
    "literature_review",
    "reflection",
    "research_essay",
  ]),
  targetWordCount: z.number().int().min(100).max(50000),
  citationStyle: z.enum(["APA", "MLA", "Chicago", "Harvard", "IEEE"]),
  tone: z.enum(["academic", "persuasive", "formal", "neutral", "reflective"]),
  formalityLevel: z.number().int().min(1).max(5).default(3),
  dueDate: z.string().datetime().optional(),
  rubric: z.string().optional(),
});

const updateProjectSchema = createProjectSchema.partial().omit({ essayType: true });

// POST /projects
router.post("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createProjectSchema.parse(req.body);
    const project = await prisma.essayProject.create({
      data: {
        userId: req.userId!,
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });

    // Advance to RESEARCHING stage automatically
    const nextStage = getNextStage("CREATED", "START_RESEARCH");
    if (nextStage) {
      await prisma.essayProject.update({
        where: { id: project.id },
        data: { stage: nextStage },
      });
      project.stage = nextStage;
    }

    const response: ApiResponse<typeof project> = { success: true, data: project };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

// GET /projects
router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const projects = await prisma.essayProject.findMany({
      where: { userId: req.userId! },
      orderBy: { updatedAt: "desc" },
    });
    const response: ApiResponse<typeof projects> = { success: true, data: projects };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// GET /projects/:id
router.get("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await prisma.essayProject.findFirst({
      where: { id: req.params["id"], userId: req.userId! },
      include: {
        sources: true,
        thesisVersions: { orderBy: { createdAt: "desc" }, take: 1 },
        outlineVersions: { orderBy: { createdAt: "desc" }, take: 1 },
        sectionDrafts: true,
        comments: { where: { resolved: false } },
      },
    });

    if (!project) throw new AppError(404, "Project not found");
    const response: ApiResponse<typeof project> = { success: true, data: project };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// PATCH /projects/:id
router.patch("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = updateProjectSchema.parse(req.body);
    const project = await prisma.essayProject.findFirst({
      where: { id: req.params["id"], userId: req.userId! },
    });
    if (!project) throw new AppError(404, "Project not found");

    // Handle workflow stage transitions
    if (req.body.action && typeof req.body.action === "string") {
      const currentStage = project.stage as Parameters<typeof canTransition>[0];
      if (!canTransition(currentStage, req.body.action as string)) {
        throw new AppError(400, `Cannot perform action '${req.body.action}' in stage '${currentStage}'`);
      }
      const nextStage = getNextStage(currentStage, req.body.action as string);
      if (nextStage) (data as Record<string, unknown>)["stage"] = nextStage;
    }

    const updated = await prisma.essayProject.update({
      where: { id: req.params["id"] },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
    const response: ApiResponse<typeof updated> = { success: true, data: updated };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// GET /projects/:id/history
router.get("/:id/history", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await prisma.essayProject.findFirst({
      where: { id: req.params["id"], userId: req.userId! },
    });
    if (!project) throw new AppError(404, "Project not found");

    const [thesisVersions, outlineVersions, sectionDrafts, generationRuns] = await Promise.all([
      prisma.thesisVersion.findMany({ where: { projectId: project.id }, orderBy: { createdAt: "desc" } }),
      prisma.outlineVersion.findMany({ where: { projectId: project.id }, orderBy: { createdAt: "desc" } }),
      prisma.sectionDraft.findMany({ where: { projectId: project.id }, orderBy: { createdAt: "desc" } }),
      prisma.generationRun.findMany({ where: { projectId: project.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: { thesisVersions, outlineVersions, sectionDrafts, generationRuns },
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

export default router;
