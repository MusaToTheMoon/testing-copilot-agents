import { Router } from "express";
import { prisma } from "@essay-app/db";
import type { ApiResponse } from "@essay-app/types";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { getNextStage } from "@essay-app/workflow";
import type { OutlineSection } from "@essay-app/types";

const router = Router({ mergeParams: true });
router.use(requireAuth);

async function assertProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.essayProject.findFirst({ where: { id: projectId, userId } });
  if (!project) throw new AppError(404, "Project not found");
  return project;
}

async function assembleFullText(projectId: string): Promise<string> {
  const [latestOutline, drafts] = await Promise.all([
    prisma.outlineVersion.findFirst({
      where: { projectId, approved: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sectionDraft.findMany({ where: { projectId } }),
  ]);

  if (!latestOutline) return drafts.map((d) => d.content).join("\n\n");

  const sections = (latestOutline.sections as OutlineSection[]).sort((a, b) => a.order - b.order);
  return sections
    .map((s) => {
      const draft = drafts.find((d) => d.sectionId === s.id);
      return `## ${s.name}\n\n${draft?.content ?? ""}`;
    })
    .join("\n\n");
}

// POST /projects/:id/export/docx
router.post("/docx", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);
    const fullText = await assembleFullText(project.id);

    // In a full implementation this would use a DOCX library (e.g. docx npm package)
    // For MVP, we store the plain content and mark format as docx
    const artifact = await prisma.exportArtifact.create({
      data: {
        projectId: project.id,
        format: "docx",
        content: fullText,
      },
    });

    // Advance to EXPORTED if in READY_TO_EXPORT
    if (project.stage === "READY_TO_EXPORT") {
      const nextStage = getNextStage("READY_TO_EXPORT", "EXPORT");
      if (nextStage) {
        await prisma.essayProject.update({ where: { id: project.id }, data: { stage: nextStage } });
      }
    }

    const response: ApiResponse<typeof artifact> = { success: true, data: artifact };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/export/pdf
router.post("/pdf", async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await assertProjectOwnership(req.params["id"]!, req.userId!);
    const fullText = await assembleFullText(project.id);

    // In a full implementation this would use a PDF library (e.g. puppeteer or pdfkit)
    // For MVP, we store the content and mark format as pdf
    const artifact = await prisma.exportArtifact.create({
      data: {
        projectId: project.id,
        format: "pdf",
        content: fullText,
      },
    });

    if (project.stage === "READY_TO_EXPORT") {
      const nextStage = getNextStage("READY_TO_EXPORT", "EXPORT");
      if (nextStage) {
        await prisma.essayProject.update({ where: { id: project.id }, data: { stage: nextStage } });
      }
    }

    const response: ApiResponse<typeof artifact> = { success: true, data: artifact };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

export default router;
