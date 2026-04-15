import { Transaction, CategorizationRule } from "@/types";
import { isSafeRegex } from "@/lib/utils/regex";

/**
 * Categorize a single transaction against pre-sorted rules (highest priority first).
 */
export function categorizeTransaction(
  transaction: Transaction,
  sortedRules: CategorizationRule[]
): string {
  for (const rule of sortedRules) {
    const fieldValue =
      rule.field === "name" ? transaction.name : transaction.description;

    if (!fieldValue) continue;

    // Guard against ReDoS: only use regex if the pattern is safe
    if (!isSafeRegex(rule.pattern)) {
      if (fieldValue.toLowerCase().includes(rule.pattern.toLowerCase())) {
        return rule.categoryId;
      }
      continue;
    }

    try {
      const regex = new RegExp(rule.pattern, "i");
      if (regex.test(fieldValue)) {
        return rule.categoryId;
      }
    } catch {
      // Regex engine error — skip this rule
      continue;
    }
  }

  // Default: try to classify income vs expense
  if (transaction.isIncome) {
    return "other_income";
  }

  return "uncategorized";
}

export function categorizeTransactions(
  transactions: Transaction[],
  rules: CategorizationRule[]
): Transaction[] {
  // Sort rules once by priority (highest first) instead of per-transaction
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);
  return transactions.map((t) => ({
    ...t,
    categoryId: categorizeTransaction(t, sorted),
  }));
}
