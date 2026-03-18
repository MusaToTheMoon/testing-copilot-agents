"use client";

import { create } from "zustand";
import type { EssayProject, SourceDocument, ThesisVersion, OutlineVersion, SectionDraft, FeedbackComment, WordBudgetOutput } from "@essay-app/types";

interface ProjectState {
  project: EssayProject | null;
  sources: SourceDocument[];
  latestThesis: ThesisVersion | null;
  latestOutline: OutlineVersion | null;
  sectionDrafts: SectionDraft[];
  comments: FeedbackComment[];
  wordBudget: WordBudgetOutput | null;
  isLoading: boolean;
  error: string | null;

  setProject: (project: EssayProject) => void;
  setSources: (sources: SourceDocument[]) => void;
  setLatestThesis: (thesis: ThesisVersion | null) => void;
  setLatestOutline: (outline: OutlineVersion | null) => void;
  setSectionDrafts: (drafts: SectionDraft[]) => void;
  setComments: (comments: FeedbackComment[]) => void;
  setWordBudget: (budget: WordBudgetOutput | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  project: null,
  sources: [],
  latestThesis: null,
  latestOutline: null,
  sectionDrafts: [],
  comments: [],
  wordBudget: null,
  isLoading: false,
  error: null,
};

export const useProjectStore = create<ProjectState>((set) => ({
  ...initialState,

  setProject: (project) => set({ project }),
  setSources: (sources) => set({ sources }),
  setLatestThesis: (latestThesis) => set({ latestThesis }),
  setLatestOutline: (latestOutline) => set({ latestOutline }),
  setSectionDrafts: (sectionDrafts) => set({ sectionDrafts }),
  setComments: (comments) => set({ comments }),
  setWordBudget: (wordBudget) => set({ wordBudget }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
