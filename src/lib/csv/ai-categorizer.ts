import { Transaction, Category } from "@/types";

interface UniquePattern {
  key: string;
  name: string;
  description: string;
  isIncome: boolean;
  sampleAmount: number;
  count: number;
}

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

/**
 * Deduplicate transactions by (name + description) to create unique patterns.
 * Reduces ~1000 transactions to ~200 unique patterns for efficient API usage.
 */
export function deduplicateTransactions(transactions: Transaction[]): UniquePattern[] {
  const patternMap = new Map<string, UniquePattern>();

  for (const t of transactions) {
    const key = `${t.name}|||${t.description}`;
    const existing = patternMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      patternMap.set(key, {
        key,
        name: t.name,
        description: t.description,
        isIncome: t.isIncome,
        sampleAmount: t.amount,
        count: 1,
      });
    }
  }

  return Array.from(patternMap.values());
}

/**
 * Call the /api/categorize endpoint with deduped patterns.
 * Returns categorized transactions with AI-assigned category IDs.
 */
export async function aiCategorizeTransactions(
  transactions: Transaction[],
  categories: Category[],
  apiKey?: string,
  onProgress?: (stage: string, percent: number) => void
): Promise<AICategorizeResult> {
  onProgress?.("Deduplicating patterns...", 10);

  const patterns = deduplicateTransactions(transactions);

  onProgress?.("Sending to AI...", 30);

  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
    nameDA: c.nameDA,
    type: c.type,
  }));

  const response = await fetch("/api/categorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patterns,
      categories: categoryOptions,
      apiKey: apiKey || undefined,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "AI categorization failed");
  }

  const result = await response.json();
  const mapping: Record<string, string> = result.mapping;

  onProgress?.("Applying categories...", 80);

  let categorized = 0;
  const updatedTransactions = transactions.map((t) => {
    const key = `${t.name}|||${t.description}`;
    const categoryId = mapping[key];
    if (categoryId && categoryId !== "uncategorized" && categoryId !== "other_income") {
      categorized++;
    }
    return {
      ...t,
      categoryId: categoryId || (t.isIncome ? "other_income" : "uncategorized"),
    };
  });

  onProgress?.("Done!", 100);

  return {
    transactions: updatedTransactions,
    stats: {
      totalTransactions: transactions.length,
      uniquePatterns: patterns.length,
      categorized,
      tokensUsed: result.tokensUsed,
    },
  };
}
