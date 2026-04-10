import type { AIProvider, AICategorizeRequest, AICategorizeResponse } from "../types";

export const openrouterProvider: AIProvider = {
  id: "openrouter",
  name: "OpenRouter",
  defaultModel: "google/gemini-2.5-flash",
  models: [
    { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4" },
    { id: "openai/gpt-5-mini", name: "GPT-5 Mini" },
    { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini" },
    { id: "meta-llama/llama-4-maverick", name: "Llama 4 Maverick" },
  ],
  apiKeyPlaceholder: "sk-or-...",
  apiDomain: "openrouter.ai",

  async categorize(request: AICategorizeRequest): Promise<AICategorizeResponse> {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${request.apiKey}`,
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://monetos.app",
        "X-Title": "Monetos",
      },
      signal: request.signal,
      body: JSON.stringify({
        model: request.model,
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userContent },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "categorization",
            strict: true,
            schema: request.jsonSchema,
          },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let detail = "";
      try {
        const err = JSON.parse(body);
        detail = err.error?.message ?? "";
      } catch { /* ignore */ }
      throw new Error(`OpenRouter request failed (HTTP ${res.status})${detail ? `: ${detail}` : ""}. Check your API key and try again.`);
    }

    const completion = await res.json();
    const totalTokens = completion.usage?.total_tokens ?? 0;
    const content = completion.choices?.[0]?.message?.content;

    if (!content) throw new Error("Empty response from OpenRouter");

    let parsed: { mappings?: { key: string; category: string }[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("OpenRouter returned invalid JSON. Please try again.");
    }

    return {
      mappings: parsed.mappings ?? [],
      tokensUsed: totalTokens,
    };
  },
};
