import { Router } from "express";
import { z } from "zod";
import { prisma } from "@essay-app/db";
import type { ApiResponse } from "@essay-app/types";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { countWords, calculateWordBudget } from "@essay-app/word-tools";
import type { OutlineSection } from "@essay-app/types";

const router = Router({ mergeParams: true });
router.use(requireAuth);

async function assertProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.essayProject.findFirst({ where: { id: projectId, userId } });
  if (!project) throw new AppError(404, "Project not found");
  return project;
}

// POST /projects/:id/word-count
router.post("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    await assertProjectOwnership(req.params["id"]!, req.userId!);
    const { text } = z.object({ text: z.string() }).parse(req.body);

    const wordCount = countWords(text);
    const response: ApiResponse = { success: true, data: { wordCount } };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/word-budget/recalculate
router.post("/recalculate", async (req: AuthenticatedRequest, res, next) => {
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

export default router;
