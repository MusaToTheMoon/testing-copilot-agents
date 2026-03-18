import { countWords, calculateWordBudget } from "@essay-app/word-tools";
import type { WordBudgetInput, WordBudgetOutput } from "@essay-app/types";

export { countWords };

export function getWordBudget(input: WordBudgetInput): WordBudgetOutput {
  return calculateWordBudget(input);
}
