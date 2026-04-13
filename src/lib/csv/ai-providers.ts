import { AIProvider } from "@/types";

export interface ProviderDef {
  label: string;
  defaultModel: string;
  placeholder: string;
  getUrl: (model: string, apiKey: string) => string;
  getHeaders: (apiKey: string) => Record<string, string>;
  buildBody: (
    model: string,
    systemPrompt: string,
    userContent: string,
    schema: object
  ) => object;
  extractContent: (json: Record<string, unknown>) => string;
  extractTokens: (json: Record<string, unknown>) => number;
}

/** Recursively strip `additionalProperties` — Gemini doesn't support it. */
function stripAdditionalProperties(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(stripAdditionalProperties);
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === "additionalProperties") continue;
      out[k] = stripAdditionalProperties(v);
    }
    return out;
  }
  return obj;
}

export const AI_PROVIDERS: Record<AIProvider, ProviderDef> = {
  openai: {
    label: "OpenAI",
    defaultModel: "gpt-4.1-nano",
    placeholder: "sk-...",
    getUrl: () => "https://api.openai.com/v1/chat/completions",
    getHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    buildBody: (model, systemPrompt, userContent, schema) => ({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "categorization",
          strict: true,
          schema,
        },
      },
    }),
    extractContent: (json) => {
      const text = (
        json.choices as Array<{ message: { content: string } }>
      )?.[0]?.message?.content;
      if (!text) throw new Error("Empty response from OpenAI");
      return text;
    },
    extractTokens: (json) =>
      (json.usage as { total_tokens?: number })?.total_tokens ?? 0,
  },

  openrouter: {
    label: "OpenRouter",
    defaultModel: "google/gemini-3-flash-preview",
    placeholder: "sk-or-...",
    getUrl: () => "https://openrouter.ai/api/v1/chat/completions",
    getHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    buildBody: (model, systemPrompt, userContent, schema) => ({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "categorization",
          strict: true,
          schema,
        },
      },
    }),
    extractContent: (json) => {
      const text = (
        json.choices as Array<{ message: { content: string } }>
      )?.[0]?.message?.content;
      if (!text) throw new Error("Empty response from OpenRouter");
      return text;
    },
    extractTokens: (json) =>
      (json.usage as { total_tokens?: number })?.total_tokens ?? 0,
  },

  gemini: {
    label: "Google Gemini",
    defaultModel: "gemini-3-flash-preview",
    placeholder: "AI...",
    getUrl: (model, apiKey) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    getHeaders: () => ({
      "Content-Type": "application/json",
    }),
    buildBody: (_model, systemPrompt, userContent, schema) => {
      const geminiSchema = stripAdditionalProperties(schema);
      return {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: geminiSchema,
        },
      };
    },
    extractContent: (json) => {
      const text = (
        json.candidates as Array<{
          content: { parts: Array<{ text: string }> };
        }>
      )?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini");
      return text;
    },
    extractTokens: (json) =>
      (json.usageMetadata as { totalTokenCount?: number })?.totalTokenCount ??
      0,
  },
};
