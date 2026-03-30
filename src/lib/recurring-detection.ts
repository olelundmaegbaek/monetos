import { Transaction, BudgetEntry, BudgetFrequency } from "@/types";
import { getDefaultPaymentMonths } from "./forecast";

// === TYPES ===

export interface RecurringPattern {
  /** Normalized merchant/description key */
  key: string;
  /** Representative transaction name for display */
  displayName: string;
  /** Category from the most recent transaction */
  categoryId: string;
  /** Detected frequency */
  frequency: BudgetFrequency;
  /** Average amount per occurrence */
  averageAmount: number;
  /** Months where payments were observed (1-12) */
  observedMonths: number[];
  /** Number of occurrences found */
  occurrences: number;
  /** Confidence: high (very regular), medium (somewhat regular), low (sparse) */
  confidence: "high" | "medium" | "low";
  /** Suggested budget entry */
  suggestedEntry: BudgetEntry;
  /** All matching transactions */
  transactions: Transaction[];
}

// === DETECTION ALGORITHM ===

/**
 * Detect recurring transaction patterns from transaction history.
 * Groups by normalized merchant name + amount range, then detects frequency.
 */
export function detectRecurringPatterns(
  transactions: Transaction[],
  existingBudgetEntries: BudgetEntry[] = []
): RecurringPattern[] {
  if (transactions.length < 3) return [];

  // Step 1: Group transactions by normalized merchant key
  const groups = groupByMerchant(transactions);

  // Step 2: For each group, detect recurrence pattern
  const patterns: RecurringPattern[] = [];

  for (const [key, txns] of groups.entries()) {
    if (txns.length < 2) continue;

    // Sort by date
    const sorted = txns.sort((a, b) => a.date.localeCompare(b.date));

    // All same sign? (all income or all expense)
    const signs = new Set(sorted.map((t) => t.amount > 0 ? "+" : "-"));
    if (signs.size > 1) continue; // Mixed income/expense — skip

    // Detect frequency from intervals
    const detection = detectFrequency(sorted);
    if (!detection) continue;

    const { frequency, confidence } = detection;

    // Calculate average amount
    const avgAmount = sorted.reduce((s, t) => s + t.amount, 0) / sorted.length;

    // Observed payment months
    const observedMonths = [...new Set(sorted.map((t) => parseInt(t.date.split("-")[1])))].sort(
      (a, b) => a - b
    );

    // Build suggested payment months
    const paymentMonths = inferPaymentMonths(frequency, observedMonths);

    // Build suggested budget entry
    const suggestedEntry: BudgetEntry = buildSuggestedEntry(
      sorted[sorted.length - 1].categoryId,
      frequency,
      avgAmount,
      paymentMonths
    );

    // Skip if already covered by an existing budget entry
    if (existingBudgetEntries.some((be) => be.categoryId === suggestedEntry.categoryId)) {
      continue;
    }

    patterns.push({
      key,
      displayName: sorted[sorted.length - 1].name || sorted[sorted.length - 1].description,
      categoryId: sorted[sorted.length - 1].categoryId,
      frequency,
      averageAmount: Math.round(avgAmount),
      observedMonths,
      occurrences: sorted.length,
      confidence,
      suggestedEntry,
      transactions: sorted,
    });
  }

  // Sort by absolute amount (biggest first) then by confidence
  const confidenceOrder = { high: 0, medium: 1, low: 2 };
  return patterns.sort(
    (a, b) =>
      confidenceOrder[a.confidence] - confidenceOrder[b.confidence] ||
      Math.abs(b.averageAmount) - Math.abs(a.averageAmount)
  );
}

// === GROUPING ===

/**
 * Normalize merchant name for grouping.
 * "REMA1000 SKÆRING" and "REMA1000 RISSKOV" → "rema1000"
 */
function normalizeMerchant(t: Transaction): string {
  const raw = (t.description || t.name || "").toLowerCase().trim();

  // Remove common suffixes: city names, numbers, dates, reference codes
  let normalized = raw
    .replace(/\s+\d{4,}.*$/, "") // trailing long numbers
    .replace(/\s+\d{2}[\./]\d{2}.*$/, "") // trailing dates
    .replace(/\s*\*\s*/, " ") // "UBER *EATS" → "UBER EATS"
    .replace(/[^\w\sæøåÆØÅ-]/g, "") // remove special chars except danish letters
    .replace(/\s+/g, " ")
    .trim();

  // Take first 2-3 meaningful words (captures merchant identity)
  const words = normalized.split(" ").filter((w) => w.length > 1);
  if (words.length > 3) {
    normalized = words.slice(0, 3).join(" ");
  }

  return normalized;
}

/**
 * Group transactions by normalized merchant + amount bucket.
 * Transactions from the same merchant with similar amounts are grouped together.
 */
function groupByMerchant(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();

  for (const t of transactions) {
    const merchant = normalizeMerchant(t);
    if (!merchant || merchant.length < 2) continue;

    // Skip very small amounts (< 50 DKK)
    if (Math.abs(t.amount) < 50) continue;

    // Group by merchant + amount bucket (within 30% range)
    const amountBucket = getAmountBucket(t.amount);
    const key = `${merchant}|${amountBucket}`;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  return groups;
}

/**
 * Create an amount bucket for grouping similar amounts.
 * Returns a string key that groups amounts within ~30% of each other.
 */
function getAmountBucket(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount >= 0 ? "+" : "-";

  // Exact match bucket for common fixed amounts
  if (abs < 200) return `${sign}${Math.round(abs / 50) * 50}`;
  if (abs < 1000) return `${sign}${Math.round(abs / 100) * 100}`;
  if (abs < 5000) return `${sign}${Math.round(abs / 500) * 500}`;
  return `${sign}${Math.round(abs / 2000) * 2000}`;
}

// === FREQUENCY DETECTION ===

interface FrequencyDetection {
  frequency: BudgetFrequency;
  confidence: "high" | "medium" | "low";
}

/**
 * Detect the frequency of a sorted list of transactions.
 * Looks at intervals between consecutive transactions.
 */
function detectFrequency(sorted: Transaction[]): FrequencyDetection | null {
  if (sorted.length < 2) return null;

  // Calculate intervals in days between consecutive transactions
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const days = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (days > 0) intervals.push(days);
  }

  if (intervals.length === 0) return null;

  const avgInterval = intervals.reduce((s, d) => s + d, 0) / intervals.length;
  const stddev = Math.sqrt(
    intervals.reduce((s, d) => s + (d - avgInterval) ** 2, 0) / intervals.length
  );
  const cv = avgInterval > 0 ? stddev / avgInterval : Infinity;

  // Total span in days
  const firstDate = new Date(sorted[0].date);
  const lastDate = new Date(sorted[sorted.length - 1].date);
  const totalDays = Math.round(
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Monthly: avg interval 25-35 days, at least 3 occurrences
  if (avgInterval >= 25 && avgInterval <= 35 && sorted.length >= 3) {
    const confidence = cv < 0.15 ? "high" : cv < 0.3 ? "medium" : "low";
    return { frequency: "monthly", confidence };
  }

  // Quarterly: avg interval 80-100 days, at least 2 occurrences
  if (avgInterval >= 75 && avgInterval <= 105 && sorted.length >= 2) {
    const confidence = cv < 0.15 ? "high" : cv < 0.3 ? "medium" : "low";
    return { frequency: "quarterly", confidence };
  }

  // Yearly: avg interval 340-395 days
  if (avgInterval >= 340 && avgInterval <= 395 && sorted.length >= 2) {
    return { frequency: "yearly", confidence: "medium" };
  }

  // Check if monthly despite some gaps (e.g., 5 occurrences in 6 months)
  if (totalDays >= 60 && sorted.length >= 3) {
    const expectedMonthly = totalDays / 30;
    const ratio = sorted.length / expectedMonthly;
    if (ratio >= 0.7 && ratio <= 1.3) {
      return { frequency: "monthly", confidence: "low" };
    }
  }

  // Irregular but recurring (at least 3 occurrences over 60+ days)
  if (sorted.length >= 3 && totalDays >= 60) {
    return { frequency: "irregular", confidence: "low" };
  }

  return null;
}

// === HELPERS ===

/**
 * Infer payment months from observed transaction months.
 */
function inferPaymentMonths(
  frequency: BudgetFrequency,
  observedMonths: number[]
): number[] | undefined {
  if (frequency === "monthly" || frequency === "irregular") {
    return undefined; // All months
  }

  if (frequency === "quarterly" && observedMonths.length >= 2) {
    // Find the best quarterly pattern that matches observed data
    const QUARTERS = [
      [1, 4, 7, 10],
      [2, 5, 8, 11],
      [3, 6, 9, 12],
    ];
    let bestMatch = QUARTERS[0];
    let bestScore = 0;
    for (const q of QUARTERS) {
      const score = observedMonths.filter((m) => q.includes(m)).length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = q;
      }
    }
    return bestMatch;
  }

  if (frequency === "yearly" && observedMonths.length >= 1) {
    // Most common observed month
    const counts = new Map<number, number>();
    for (const m of observedMonths) {
      counts.set(m, (counts.get(m) || 0) + 1);
    }
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return [best[0]];
  }

  return getDefaultPaymentMonths(frequency);
}

/**
 * Build a suggested BudgetEntry from detected pattern.
 */
function buildSuggestedEntry(
  categoryId: string,
  frequency: BudgetFrequency,
  avgAmount: number,
  paymentMonths?: number[]
): BudgetEntry {
  let monthlyAmount: number;

  switch (frequency) {
    case "quarterly":
      // Store as quarterly payment amount (avg per occurrence × roughly 1)
      monthlyAmount = Math.round(avgAmount);
      break;
    case "yearly":
      // Store as yearly payment amount
      monthlyAmount = Math.round(avgAmount);
      break;
    default:
      monthlyAmount = Math.round(avgAmount);
  }

  return {
    categoryId,
    monthlyAmount,
    frequency,
    paymentMonths,
  };
}
