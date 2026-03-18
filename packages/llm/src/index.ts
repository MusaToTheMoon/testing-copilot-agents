export type LLMProvider = "openai" | "anthropic" | "google";

export type TaskType =
  | "research_query"
  | "source_summarization"
  | "thesis_generation"
  | "outline_generation"
  | "section_draft"
  | "revision"
  | "citation_formatting";

export interface LLMRequest {
  taskType: TaskType;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  latencyMs: number;
}

// Task-to-model mapping based on capability requirements
const TASK_MODEL_MAP: Record<TaskType, { provider: LLMProvider; model: string }> = {
  research_query: { provider: "openai", model: "gpt-4o-mini" },
  source_summarization: { provider: "openai", model: "gpt-4o-mini" },
  thesis_generation: { provider: "openai", model: "gpt-4o" },
  outline_generation: { provider: "openai", model: "gpt-4o" },
  section_draft: { provider: "openai", model: "gpt-4o" },
  revision: { provider: "openai", model: "gpt-4o-mini" },
  citation_formatting: { provider: "openai", model: "gpt-4o-mini" },
};

export function getModelForTask(taskType: TaskType): { provider: LLMProvider; model: string } {
  return TASK_MODEL_MAP[taskType];
}

// Cost estimation per 1K tokens (input/output averaged)
const COST_PER_1K: Record<string, number> = {
  "gpt-4o-mini": 0.00015,
  "gpt-4o": 0.005,
  "claude-3-haiku-20240307": 0.00025,
  "claude-3-5-sonnet-20241022": 0.003,
};

export function estimateCost(model: string, totalTokens: number): number {
  const costPer1k = COST_PER_1K[model] ?? 0.002;
  return (totalTokens / 1000) * costPer1k;
}

export interface ProviderAdapter {
  complete(request: LLMRequest): Promise<LLMResponse>;
  name: LLMProvider;
}
