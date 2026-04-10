import type { AIProvider, AICategorizeRequest, AICategorizeResponse } from "../types";

/**
 * Convert a JSON Schema object to Gemini's OpenAPI 3.0 subset.
 * Gemini rejects `additionalProperties`, so we strip it recursively.
 */
function toGeminiSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === "additionalProperties") continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = toGeminiSchema(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export const geminiProvider: AIProvider = {
  id: "gemini",
  name: "Google Gemini",
  defaultModel: "gemini-2.5-flash",
  models: [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
  ],
  apiKeyPlaceholder: "AIza...",
  apiDomain: "generativelanguage.googleapis.com",

  async categorize(request: AICategorizeRequest): Promise<AICategorizeResponse> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${request.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: request.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: request.systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: request.userContent }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: toGeminiSchema(request.jsonSchema as Record<string, unknown>),
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
      throw new Error(`Gemini request failed (HTTP ${res.status})${detail ? `: ${detail}` : ""}. Check your API key and try again.`);
    }

    const completion = await res.json();
    const totalTokens = completion.usageMetadata?.totalTokenCount ?? 0;

    const text = completion.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      const finishReason = completion.candidates?.[0]?.finishReason;
      if (finishReason === "SAFETY") {
        throw new Error("Gemini blocked the request due to safety filters. Try a different model or rephrase.");
      }
      throw new Error("Empty response from Gemini");
    }

    let parsed: { mappings?: { key: string; category: string }[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      // Fallback: try to extract JSON from the response text
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          throw new Error("Gemini returned invalid JSON. Please try again.");
        }
      } else {
        throw new Error("Gemini returned invalid JSON. Please try again.");
      }
    }

    return {
      mappings: parsed.mappings ?? [],
      tokensUsed: totalTokens,
    };
  },
};
