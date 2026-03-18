"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useProject } from "@/hooks/useProject";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StageNav } from "@/components/project/StageNav";
import { WordCountPanel } from "@/components/project/WordCountPanel";
import { Button } from "@/components/ui/Button";
import { reviseStructure, reviseStyle, reviseCitations, approveRevision } from "@/lib/api";

export default function RevisionPage() {
  const params = useParams<{ id: string }>();
  const { project, isLoading, error, refetch } = useProject(params.id);
  const [structureSuggestions, setStructureSuggestions] = useState<string | null>(null);
  const [bibliography, setBibliography] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const runTask = async (
    taskKey: string,
    fn: () => Promise<unknown>,
  ) => {
    setIsRunning(taskKey);
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsRunning(null);
    }
  };

  const handleStructure = () =>
    runTask("structure", async () => {
      const result = await reviseStructure(params.id);
      if (result.data) setStructureSuggestions(result.data.suggestions);
    });

  const handleStyle = () =>
    runTask("style", async () => {
      await reviseStyle(params.id);
      await refetch();
    });

  const handleCitations = () =>
    runTask("citations", async () => {
      const result = await reviseCitations(params.id);
      if (result.data) setBibliography(result.data.bibliography);
    });

  const handleApprove = () =>
    runTask("approve", async () => {
      await approveRevision(params.id);
      await refetch();
    });

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

            {/* Revision actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Revision Passes</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <button
                  onClick={() => void handleStructure()}
                  disabled={isRunning !== null}
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left disabled:opacity-50"
                >
                  <span className="text-2xl mb-2">🏗️</span>
                  <span className="text-sm font-medium text-gray-900">Structure</span>
                  <span className="text-xs text-gray-500 text-center mt-1">
                    Analyze argument flow and coherence
                  </span>
                  {isRunning === "structure" && (
                    <span className="text-xs text-primary-600 mt-2">Running...</span>
                  )}
                </button>

                <button
                  onClick={() => void handleStyle()}
                  disabled={isRunning !== null}
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left disabled:opacity-50"
                >
                  <span className="text-2xl mb-2">✨</span>
                  <span className="text-sm font-medium text-gray-900">Style</span>
                  <span className="text-xs text-gray-500 text-center mt-1">
                    Improve clarity and tone
                  </span>
                  {isRunning === "style" && (
                    <span className="text-xs text-primary-600 mt-2">Running...</span>
                  )}
                </button>

                <button
                  onClick={() => void handleCitations()}
                  disabled={isRunning !== null}
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left disabled:opacity-50"
                >
                  <span className="text-2xl mb-2">📚</span>
                  <span className="text-sm font-medium text-gray-900">Citations</span>
                  <span className="text-xs text-gray-500 text-center mt-1">
                    Format bibliography
                  </span>
                  {isRunning === "citations" && (
                    <span className="text-xs text-primary-600 mt-2">Running...</span>
                  )}
                </button>
              </div>
            </div>

            {/* Structure suggestions */}
            {structureSuggestions && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Structure Suggestions
                </h3>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {structureSuggestions}
                </div>
              </div>
            )}

            {/* Bibliography */}
            {bibliography && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Generated Bibliography ({project?.citationStyle})
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 font-mono whitespace-pre-wrap">
                  {bibliography}
                </div>
              </div>
            )}

            {/* Approve revision */}
            {project?.stage === "REVISING" && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Ready to export?
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Once you approve the revision, you can export your essay.
                </p>
                <Button
                  onClick={() => void handleApprove()}
                  isLoading={isRunning === "approve"}
                >
                  Approve & Proceed to Export →
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <WordCountPanel projectId={params.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
