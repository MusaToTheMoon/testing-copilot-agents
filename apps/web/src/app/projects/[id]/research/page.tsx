"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProject";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StageNav } from "@/components/project/StageNav";
import { SourceCard } from "@/components/project/SourceCard";
import { FeedbackPanel } from "@/components/project/FeedbackPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SourceDocument } from "@essay-app/types";
import { searchResearch, uploadSource, approveSource, deleteSource } from "@/lib/api";

// Search results returned from the LLM before they are saved to the project
type SearchResult = Omit<SourceDocument, "id" | "projectId" | "createdAt" | "approved" | "summary">;

export default function ResearchPage() {
  const params = useParams<{ id: string }>();
  const { project, sources, comments, isLoading, error, refetch } = useProject(params.id);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const result = await searchResearch(params.id, query);
      setSearchResults((result.data?.sources as SearchResult[]) ?? []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToProject = async (source: SearchResult, idx: number) => {
    setAddingIndex(idx);
    try {
      await uploadSource(params.id, source);
      // Remove the result from search list so the user knows it was added
      setSearchResults((prev) => prev.filter((_, i) => i !== idx));
      await refetch();
    } catch (err) {
      console.error("Failed to add source:", err);
    } finally {
      setAddingIndex(null);
    }
  };

  const handleApprove = async (sourceId: string, approved: boolean) => {
    try {
      await approveSource(params.id, sourceId, approved);
      await refetch();
    } catch (err) {
      console.error("Failed to update source:", err);
    }
  };

  const handleDelete = async (sourceId: string) => {
    try {
      await deleteSource(params.id, sourceId);
      await refetch();
    } catch (err) {
      console.error("Failed to delete source:", err);
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

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500">{error}</p>
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
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Find Sources</h2>
              <form onSubmit={(e) => void handleSearch(e)} className="flex gap-3">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for academic sources..."
                  className="flex-1"
                />
                <Button type="submit" isLoading={isSearching}>
                  Search
                </Button>
              </form>
              {searchError && <p className="text-sm text-red-600 mt-2">{searchError}</p>}

              {searchResults.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">Search Results</h3>
                  {searchResults.map((source, idx) => (
                    <div key={`${source.title}-${idx}`} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{source.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {source.authors.join(", ")}
                            {source.year ? ` (${source.year})` : ""}
                          </p>
                          {source.abstract && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{source.abstract}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          isLoading={addingIndex === idx}
                          onClick={() => void handleAddToProject(source, idx)}
                        >
                          Add to Project
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Existing sources */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Project Sources ({sources.length})
              </h2>
              {sources.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No sources added yet. Search for sources above.
                </p>
              ) : (
                <div className="space-y-3">
                  {sources.map((source) => (
                    <SourceCard
                      key={source.id}
                      source={source}
                      onApprove={handleApprove}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar panels */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Research Tips</h3>
              <ul className="text-xs text-gray-600 space-y-1.5">
                <li>• Search for your essay topic and related concepts</li>
                <li>• Approve sources that are most relevant</li>
                <li>• Aim for 5–10 approved sources before proceeding</li>
                <li>• You can upload sources manually using the API</li>
              </ul>
            </div>

            <FeedbackPanel
              projectId={params.id}
              artifactType="source_set"
              artifactId={params.id}
              comments={comments.filter((c) => c.artifactType === "source_set")}
              onCommentAdded={() => void refetch()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
