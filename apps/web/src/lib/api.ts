import type {
  ApiResponse,
  EssayProject,
  SourceDocument,
  ThesisVersion,
  OutlineVersion,
  SectionDraft,
  FeedbackComment,
  WordBudgetOutput,
  EssayType,
  CitationStyle,
  ToneType,
} from "@essay-app/types";

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001/api";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const data = (await res.json()) as ApiResponse<T>;
  if (!data.success) {
    throw new Error(data.error ?? "Request failed");
  }
  return data;
}

// Auth
export async function login(email: string, password: string) {
  return apiFetch<{ id: string; email: string; name?: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(email: string, password: string, name?: string) {
  return apiFetch<{ id: string; email: string; name?: string }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function logout() {
  return apiFetch("/auth/logout", { method: "POST" });
}

export async function getMe() {
  return apiFetch<{ id: string; email: string; name?: string; emailVerified: boolean }>("/auth/me");
}

// Projects
export interface CreateProjectInput {
  title: string;
  prompt: string;
  essayType: EssayType;
  targetWordCount: number;
  citationStyle: CitationStyle;
  tone: ToneType;
  formalityLevel?: number;
  dueDate?: string;
  rubric?: string;
}

export async function createProject(data: CreateProjectInput) {
  return apiFetch<EssayProject>("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getProjects() {
  return apiFetch<EssayProject[]>("/projects");
}

export async function getProject(id: string) {
  return apiFetch<
    EssayProject & {
      sources: SourceDocument[];
      thesisVersions: ThesisVersion[];
      outlineVersions: OutlineVersion[];
      sectionDrafts: SectionDraft[];
      comments: FeedbackComment[];
    }
  >(`/projects/${id}`);
}

export async function updateProject(id: string, data: Partial<CreateProjectInput> & { action?: string }) {
  return apiFetch<EssayProject>(`/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getProjectHistory(id: string) {
  return apiFetch(`/projects/${id}/history`);
}

// Research
export async function searchResearch(projectId: string, query: string, limit = 5) {
  return apiFetch<{ sources: SourceDocument[] }>(`/projects/${projectId}/research/search`, {
    method: "POST",
    body: JSON.stringify({ query, limit }),
  });
}

export async function uploadSource(projectId: string, data: Omit<SourceDocument, "id" | "projectId" | "createdAt" | "approved" | "summary">) {
  return apiFetch<SourceDocument>(`/projects/${projectId}/research/upload`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function approveSource(projectId: string, sourceId: string, approved: boolean) {
  return apiFetch(`/projects/${projectId}/research/approve-source`, {
    method: "POST",
    body: JSON.stringify({ sourceId, approved }),
  });
}

export async function deleteSource(projectId: string, sourceId: string) {
  return apiFetch(`/projects/${projectId}/research/source/${sourceId}`, { method: "DELETE" });
}

// Thesis
export async function generateThesis(projectId: string) {
  return apiFetch<ThesisVersion>(`/projects/${projectId}/thesis/generate`, { method: "POST" });
}

export async function approveThesis(projectId: string, thesisVersionId: string) {
  return apiFetch(`/projects/${projectId}/thesis/approve`, {
    method: "POST",
    body: JSON.stringify({ thesisVersionId }),
  });
}

// Outline
export async function generateOutline(projectId: string) {
  return apiFetch<OutlineVersion>(`/projects/${projectId}/outline/generate`, { method: "POST" });
}

export async function approveOutline(projectId: string, outlineVersionId: string) {
  return apiFetch(`/projects/${projectId}/outline/approve`, {
    method: "POST",
    body: JSON.stringify({ outlineVersionId }),
  });
}

// Drafts
export async function generateSectionDraft(projectId: string, sectionId: string) {
  return apiFetch<SectionDraft>(`/projects/${projectId}/drafts/section/${sectionId}/generate`, {
    method: "POST",
  });
}

export async function updateSectionDraft(projectId: string, sectionId: string, content: string, approved?: boolean) {
  return apiFetch<SectionDraft>(`/projects/${projectId}/drafts/section/${sectionId}`, {
    method: "PATCH",
    body: JSON.stringify({ content, approved }),
  });
}

export async function assembleDraft(projectId: string) {
  return apiFetch<{ sections: Array<{ sectionId: string; sectionName: string; content: string; wordCount: number }>; totalWords: number; fullText: string }>(`/projects/${projectId}/drafts/assemble`, {
    method: "POST",
  });
}

// Revision
export async function reviseStructure(projectId: string) {
  return apiFetch<{ suggestions: string }>(`/projects/${projectId}/revision/structure`, { method: "POST" });
}

export async function reviseStyle(projectId: string, sectionId?: string) {
  return apiFetch<{ revisedText: string }>(`/projects/${projectId}/revision/style`, {
    method: "POST",
    body: JSON.stringify({ sectionId }),
  });
}

export async function reviseCitations(projectId: string) {
  return apiFetch<{ bibliography: string }>(`/projects/${projectId}/revision/citations`, { method: "POST" });
}

export async function approveRevision(projectId: string) {
  return apiFetch(`/projects/${projectId}/revision/approve`, { method: "POST" });
}

// Word count
export async function getWordBudget(projectId: string) {
  return apiFetch<WordBudgetOutput>(`/projects/${projectId}/word-budget/recalculate`, { method: "POST" });
}

// Export
export async function exportDocx(projectId: string) {
  return apiFetch(`/projects/${projectId}/export/docx`, { method: "POST" });
}

export async function exportPdf(projectId: string) {
  return apiFetch(`/projects/${projectId}/export/pdf`, { method: "POST" });
}

// Feedback
export async function createComment(
  projectId: string,
  data: { artifactType: FeedbackComment["artifactType"]; artifactId: string; content: string },
) {
  return apiFetch<FeedbackComment>(`/projects/${projectId}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateComment(
  projectId: string,
  commentId: string,
  data: { resolved?: boolean; content?: string },
) {
  return apiFetch<FeedbackComment>(`/projects/${projectId}/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function regenerateWithFeedback(
  projectId: string,
  artifactType: "thesis" | "outline" | "section_draft",
  artifactId: string,
  feedback: string,
) {
  return apiFetch<{ regeneratedContent: string }>(`/projects/${projectId}/comments/regenerate`, {
    method: "POST",
    body: JSON.stringify({ artifactType, artifactId, feedback }),
  });
}
