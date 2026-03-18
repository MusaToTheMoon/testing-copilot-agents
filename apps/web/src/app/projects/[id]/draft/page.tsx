"use client";

import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProject";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StageNav } from "@/components/project/StageNav";
import { FeedbackPanel } from "@/components/project/FeedbackPanel";
import { WordCountPanel } from "@/components/project/WordCountPanel";
import { Button } from "@/components/ui/Button";
import { generateSectionDraft, updateSectionDraft } from "@/lib/api";
import { useState } from "react";
import type { OutlineSection } from "@essay-app/types";

export default function DraftPage() {
  const params = useParams<{ id: string }>();
  const { project, latestOutline, sectionDrafts, comments, isLoading, error, refetch } = useProject(params.id);
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const sections = (latestOutline?.sections as OutlineSection[]) ?? [];

  const handleGenerate = async (sectionId: string) => {
    setGeneratingSectionId(sectionId);
    setActionError(null);
    try {
      await generateSectionDraft(params.id, sectionId);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGeneratingSectionId(null);
    }
  };

  const handleEdit = (sectionId: string) => {
    const draft = sectionDrafts.find((d) => d.sectionId === sectionId);
    setEditContent(draft?.content ?? "");
    setEditingSection(sectionId);
  };

  const handleSave = async (sectionId: string) => {
    try {
      await updateSectionDraft(params.id, sectionId, editContent);
      await refetch();
      setEditingSection(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Save failed");
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

            {sections.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 text-center py-10">
                <p className="text-gray-500">
                  No approved outline found. Please complete the outline stage first.
                </p>
              </div>
            )}

            {sections.sort((a, b) => a.order - b.order).map((section) => {
              const draft = sectionDrafts.find((d) => d.sectionId === section.id);
              const isGenerating = generatingSectionId === section.id;
              const isEditing = editingSection === section.id;

              return (
                <div key={section.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{section.name}</h3>
                      <p className="text-xs text-gray-500">
                        Target: {section.targetWords} words
                        {draft ? ` · Current: ${draft.wordCount} words` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {draft && !isEditing && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(section.id)}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => void handleGenerate(section.id)}
                        isLoading={isGenerating}
                      >
                        {draft ? "Regenerate" : "Generate"}
                      </Button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={12}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y font-mono"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void handleSave(section.id)}>
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingSection(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : draft ? (
                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {draft.content}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-400">
                        Click &quot;Generate&quot; to draft this section
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <WordCountPanel projectId={params.id} />

            <FeedbackPanel
              projectId={params.id}
              artifactType="section_draft"
              artifactId={params.id}
              comments={comments.filter((c) => c.artifactType === "section_draft")}
              onCommentAdded={() => void refetch()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
