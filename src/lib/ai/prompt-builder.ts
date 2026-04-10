import { Transaction, Category } from "@/types";

export interface UniquePattern {
  key: string;
  name: string;
  description: string;
  isIncome: boolean;
  sampleAmount: number;
  count: number;
}

/** Sanitize a string for use in transaction keys — strips the separator sequence. */
function sanitizeKeyPart(s: string): string {
  return s.replace(/\|{2,}/g, "|");
}

export function transactionToKey(t: Transaction): string {
  return `${sanitizeKeyPart(t.name)}|||${sanitizeKeyPart(t.description)}`;
}

export function deduplicateTransactions(transactions: Transaction[]): UniquePattern[] {
  const patternMap = new Map<string, UniquePattern>();
  for (const t of transactions) {
    const key = transactionToKey(t);
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

export function buildCategorizationPrompt(
  patterns: UniquePattern[],
  categories: Category[],
): { systemPrompt: string; userContent: string; jsonSchema: object } {
  const incomeCats = categories
    .filter((c) => c.type === "income")
    .map((c) => `  "${c.id}": ${c.nameDA} (${c.name})`)
    .join("\n");
  const expenseCats = categories
    .filter((c) => c.type === "expense")
    .map((c) => `  "${c.id}": ${c.nameDA} (${c.name})`)
    .join("\n");

  const systemPrompt = `You are a Danish household expense categorization engine. You categorize bank transactions from a Nordea CSV export for a Danish family.

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

  const categoryIds = categories.filter((c) => c.id !== "uncategorized").map((c) => c.id);

  const jsonSchema = {
    type: "object",
    properties: {
      mappings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            key: { type: "string" },
            category: { type: "string", enum: categoryIds },
          },
          required: ["key", "category"],
          additionalProperties: false,
        },
      },
    },
    required: ["mappings"],
    additionalProperties: false,
  };

  return { systemPrompt, userContent, jsonSchema };
}
