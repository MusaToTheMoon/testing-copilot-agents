"use client";

import { useEffect } from "react";
import { useWordCount } from "@/hooks/useWordCount";
import { Button } from "@/components/ui/Button";
import { clsx } from "clsx";

interface WordCountPanelProps {
  projectId: string;
}

export function WordCountPanel({ projectId }: WordCountPanelProps) {
  const { budget, isLoading, error, recalculate } = useWordCount(projectId);

  useEffect(() => {
    void recalculate();
  }, [recalculate]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Word Budget</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void recalculate()}
          isLoading={isLoading}
        >
          Refresh
        </Button>
      </div>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {budget && (
        <>
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>
                {budget.totalCurrentWords.toLocaleString()} / {budget.totalTargetWords.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={clsx("h-2 rounded-full transition-all", {
                  "bg-green-500": budget.totalCurrentWords <= budget.totalTargetWords,
                  "bg-red-500": budget.totalCurrentWords > budget.totalTargetWords,
                })}
                style={{
                  width: `${Math.min((budget.totalCurrentWords / budget.totalTargetWords) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-3">{budget.recommendation}</p>

          <div className="space-y-2">
            {budget.sectionStats.map((stat) => (
              <div key={stat.id} className="flex items-center gap-2">
                <span
                  className={clsx("w-2 h-2 rounded-full flex-shrink-0", {
                    "bg-green-500": stat.status === "on_target",
                    "bg-yellow-400": stat.status === "under",
                    "bg-red-500": stat.status === "over",
                  })}
                />
                <span className="text-xs text-gray-700 flex-1 truncate">{stat.id}</span>
                <span className="text-xs text-gray-500">
                  {stat.currentWords}/{stat.targetWords}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {!budget && !isLoading && (
        <p className="text-xs text-gray-500">No word budget data yet.</p>
      )}
    </div>
  );
}
