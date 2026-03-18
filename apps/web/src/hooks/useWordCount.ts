"use client";

import { useState, useCallback } from "react";
import { getWordBudget } from "@/lib/api";
import type { WordBudgetOutput } from "@essay-app/types";

export function useWordCount(projectId: string) {
  const [budget, setBudget] = useState<WordBudgetOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recalculate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getWordBudget(projectId);
      if (result.data) setBudget(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate word budget");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  return { budget, isLoading, error, recalculate };
}
