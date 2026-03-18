"use client";

import { useState, useEffect, useCallback } from "react";
import { getProject } from "@/lib/api";
import { useProjectStore } from "@/store/projectStore";

export function useProject(projectId: string) {
  const {
    project,
    sources,
    latestThesis,
    latestOutline,
    sectionDrafts,
    comments,
    isLoading,
    error,
    setProject,
    setSources,
    setLatestThesis,
    setLatestOutline,
    setSectionDrafts,
    setComments,
    setLoading,
    setError,
  } = useProjectStore();

  const fetchProject = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProject(projectId);
      if (result.data) {
        const { sources, thesisVersions, outlineVersions, sectionDrafts, comments, ...proj } = result.data;
        setProject(proj);
        setSources(sources);
        setLatestThesis(thesisVersions[0] ?? null);
        setLatestOutline(outlineVersions[0] ?? null);
        setSectionDrafts(sectionDrafts);
        setComments(comments);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId, setLoading, setError, setProject, setSources, setLatestThesis, setLatestOutline, setSectionDrafts, setComments]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  return {
    project,
    sources,
    latestThesis,
    latestOutline,
    sectionDrafts,
    comments,
    isLoading,
    error,
    refetch: fetchProject,
  };
}
