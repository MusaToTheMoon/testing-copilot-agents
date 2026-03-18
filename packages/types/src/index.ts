// Workflow stages
export type WorkflowStage =
  | "CREATED"
  | "RESEARCHING"
  | "SOURCES_APPROVED"
  | "THESIS_DRAFTED"
  | "THESIS_APPROVED"
  | "OUTLINE_DRAFTED"
  | "OUTLINE_APPROVED"
  | "DRAFTING"
  | "REVISING"
  | "READY_TO_EXPORT"
  | "EXPORTED";

export type EssayType =
  | "argumentative"
  | "analytical"
  | "compare_contrast"
  | "literature_review"
  | "reflection"
  | "research_essay";

export type CitationStyle = "APA" | "MLA" | "Chicago" | "Harvard" | "IEEE";
export type ToneType = "academic" | "persuasive" | "formal" | "neutral" | "reflective";
export type SourceType = "journal" | "book" | "news" | "blog" | "website" | "pdf" | "user_upload";
export type ExportFormat = "docx" | "pdf" | "markdown" | "plaintext";

export interface WordBudgetInput {
  targetWords: number;
  tolerancePercent?: number;
  sections: { id: string; name: string; targetWords: number; currentText?: string }[];
}

export interface WordBudgetOutput {
  totalCurrentWords: number;
  totalTargetWords: number;
  remainingWords: number;
  sectionStats: {
    id: string;
    currentWords: number;
    targetWords: number;
    delta: number;
    status: "under" | "on_target" | "over";
  }[];
  recommendation: string;
}

export interface EssayProject {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  essayType: EssayType;
  targetWordCount: number;
  citationStyle: CitationStyle;
  tone: ToneType;
  formalityLevel: number;
  stage: WorkflowStage;
  dueDate?: string;
  rubric?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourceDocument {
  id: string;
  projectId: string;
  title: string;
  authors: string[];
  year?: number;
  type: SourceType;
  url?: string;
  doi?: string;
  abstract?: string;
  summary?: string;
  relevanceScore?: number;
  approved: boolean;
  createdAt: string;
}

export interface ThesisVersion {
  id: string;
  projectId: string;
  thesis: string;
  supportingArguments: string[];
  counterarguments: string[];
  evidenceLinks: string[];
  claimToSourceMapping: { claim: string; sourceId: string }[];
  conclusionIntent: string;
  approved: boolean;
  createdAt: string;
}

export interface OutlineSection {
  id: string;
  name: string;
  goal: string;
  targetWords: number;
  sourceIds: string[];
  order: number;
}

export interface OutlineVersion {
  id: string;
  projectId: string;
  sections: OutlineSection[];
  approved: boolean;
  createdAt: string;
}

export interface SectionDraft {
  id: string;
  projectId: string;
  sectionId: string;
  sectionName: string;
  content: string;
  wordCount: number;
  targetWordCount: number;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackComment {
  id: string;
  projectId: string;
  artifactType: "source_set" | "thesis" | "outline" | "section_draft" | "final_draft";
  artifactId: string;
  content: string;
  resolved: boolean;
  createdAt: string;
}

export interface GenerationRun {
  id: string;
  projectId: string;
  taskType: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
