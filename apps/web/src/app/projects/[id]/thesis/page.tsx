"use client";

import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProject";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StageNav } from "@/components/project/StageNav";
import { FeedbackPanel } from "@/components/project/FeedbackPanel";
import { Button } from "@/components/ui/Button";
import { generateThesis, approveThesis } from "@/lib/api";
import { useState } from "react";

export default function ThesisPage() {
  const params = useParams<{ id: string }>();
  const { project, latestThesis, comments, isLoading, error, refetch } = useProject(params.id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setActionError(null);
    try {
      await generateThesis(params.id);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!latestThesis) return;
    setIsApproving(true);
    setActionError(null);
    try {
      await approveThesis(params.id, latestThesis.id);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

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
                <h2 className="text-lg font-semibold text-gray-900">Thesis Statement</h2>
                <Button onClick={() => void handleGenerate()} isLoading={isGenerating} size="sm">
                  {latestThesis ? "Regenerate" : "Generate Thesis"}
                </Button>
              </div>

              {!latestThesis ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm mb-4">
                    No thesis generated yet. Click &quot;Generate Thesis&quot; to create one from your approved sources.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-900 leading-relaxed">{latestThesis.thesis}</p>
                  </div>

                  {latestThesis.supportingArguments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Supporting Arguments
                      </h3>
                      <ul className="space-y-1.5">
                        {latestThesis.supportingArguments.map((arg, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-700">
                            <span className="text-green-500 flex-shrink-0">✓</span>
                            {arg}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {latestThesis.counterarguments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Counterarguments</h3>
                      <ul className="space-y-1.5">
                        {latestThesis.counterarguments.map((arg, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-700">
                            <span className="text-orange-400 flex-shrink-0">↔</span>
                            {arg}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {latestThesis.conclusionIntent && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">
                        Conclusion Intent
                      </h3>
                      <p className="text-sm text-gray-600">{latestThesis.conclusionIntent}</p>
                    </div>
                  )}

                  {!latestThesis.approved && (
                    <div className="flex gap-3 pt-2">
                      <Button onClick={() => void handleApprove()} isLoading={isApproving}>
                        Approve Thesis →
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

                  {latestThesis.approved && (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                      <span>✓</span> Thesis approved
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Tips</h3>
              <ul className="text-xs text-gray-600 space-y-1.5">
                <li>• A strong thesis is arguable and specific</li>
                <li>• Ensure it reflects your approved sources</li>
                <li>• You can regenerate if unhappy with the result</li>
                <li>• Approve the thesis to proceed to outline</li>
              </ul>
            </div>

            {latestThesis && (
              <FeedbackPanel
                projectId={params.id}
                artifactType="thesis"
                artifactId={latestThesis.id}
                comments={comments.filter((c) => c.artifactType === "thesis")}
                onCommentAdded={() => void refetch()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
