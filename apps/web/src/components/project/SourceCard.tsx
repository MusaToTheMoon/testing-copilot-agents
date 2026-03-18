"use client";

import type { SourceDocument } from "@essay-app/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface SourceCardProps {
  source: SourceDocument;
  onApprove?: (sourceId: string, approved: boolean) => void;
  onDelete?: (sourceId: string) => void;
}

export function SourceCard({ source, onApprove, onDelete }: SourceCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="default">{source.type}</Badge>
            {source.approved && <Badge variant="success">Approved</Badge>}
            {source.relevanceScore !== undefined && (
              <Badge variant="info">
                {Math.round(source.relevanceScore * 100)}% relevant
              </Badge>
            )}
          </div>
          <h4 className="text-sm font-medium text-gray-900 truncate">{source.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {source.authors.join(", ")}
            {source.year ? ` (${source.year})` : ""}
          </p>
          {source.summary && (
            <p className="text-xs text-gray-600 mt-2 line-clamp-3">{source.summary}</p>
          )}
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-600 hover:underline mt-1 block truncate"
            >
              {source.url}
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        {onApprove && (
          <Button
            variant={source.approved ? "secondary" : "primary"}
            size="sm"
            onClick={() => onApprove(source.id, !source.approved)}
          >
            {source.approved ? "Unapprove" : "Approve"}
          </Button>
        )}
        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(source.id)}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
