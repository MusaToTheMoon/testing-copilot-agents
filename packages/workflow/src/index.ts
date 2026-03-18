import type { WorkflowStage } from "@essay-app/types";

type Transition = {
  from: WorkflowStage;
  to: WorkflowStage;
  action: string;
};

const TRANSITIONS: Transition[] = [
  { from: "CREATED", to: "RESEARCHING", action: "START_RESEARCH" },
  { from: "RESEARCHING", to: "SOURCES_APPROVED", action: "APPROVE_SOURCES" },
  { from: "SOURCES_APPROVED", to: "THESIS_DRAFTED", action: "GENERATE_THESIS" },
  { from: "THESIS_DRAFTED", to: "THESIS_APPROVED", action: "APPROVE_THESIS" },
  { from: "THESIS_APPROVED", to: "OUTLINE_DRAFTED", action: "GENERATE_OUTLINE" },
  { from: "OUTLINE_DRAFTED", to: "OUTLINE_APPROVED", action: "APPROVE_OUTLINE" },
  { from: "OUTLINE_APPROVED", to: "DRAFTING", action: "START_DRAFTING" },
  { from: "DRAFTING", to: "REVISING", action: "START_REVISION" },
  { from: "REVISING", to: "READY_TO_EXPORT", action: "APPROVE_REVISION" },
  { from: "READY_TO_EXPORT", to: "EXPORTED", action: "EXPORT" },
];

export function canTransition(from: WorkflowStage, action: string): boolean {
  return TRANSITIONS.some((t) => t.from === from && t.action === action);
}

export function getNextStage(from: WorkflowStage, action: string): WorkflowStage | null {
  const transition = TRANSITIONS.find((t) => t.from === from && t.action === action);
  return transition ? transition.to : null;
}

export function getAvailableActions(stage: WorkflowStage): string[] {
  return TRANSITIONS.filter((t) => t.from === stage).map((t) => t.action);
}

export function getPreviousStage(stage: WorkflowStage): WorkflowStage | null {
  const STAGE_ORDER: WorkflowStage[] = [
    "CREATED",
    "RESEARCHING",
    "SOURCES_APPROVED",
    "THESIS_DRAFTED",
    "THESIS_APPROVED",
    "OUTLINE_DRAFTED",
    "OUTLINE_APPROVED",
    "DRAFTING",
    "REVISING",
    "READY_TO_EXPORT",
    "EXPORTED",
  ];
  const idx = STAGE_ORDER.indexOf(stage);
  return idx > 0 ? STAGE_ORDER[idx - 1] ?? null : null;
}

export const STAGE_LABELS: Record<WorkflowStage, string> = {
  CREATED: "Project Created",
  RESEARCHING: "Research",
  SOURCES_APPROVED: "Sources Approved",
  THESIS_DRAFTED: "Thesis Drafted",
  THESIS_APPROVED: "Thesis Approved",
  OUTLINE_DRAFTED: "Outline Drafted",
  OUTLINE_APPROVED: "Outline Approved",
  DRAFTING: "Drafting",
  REVISING: "Revising",
  READY_TO_EXPORT: "Ready to Export",
  EXPORTED: "Exported",
};
