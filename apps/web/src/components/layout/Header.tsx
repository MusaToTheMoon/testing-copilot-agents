import type { EssayProject } from "@essay-app/types";
import { Badge } from "@/components/ui/Badge";

interface HeaderProps {
  project?: EssayProject | null;
  title?: string;
}

const stageBadgeVariant: Record<string, "default" | "info" | "warning" | "success" | "error"> = {
  CREATED: "default",
  RESEARCHING: "info",
  SOURCES_APPROVED: "info",
  THESIS_DRAFTED: "warning",
  THESIS_APPROVED: "warning",
  OUTLINE_DRAFTED: "warning",
  OUTLINE_APPROVED: "warning",
  DRAFTING: "info",
  REVISING: "warning",
  READY_TO_EXPORT: "success",
  EXPORTED: "success",
};

export function Header({ project, title }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          {project?.title ?? title ?? "EssayAI"}
        </h1>
        {project && (
          <p className="text-sm text-gray-500 mt-0.5">
            {project.essayType.replace(/_/g, " ")} · {project.targetWordCount.toLocaleString()} words
          </p>
        )}
      </div>
      {project && (
        <Badge variant={stageBadgeVariant[project.stage] ?? "default"}>
          {project.stage.replace(/_/g, " ")}
        </Badge>
      )}
    </header>
  );
}
