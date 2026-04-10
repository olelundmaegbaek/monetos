import type { AIProvider, AIProviderType } from "./types";
import { openaiProvider } from "./providers/openai";
import { openrouterProvider } from "./providers/openrouter";
import { geminiProvider } from "./providers/gemini";

const providers: Record<AIProviderType, AIProvider> = {
  openai: openaiProvider,
  openrouter: openrouterProvider,
  gemini: geminiProvider,
};

export function getProvider(type: AIProviderType): AIProvider {
  return providers[type];
}

export function getAllProviders(): AIProvider[] {
  return Object.values(providers);
}
