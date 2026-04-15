import { AIProvider } from "@/types";

export interface ProviderDef {
  label: string;
  defaultModel: string;
  placeholder: string;
  /** Whether this provider runs locally (affects UI warnings and API key requirements) */
  local?: boolean;
  defaultBaseUrl?: string;
  getUrl: (model: string, apiKey: string, baseUrl?: string) => string;
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

/** Shared OpenAI-compatible body builder (used by openai, openrouter, lmstudio) */
function openaiBody(model: string, systemPrompt: string, userContent: string, schema: object) {
  return {
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
  };
}

/** Shared OpenAI-compatible content extractor */
function openaiExtractContent(json: Record<string, unknown>, providerName: string): string {
  const text = (
    json.choices as Array<{ message: { content: string } }>
  )?.[0]?.message?.content;
  if (!text) throw new Error(`Empty response from ${providerName}`);
  return text;
}

/** Shared OpenAI-compatible token extractor */
function openaiExtractTokens(json: Record<string, unknown>): number {
  return (json.usage as { total_tokens?: number })?.total_tokens ?? 0;
}

export const AI_PROVIDERS: Record<AIProvider, ProviderDef> = {
  openai: {
    label: "OpenAI",
    defaultModel: "gpt-5.4-nano",
    placeholder: "sk-...",
    getUrl: (_m, _k, baseUrl) => `${baseUrl || "https://api.openai.com"}/v1/chat/completions`,
    getHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    buildBody: openaiBody,
    extractContent: (json) => openaiExtractContent(json, "OpenAI"),
    extractTokens: openaiExtractTokens,
  },

  openrouter: {
    label: "OpenRouter",
    defaultModel: "google/gemini-3.1-flash-lite-preview",
    placeholder: "sk-or-...",
    getUrl: (_m, _k, baseUrl) => `${baseUrl || "https://openrouter.ai"}/api/v1/chat/completions`,
    getHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    buildBody: openaiBody,
    extractContent: (json) => openaiExtractContent(json, "OpenRouter"),
    extractTokens: openaiExtractTokens,
  },

  gemini: {
    label: "Google Gemini",
    defaultModel: "gemini-3.1-flash-lite-preview",
    placeholder: "AI...",
    getUrl: (model, apiKey, baseUrl) =>
      `${baseUrl || "https://generativelanguage.googleapis.com"}/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
      (json.usageMetadata as { totalTokenCount?: number })?.totalTokenCount ?? 0,
  },

  ollama: {
    label: "Ollama (lokal)",
    defaultModel: "llama3.2",
    placeholder: "",
    local: true,
    defaultBaseUrl: "http://localhost:11434",
    getUrl: (_m, _k, baseUrl) => `${baseUrl || "http://localhost:11434"}/api/chat`,
    getHeaders: () => ({
      "Content-Type": "application/json",
    }),
    buildBody: (model, systemPrompt, userContent, schema) => ({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      format: schema,
      stream: false,
    }),
    extractContent: (json) => {
      const text = (json.message as { content?: string })?.content;
      if (!text) throw new Error("Empty response from Ollama");
      return text;
    },
    extractTokens: (json) =>
      (json.eval_count as number) ?? 0,
  },

  lmstudio: {
    label: "LM Studio (lokal)",
    defaultModel: "",
    placeholder: "",
    local: true,
    defaultBaseUrl: "http://localhost:1234",
    getUrl: (_m, _k, baseUrl) => `${baseUrl || "http://localhost:1234"}/v1/chat/completions`,
    getHeaders: () => ({
      "Content-Type": "application/json",
      Authorization: "Bearer lm-studio",
    }),
    buildBody: openaiBody,
    extractContent: (json) => openaiExtractContent(json, "LM Studio"),
    extractTokens: openaiExtractTokens,
  },
};
