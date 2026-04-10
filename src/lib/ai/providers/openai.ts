import type { AIProvider, AICategorizeRequest, AICategorizeResponse } from "../types";

export const openaiProvider: AIProvider = {
  id: "openai",
  name: "OpenAI",
  defaultModel: "gpt-5-mini",
  models: [
    { id: "gpt-5-mini", name: "GPT-5 Mini" },
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
    { id: "gpt-4.1-nano", name: "GPT-4.1 Nano" },
    { id: "o4-mini", name: "o4-mini" },
  ],
  apiKeyPlaceholder: "sk-...",
  apiDomain: "api.openai.com",

  async categorize(request: AICategorizeRequest): Promise<AICategorizeResponse> {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${request.apiKey}`,
      },
      signal: request.signal,
      body: JSON.stringify({
        model: request.model,
        input: [
          { role: "developer", content: request.systemPrompt },
          { role: "user", content: request.userContent },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "categorization",
            strict: true,
            schema: request.jsonSchema,
          },
        },
        reasoning: { effort: "minimal" },
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI request failed (HTTP ${res.status}). Check your API key and try again.`);
    }

    const completion = await res.json();
    const totalTokens = completion.usage?.total_tokens ?? 0;
    const content = completion.output_text
      ?? completion.output?.find((o: { type: string }) => o.type === "message")?.content?.[0]?.text;

    if (!content) throw new Error("Empty response from OpenAI");

    let parsed: { mappings?: { key: string; category: string }[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("OpenAI returned invalid JSON. Please try again.");
    }

    return {
      mappings: parsed.mappings ?? [],
      tokensUsed: totalTokens,
    };
  },
};
