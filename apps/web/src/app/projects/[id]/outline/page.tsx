"use client";

import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProject";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StageNav } from "@/components/project/StageNav";
import { FeedbackPanel } from "@/components/project/FeedbackPanel";
import { Button } from "@/components/ui/Button";
import { generateOutline, approveOutline } from "@/lib/api";
import { useState } from "react";
import type { OutlineSection } from "@essay-app/types";

export default function OutlinePage() {
  const params = useParams<{ id: string }>();
  const { project, latestOutline, comments, isLoading, error, refetch } = useProject(params.id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setActionError(null);
    try {
      await generateOutline(params.id);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!latestOutline) return;
    setIsApproving(true);
    setActionError(null);
    try {
      await approveOutline(params.id, latestOutline.id);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  const sections = (latestOutline?.sections as OutlineSection[]) ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header project={project} />
        {project && <StageNav projectId={params.id} currentStage={project.stage} />}

        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {actionError}
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Essay Outline</h2>
                <Button onClick={() => void handleGenerate()} isLoading={isGenerating} size="sm">
                  {latestOutline ? "Regenerate" : "Generate Outline"}
                </Button>
              </div>

              {sections.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm">
                    No outline yet. Generate one based on your approved thesis.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <div
                        key={section.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-400">
                                {section.order}.
                              </span>
                              <h3 className="text-sm font-semibold text-gray-900">
                                {section.name}
                              </h3>
                              <span className="text-xs text-gray-400">
                                ~{section.targetWords} words
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">{section.goal}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                  {!latestOutline?.approved && (
                    <div className="flex gap-3 pt-2">
                      <Button onClick={() => void handleApprove()} isLoading={isApproving}>
                        Approve Outline →
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => void handleGenerate()}
                        isLoading={isGenerating}
                      >
                        Regenerate
                      </Button>
                    </div>
                  )}

                  {latestOutline?.approved && (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                      <span>✓</span> Outline approved
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Total:{" "}
                {sections.reduce((s, sec) => s + sec.targetWords, 0).toLocaleString()} words
              </h3>
              <div className="space-y-1">
                {sections.map((s) => (
                  <div key={s.id} className="flex justify-between text-xs text-gray-600">
                    <span>{s.name}</span>
                    <span>{s.targetWords} words</span>
                  </div>
                ))}
              </div>
            </div>

            {latestOutline && (
              <FeedbackPanel
                projectId={params.id}
                artifactType="outline"
                artifactId={latestOutline.id}
                comments={comments.filter((c) => c.artifactType === "outline")}
                onCommentAdded={() => void refetch()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
