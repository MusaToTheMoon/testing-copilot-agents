import type { WordBudgetInput, WordBudgetOutput } from "@essay-app/types";

export function countWords(text: string): number {
  if (!text || text.trim() === "") return 0;
  // Strip HTML/markdown formatting
  const stripped = text
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_~`[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped === "") return 0;
  return stripped.split(" ").length;
}

export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 0.75 words
  return Math.ceil(countWords(text) / 0.75);
}

export function calculateWordBudget(input: WordBudgetInput): WordBudgetOutput {
  const tolerance = input.tolerancePercent ?? 5;

  const sectionStats = input.sections.map((section) => {
    const currentWords = countWords(section.currentText ?? "");
    const delta = currentWords - section.targetWords;
    const toleranceWords = Math.round((section.targetWords * tolerance) / 100);

    let status: "under" | "on_target" | "over";
    if (Math.abs(delta) <= toleranceWords) {
      status = "on_target";
    } else if (delta < 0) {
      status = "under";
    } else {
      status = "over";
    }

    return {
      id: section.id,
      currentWords,
      targetWords: section.targetWords,
      delta,
      status,
    };
  });

  const totalCurrentWords = sectionStats.reduce((sum, s) => sum + s.currentWords, 0);
  const totalTargetWords = input.targetWords;
  const remainingWords = totalTargetWords - totalCurrentWords;

  const overSections = sectionStats.filter((s) => s.status === "over");
  const underSections = sectionStats.filter((s) => s.status === "under");

  let recommendation = "";
  if (
    Math.abs(totalCurrentWords - totalTargetWords) <=
    Math.round((totalTargetWords * tolerance) / 100)
  ) {
    recommendation = `Essay is on target at ${totalCurrentWords} words (target: ${totalTargetWords}).`;
  } else if (remainingWords > 0) {
    recommendation = `Add approximately ${remainingWords} more words to reach the target of ${totalTargetWords}.${
      underSections.length > 0
        ? ` Focus on expanding: ${underSections.map((s) => s.id).join(", ")}.`
        : ""
    }`;
  } else {
    recommendation = `Essay is ${Math.abs(remainingWords)} words over target.${
      overSections.length > 0
        ? ` Consider trimming: ${overSections.map((s) => s.id).join(", ")}.`
        : ""
    }`;
  }

  return {
    totalCurrentWords,
    totalTargetWords,
    remainingWords,
    sectionStats,
    recommendation,
  };
}

export function allocateSectionBudgets(
  totalWords: number,
  sectionCount: number,
): { intro: number; body: number[]; conclusion: number } {
  const intro = Math.round(totalWords * 0.1);
  const conclusion = Math.round(totalWords * 0.15);
  const bodyTotal = totalWords - intro - conclusion;
  const bodyPerSection = Math.round(bodyTotal / sectionCount);
  const body = Array<number>(sectionCount).fill(bodyPerSection);
  return { intro, body, conclusion };
}
