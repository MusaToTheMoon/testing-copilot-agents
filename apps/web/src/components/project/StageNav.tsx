"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { WorkflowStage } from "@essay-app/types";
import { STAGE_LABELS } from "@essay-app/workflow";

interface StageStep {
  stage: WorkflowStage;
  href: string;
  label: string;
}

const STAGE_STEPS: StageStep[] = [
  { stage: "RESEARCHING", href: "research", label: "Research" },
  { stage: "THESIS_DRAFTED", href: "thesis", label: "Thesis" },
  { stage: "OUTLINE_DRAFTED", href: "outline", label: "Outline" },
  { stage: "DRAFTING", href: "draft", label: "Draft" },
  { stage: "REVISING", href: "revision", label: "Revision" },
  { stage: "READY_TO_EXPORT", href: "export", label: "Export" },
];

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

interface StageNavProps {
  projectId: string;
  currentStage: WorkflowStage;
}

export function StageNav({ projectId, currentStage }: StageNavProps) {
  const pathname = usePathname();
  const currentStageIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <nav className="bg-white border-b border-gray-200 px-6">
      <div className="flex items-center gap-1 overflow-x-auto">
        {STAGE_STEPS.map((step, idx) => {
          const stepStageIndex = STAGE_ORDER.indexOf(step.stage);
          const isCompleted = currentStageIndex > stepStageIndex;
          const isCurrent = pathname.includes(step.href);
          const isAccessible = currentStageIndex >= stepStageIndex;

          return (
            <div key={step.stage} className="flex items-center">
              {idx > 0 && (
                <span className="mx-2 text-gray-300">›</span>
              )}
              <Link
                href={isAccessible ? `/projects/${projectId}/${step.href}` : "#"}
                className={clsx(
                  "px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  isCurrent
                    ? "border-primary-600 text-primary-600"
                    : isCompleted
                    ? "border-transparent text-gray-500 hover:text-gray-700"
                    : isAccessible
                    ? "border-transparent text-gray-600 hover:text-gray-900"
                    : "border-transparent text-gray-300 cursor-not-allowed pointer-events-none",
                )}
                aria-current={isCurrent ? "page" : undefined}
              >
                {isCompleted && <span className="mr-1">✓</span>}
                {step.label}
              </Link>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export { STAGE_LABELS };
