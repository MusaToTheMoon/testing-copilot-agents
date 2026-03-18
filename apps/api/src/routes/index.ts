import { Router } from "express";
import authRoutes from "./auth";
import projectRoutes from "./projects";
import researchRoutes from "./research";
import thesisRoutes from "./thesis";
import outlineRoutes from "./outline";
import draftsRoutes from "./drafts";
import revisionRoutes from "./revision";
import wordcountRoutes from "./wordcount";
import exportRoutes from "./export";
import feedbackRoutes from "./feedback";

const router = Router();

router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);

// Nested project routes
router.use("/projects/:id/research", researchRoutes);
router.use("/projects/:id/thesis", thesisRoutes);
router.use("/projects/:id/outline", outlineRoutes);
router.use("/projects/:id/drafts", draftsRoutes);
router.use("/projects/:id/revision", revisionRoutes);
router.use("/projects/:id/word-count", wordcountRoutes);
router.use("/projects/:id/word-budget", wordcountRoutes);
router.use("/projects/:id/export", exportRoutes);
router.use("/projects/:id/comments", feedbackRoutes);

export default router;
