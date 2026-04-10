export type AIProviderType = "openai" | "openrouter" | "gemini";

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  model: string;
}

export interface AIModelOption {
  id: string;
  name: string;
}

export interface AIProvider {
  readonly id: AIProviderType;
  readonly name: string;
  readonly defaultModel: string;
  readonly models: AIModelOption[];
  readonly apiKeyPlaceholder: string;
  readonly apiDomain: string;
  categorize(request: AICategorizeRequest): Promise<AICategorizeResponse>;
}

export interface AICategorizeRequest {
  systemPrompt: string;
  userContent: string;
  jsonSchema: object;
  categoryIds: string[];
  apiKey: string;
  model: string;
  signal?: AbortSignal;
}

export interface AICategorizeResponse {
  mappings: Array<{ key: string; category: string }>;
  tokensUsed: number;
}
