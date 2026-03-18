import type { LLMRequest, LLMResponse, TaskType } from "@essay-app/llm";
import { getModelForTask, estimateCost } from "@essay-app/llm";

const MOCK_RESPONSES: Record<TaskType, string> = {
  research_query: JSON.stringify({
    sources: [
      {
        title: "The Impact of Technology on Education",
        authors: ["Smith, J.", "Doe, A."],
        year: 2023,
        type: "journal",
        abstract:
          "This study examines how digital tools transform learning environments and student outcomes.",
        relevanceScore: 0.92,
      },
      {
        title: "Digital Transformation in Modern Classrooms",
        authors: ["Johnson, M."],
        year: 2022,
        type: "book",
        abstract:
          "A comprehensive overview of technology integration strategies for educators.",
        relevanceScore: 0.85,
      },
    ],
  }),
  source_summarization:
    "This source provides key insights into the topic, presenting empirical evidence that supports the central argument. The authors demonstrate through longitudinal research that the effects are measurable and statistically significant across diverse populations.",
  thesis_generation: JSON.stringify({
    thesis:
      "The integration of artificial intelligence in higher education fundamentally reshapes pedagogical approaches, demanding new competencies from both educators and students while simultaneously democratizing access to personalized learning.",
    supportingArguments: [
      "AI-powered adaptive learning systems demonstrate improved student outcomes across diverse demographics.",
      "Automated feedback mechanisms reduce educator workload while increasing response quality.",
      "Natural language processing tools lower barriers for non-native English speakers.",
    ],
    counterarguments: [
      "Over-reliance on AI may diminish critical thinking development.",
      "Data privacy concerns limit adoption in K-12 environments.",
    ],
    evidenceLinks: [],
    claimToSourceMapping: [],
    conclusionIntent:
      "Advocate for a balanced integration approach that preserves human mentorship while leveraging AI efficiency.",
  }),
  outline_generation: JSON.stringify({
    sections: [
      { id: "intro", name: "Introduction", goal: "Present the thesis and context", targetWords: 300, sourceIds: [], order: 1 },
      { id: "background", name: "Background", goal: "Establish historical and theoretical context", targetWords: 500, sourceIds: [], order: 2 },
      { id: "analysis1", name: "Analysis: Pedagogical Impact", goal: "Examine changes in teaching methods", targetWords: 600, sourceIds: [], order: 3 },
      { id: "analysis2", name: "Analysis: Student Outcomes", goal: "Evaluate empirical evidence on learning", targetWords: 600, sourceIds: [], order: 4 },
      { id: "counterargument", name: "Counterarguments & Rebuttals", goal: "Address opposing viewpoints fairly", targetWords: 400, sourceIds: [], order: 5 },
      { id: "conclusion", name: "Conclusion", goal: "Synthesize findings and restate thesis", targetWords: 300, sourceIds: [], order: 6 },
    ],
  }),
  section_draft:
    "The intersection of artificial intelligence and higher education represents one of the most profound shifts in pedagogical history. As machine learning algorithms grow increasingly sophisticated, their application within academic contexts moves beyond novelty into genuine instructional utility. This transformation is not merely technological but epistemological—reshaping how knowledge is transmitted, assessed, and internalized by students across disciplines.\n\nResearch consistently demonstrates that AI-powered adaptive learning platforms outperform traditional one-size-fits-all instructional models. By continuously analyzing individual student performance data, these systems identify knowledge gaps with remarkable precision and adjust content delivery accordingly. The result is a personalized learning trajectory that traditional classroom instruction cannot replicate at scale.",
  revision:
    "The integration of artificial intelligence in higher education represents a fundamental paradigm shift in how knowledge is transmitted and assessed. Contemporary adaptive learning platforms leverage machine learning algorithms to identify individual knowledge gaps and adjust content delivery in real time, producing demonstrably superior outcomes compared to traditional instructional models. This technological evolution demands a corresponding evolution in pedagogical philosophy.",
  citation_formatting:
    "Smith, J., & Doe, A. (2023). The impact of technology on education. *Journal of Educational Technology*, 45(2), 112–134. https://doi.org/10.1000/xyz123",
};

function createMockResponse(taskType: TaskType, content: string): LLMResponse {
  const { model, provider } = getModelForTask(taskType);
  const promptTokens = 150;
  const completionTokens = Math.ceil(content.length / 4);
  return {
    content,
    provider,
    model,
    promptTokens,
    completionTokens,
    cost: estimateCost(model, promptTokens + completionTokens),
    latencyMs: Math.floor(Math.random() * 800) + 200,
  };
}

export async function completeLLM(request: LLMRequest): Promise<LLMResponse> {
  const { provider, model } = getModelForTask(request.taskType);
  const openAiKey = process.env["OPENAI_API_KEY"];

  // Use mock mode when no API key is configured
  if (!openAiKey) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const mockContent = MOCK_RESPONSES[request.taskType] ?? "Mock response for " + request.taskType;
    return createMockResponse(request.taskType, mockContent);
  }

  // Real OpenAI call
  const startTime = Date.now();
  const requestBody = {
    model,
    messages: [
      { role: "system", content: request.systemPrompt },
      { role: "user", content: request.userPrompt },
    ],
    max_tokens: request.maxTokens ?? 2000,
    temperature: request.temperature ?? 0.7,
    ...(request.jsonMode ? { response_format: { type: "json_object" } } : {}),
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage: { prompt_tokens: number; completion_tokens: number };
  };

  const content = data.choices[0]?.message.content ?? "";
  const promptTokens = data.usage.prompt_tokens;
  const completionTokens = data.usage.completion_tokens;
  const latencyMs = Date.now() - startTime;

  return {
    content,
    provider,
    model,
    promptTokens,
    completionTokens,
    cost: estimateCost(model, promptTokens + completionTokens),
    latencyMs,
  };
}
