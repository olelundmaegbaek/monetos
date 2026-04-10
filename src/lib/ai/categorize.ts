import { Transaction, Category } from "@/types";
import type { AIProviderConfig } from "./types";
import { deduplicateTransactions, transactionToKey, buildCategorizationPrompt } from "./prompt-builder";
import { getProvider } from "./provider-registry";

export interface AICategorizeStats {
  totalTransactions: number;
  uniquePatterns: number;
  categorized: number;
  tokensUsed: number;
}

export interface AICategorizeResult {
  transactions: Transaction[];
  stats: AICategorizeStats;
}

export async function aiCategorizeTransactions(
  transactions: Transaction[],
  categories: Category[],
  providerConfig: AIProviderConfig,
  signal?: AbortSignal,
): Promise<AICategorizeResult> {
  if (!providerConfig.apiKey) throw new Error("No API key configured");

  const patterns = deduplicateTransactions(transactions);
  const { systemPrompt, userContent, jsonSchema } = buildCategorizationPrompt(patterns, categories);
  const categoryIds = categories.filter((c) => c.id !== "uncategorized").map((c) => c.id);

  const provider = getProvider(providerConfig.provider);
  const response = await provider.categorize({
    systemPrompt,
    userContent,
    jsonSchema,
    categoryIds,
    apiKey: providerConfig.apiKey,
    model: providerConfig.model,
    signal,
  });

  const mapping: Record<string, string> = {};
  for (const m of response.mappings) {
    mapping[m.key] = m.category;
  }

  let categorized = 0;
  const updatedTransactions = transactions.map((t) => {
    const key = transactionToKey(t);
    const categoryId = mapping[key];
    if (categoryId && categoryId !== "uncategorized" && categoryId !== "other_income") {
      categorized++;
    }
    return { ...t, categoryId: categoryId || (t.isIncome ? "other_income" : "uncategorized") };
  });

  return {
    transactions: updatedTransactions,
    stats: {
      totalTransactions: transactions.length,
      uniquePatterns: patterns.length,
      categorized,
      tokensUsed: response.tokensUsed,
    },
  };
}

export { deduplicateTransactions } from "./prompt-builder";
