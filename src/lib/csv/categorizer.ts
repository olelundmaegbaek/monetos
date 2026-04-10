import { Transaction, CategorizationRule } from "@/types";
import { isSafeRegex } from "@/lib/utils/regex";

export function categorizeTransaction(
  transaction: Transaction,
  rules: CategorizationRule[]
): string {
  // Sort rules by priority (highest first)
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
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
      // Fallback to simple includes if regex fails
      if (fieldValue.toLowerCase().includes(rule.pattern.toLowerCase())) {
        return rule.categoryId;
      }
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
  return transactions.map((t) => ({
    ...t,
    categoryId: categorizeTransaction(t, rules),
  }));
}
