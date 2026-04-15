import { Transaction, Category, AIProviderConfig } from "@/types";
import { AI_PROVIDERS } from "./ai-providers";

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

/** Sanitize a string for use in transaction keys — strips the separator sequence. */
function sanitizeKeyPart(s: string): string {
  return s.replace(/\|{2,}/g, "|");
}

export function deduplicateTransactions(transactions: Transaction[]): UniquePattern[] {
  const patternMap = new Map<string, UniquePattern>();
  for (const t of transactions) {
    const key = `${sanitizeKeyPart(t.name)}|||${sanitizeKeyPart(t.description)}`;
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
 * Call an AI provider to categorize transactions.
 * Supports OpenAI, OpenRouter, and Google Gemini.
 */
export async function aiCategorizeTransactions(
  transactions: Transaction[],
  categories: Category[],
  providerConfig: AIProviderConfig,
  signal?: AbortSignal,
): Promise<AICategorizeResult> {
  const provider = AI_PROVIDERS[providerConfig.provider];
  if (!provider.local && !providerConfig.apiKey) throw new Error("No API key configured");

  const model = providerConfig.model || provider.defaultModel;
  const patterns = deduplicateTransactions(transactions);

  const incomeCats = categories
    .filter((c) => c.type === "income")
    .map((c) => `  "${c.id}": ${c.nameDA} (${c.name})`)
    .join("\n");
  const expenseCats = categories
    .filter((c) => c.type === "expense")
    .map((c) => `  "${c.id}": ${c.nameDA} (${c.name})`)
    .join("\n");

  const systemPrompt = `You are a Danish household expense categorization engine. You categorize bank transactions from a Danish bank CSV export for a Danish family.

INCOME CATEGORIES:
${incomeCats}

EXPENSE CATEGORIES:
${expenseCats}

VALID CATEGORY IDS (you MUST only use these exact IDs, nothing else):
${categories.map((c) => c.id).join(", ")}

RULES:
1. Match each transaction to exactly ONE category ID from the VALID CATEGORY IDS list above. Do NOT invent new category IDs.
2. Income transactions (positive amounts) MUST use an income category.
3. Expense transactions (negative amounts) MUST use an expense category.
4. Danish supermarkets (REMA1000, KVICKLY, FOETEX, NETTO, COOP365, LIDL, BILKA, MENY, LOEVBJERG, SPAR, DAGLIBRUGSEN, SUPERBRUGSEN) -> "groceries"
5. UBER without "EATS" -> "rideshare". UBER *EATS -> "food_delivery"
6. MobilePay from family members -> "family_transfer" or "other_income"
7. B-SKAT -> "tax"
8. CLAUDE.AI, ANTHROPIC, SONIOX, OPENROUTER, OPENAI -> "sub_tech"
9. HETZNER, HOSTINGER -> "sub_hosting"
10. You MUST categorize every transaction — pick the best matching category even if uncertain. Never leave anything uncategorized.

Respond ONLY with a valid JSON object mapping each transaction's "key" to the chosen category ID. No other text.
Example: {"name1|||desc1": "groceries", "name2|||desc2": "rideshare"}`;

  const patternsForPrompt = patterns.map((p, i) => ({
    i: i + 1, key: p.key, name: p.name, desc: p.description,
    type: p.isIncome ? "INCOME" : "EXPENSE", amount: p.sampleAmount, count: p.count,
  }));

  const userContent = `Categorize these ${patterns.length} Danish bank transactions. Each object has a "key" field — return a JSON object mapping each key to a category ID.\n\n${JSON.stringify(patternsForPrompt)}`;

  const categoryEnum = categories
    .filter((c) => c.id !== "uncategorized")
    .map((c) => c.id);

  const schema = {
    type: "object" as const,
    properties: {
      mappings: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            key: { type: "string" as const },
            category: { type: "string" as const, enum: categoryEnum },
          },
          required: ["key", "category"],
          additionalProperties: false,
        },
      },
    },
    required: ["mappings"],
    additionalProperties: false,
  };

  const url = provider.getUrl(model, providerConfig.apiKey, providerConfig.baseUrl);
  const headers = provider.getHeaders(providerConfig.apiKey);
  const body = provider.buildBody(model, systemPrompt, userContent, schema);

  const res = await fetch(url, {
    method: "POST",
    headers,
    signal,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`AI categorization failed (HTTP ${res.status}). Check your API key and try again.`);
  }

  const completion = await res.json();
  const totalTokens = provider.extractTokens(completion);
  const content = provider.extractContent(completion);

  let parsed: { mappings?: { key: string; category: string }[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI returned invalid response format. Please try again.");
  }

  const mappingsArray = parsed.mappings ?? [];
  const mapping: Record<string, string> = {};
  for (const m of mappingsArray) {
    mapping[m.key] = m.category;
  }

  let categorized = 0;
  const updatedTransactions = transactions.map((t) => {
    const key = `${sanitizeKeyPart(t.name)}|||${sanitizeKeyPart(t.description)}`;
    const categoryId = mapping[key];
    if (categoryId && categoryId !== "uncategorized" && categoryId !== "other_income") {
      categorized++;
    }
    return { ...t, categoryId: categoryId || (t.isIncome ? "other_income" : "uncategorized") };
  });

  return {
    transactions: updatedTransactions,
    stats: { totalTransactions: transactions.length, uniquePatterns: patterns.length, categorized, tokensUsed: totalTokens },
  };
}
