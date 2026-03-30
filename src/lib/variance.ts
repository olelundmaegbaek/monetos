import { Transaction, BudgetEntry, Category, MonthVariance, CategoryVariance, Anomaly } from "@/types";
import { calculateMonthlyForecast, getAmountForMonth } from "./forecast";

const MONTH_NAMES_DA = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  return `${MONTH_NAMES_DA[month - 1]} ${year}`;
}

/**
 * Calculate variance between projected and actual for a single month.
 */
export function calculateMonthVariance(
  transactions: Transaction[],
  budgetEntries: BudgetEntry[],
  allCategories: Category[],
  month: string
): MonthVariance {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const isCurrentMonth = month === currentMonth;

  // Get forecast for this month (uses only data from before this month)
  const forecast = calculateMonthlyForecast(transactions, budgetEntries, month, allCategories);

  // Get actual transactions for this month
  const monthTxns = transactions.filter((t) => t.date.startsWith(month));
  const hasActualData = monthTxns.length > 0;

  // Sum actuals by category
  const actualByCat = new Map<string, number>();
  for (const t of monthTxns) {
    const current = actualByCat.get(t.categoryId) || 0;
    actualByCat.set(t.categoryId, current + t.amount);
  }

  // Build per-category variance
  const allCatIds = new Set([
    ...forecast.byCategory.map((e) => e.categoryId),
    ...actualByCat.keys(),
  ]);

  const byCategory: CategoryVariance[] = [];
  for (const catId of allCatIds) {
    const cat = allCategories.find((c) => c.id === catId);
    const forecastEntry = forecast.byCategory.find((e) => e.categoryId === catId);
    const projected = forecastEntry?.forecastedAmount || 0;
    const actual = actualByCat.get(catId) || 0;
    const variance = actual - projected;
    const percentDeviation = projected !== 0 ? (variance / Math.abs(projected)) * 100 : actual !== 0 ? 100 : 0;

    byCategory.push({
      categoryId: catId,
      categoryName: cat?.nameDA || catId,
      projected,
      actual,
      variance,
      percentDeviation: Math.round(percentDeviation),
    });
  }

  // Sort by absolute variance descending
  byCategory.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

  // Sum actuals
  const actualIncome = monthTxns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const actualExpenses = monthTxns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return {
    month,
    monthLabel: formatMonthLabel(month),
    projectedIncome: forecast.forecastedIncome,
    projectedExpenses: forecast.forecastedExpenses,
    projectedNet: forecast.forecastedNet,
    actualIncome: Math.round(actualIncome),
    actualExpenses: Math.round(actualExpenses),
    actualNet: Math.round(actualIncome - actualExpenses),
    byCategory,
    hasActualData,
    isCurrentMonth,
  };
}

/**
 * Calculate variance history for a range of months.
 */
export function calculateVarianceHistory(
  transactions: Transaction[],
  budgetEntries: BudgetEntry[],
  allCategories: Category[],
  months: string[]
): MonthVariance[] {
  return months.map((month) =>
    calculateMonthVariance(transactions, budgetEntries, allCategories, month)
  );
}

/**
 * Generate the month range from the earliest transaction month to the current month.
 */
export function getMonthRange(transactions: Transaction[]): string[] {
  if (transactions.length === 0) return [];

  const dates = transactions.map((t) => t.date).sort();
  const earliest = dates[0].substring(0, 7);
  const now = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const months: string[] = [];
  let [y, m] = earliest.split("-").map(Number);

  while (`${y}-${String(m).padStart(2, "0")}` <= current) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }

  return months;
}

// Anomaly detection thresholds
const LARGE_TXN_MULTIPLIER = 2;
const LARGE_TXN_HIGH_SEVERITY_MULTIPLIER = 5;
const MISSING_EXPECTED_HIGH_THRESHOLD = 5000;
const UNEXPECTED_CAT_MIN_AMOUNT = 500;
const UNEXPECTED_CAT_HIGH_THRESHOLD = 3000;

/**
 * Detect anomalies for a given month.
 */
export function detectAnomalies(
  transactions: Transaction[],
  budgetEntries: BudgetEntry[],
  allCategories: Category[],
  month: string
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const monthTxns = transactions.filter((t) => t.date.startsWith(month));
  const monthNumber = parseInt(month.split("-")[1]);

  // 1. Large transactions: >2x budget for their category, or >5000 if no budget
  for (const t of monthTxns) {
    const be = budgetEntries.find((b) => b.categoryId === t.categoryId);
    const cat = allCategories.find((c) => c.id === t.categoryId);
    if (be) {
      const budgetForMonth = Math.abs(getAmountForMonth(be, monthNumber));
      if (budgetForMonth > 0 && Math.abs(t.amount) > budgetForMonth * LARGE_TXN_MULTIPLIER) {
        anomalies.push({
          type: "large_transaction",
          severity: Math.abs(t.amount) > budgetForMonth * LARGE_TXN_HIGH_SEVERITY_MULTIPLIER ? "high" : "medium",
          description: `"${t.name}" (${t.amount.toLocaleString("da-DK")} kr.) is over 2x the budget for ${cat?.nameDA || t.categoryId}`,
          descriptionDA: `"${t.name}" (${t.amount.toLocaleString("da-DK")} kr.) er over 2x budgettet for ${cat?.nameDA || t.categoryId}`,
          amount: t.amount,
          categoryName: cat?.nameDA || t.categoryId,
          transactionName: t.name,
        });
      }
    } else if (Math.abs(t.amount) > MISSING_EXPECTED_HIGH_THRESHOLD) {
      anomalies.push({
        type: "large_transaction",
        severity: "medium",
        description: `"${t.name}" (${t.amount.toLocaleString("da-DK")} kr.) — large transaction without budget in ${cat?.nameDA || t.categoryId}`,
        descriptionDA: `"${t.name}" (${t.amount.toLocaleString("da-DK")} kr.) — stor transaktion uden budget i ${cat?.nameDA || t.categoryId}`,
        amount: t.amount,
        categoryName: cat?.nameDA || t.categoryId,
        transactionName: t.name,
      });
    }
  }

  // 2. Missing expected: budgeted categories with no transactions
  for (const be of budgetEntries) {
    const expectedAmount = getAmountForMonth(be, monthNumber);
    if (expectedAmount === 0) continue; // Not a payment month
    const hasTxns = monthTxns.some((t) => t.categoryId === be.categoryId);
    if (!hasTxns) {
      const cat = allCategories.find((c) => c.id === be.categoryId);
      anomalies.push({
        type: "missing_expected",
        severity: Math.abs(expectedAmount) > MISSING_EXPECTED_HIGH_THRESHOLD ? "high" : "medium",
        description: `No transactions found for "${cat?.nameDA || be.categoryId}" (budgeted: ${expectedAmount.toLocaleString("da-DK")} kr.)`,
        descriptionDA: `Ingen transaktioner fundet for "${cat?.nameDA || be.categoryId}" (budgetteret: ${expectedAmount.toLocaleString("da-DK")} kr.)`,
        amount: expectedAmount,
        categoryName: cat?.nameDA || be.categoryId,
      });
    }
  }

  // 3. Unexpected categories: transactions in non-budgeted categories (excluding common ones)
  const budgetedCatIds = new Set(budgetEntries.map((b) => b.categoryId));
  const unexpectedCats = new Map<string, number>();
  for (const t of monthTxns) {
    if (budgetedCatIds.has(t.categoryId)) continue;
    if (t.categoryId === "uncategorized" || t.categoryId === "other_income") continue;
    const current = unexpectedCats.get(t.categoryId) || 0;
    unexpectedCats.set(t.categoryId, current + t.amount);
  }
  for (const [catId, total] of unexpectedCats) {
    if (Math.abs(total) < UNEXPECTED_CAT_MIN_AMOUNT) continue;
    const cat = allCategories.find((c) => c.id === catId);
    anomalies.push({
      type: "unexpected_category",
      severity: Math.abs(total) > UNEXPECTED_CAT_HIGH_THRESHOLD ? "high" : "low",
      description: `${cat?.nameDA || catId}: ${total.toLocaleString("da-DK")} kr. with no budget set`,
      descriptionDA: `${cat?.nameDA || catId}: ${total.toLocaleString("da-DK")} kr. uden budget`,
      amount: total,
      categoryName: cat?.nameDA || catId,
    });
  }

  // Sort by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return anomalies;
}
