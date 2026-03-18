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
import { searchResearch, approveSource, deleteSource } from "@/lib/api";

export default function ResearchPage() {
  const params = useParams<{ id: string }>();
  const { project, sources, comments, isLoading, error, refetch } = useProject(params.id);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<typeof sources>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const result = await searchResearch(params.id, query);
      setSearchResults((result.data?.sources as typeof sources) ?? []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
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
                    <SourceCard
                      key={idx}
                      source={{ ...source, id: source.id ?? `search-${idx}`, approved: false }}
                    />
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
