import { Transaction, BudgetEntry, Category, MonthVariance, CategoryVariance, Anomaly } from "@/types";
import { calculateMonthlyForecast, getAmountForMonth, formatMonthLabel } from "./forecast";
import { parseMonthNumber, currentMonthKey } from "@/lib/utils/date";
import { buildCategoryMap } from "@/config/categories";

export function calculateMonthVariance(
  transactions: Transaction[],
  budgetEntries: BudgetEntry[],
  allCategories: Category[],
  month: string
): MonthVariance {
  const forecast = calculateMonthlyForecast(transactions, budgetEntries, month, allCategories);
  const monthTxns = transactions.filter((t) => t.date.startsWith(month));
  const hasActualData = monthTxns.length > 0;

  const actualByCat = new Map<string, number>();
  for (const t of monthTxns) {
    const current = actualByCat.get(t.categoryId) ?? 0;
    actualByCat.set(t.categoryId, current + t.amount);
  }

  const allCatIds = new Set([
    ...forecast.byCategory.map((e) => e.categoryId),
    ...actualByCat.keys(),
  ]);

  const catMap = buildCategoryMap(allCategories);
  const byCategory: CategoryVariance[] = [];
  for (const catId of allCatIds) {
    const cat = catMap.get(catId);
    const forecastEntry = forecast.byCategory.find((e) => e.categoryId === catId);
    const projected = forecastEntry?.forecastedAmount ?? 0;
    const actual = actualByCat.get(catId) ?? 0;
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

  byCategory.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

  let actualIncome = 0;
  let actualExpenses = 0;
  for (const t of monthTxns) {
    if (t.amount > 0) actualIncome += t.amount;
    else actualExpenses += Math.abs(t.amount);
  }

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
  const current = currentMonthKey();

  const months: string[] = [];
  let [y, m] = earliest.split("-").map(Number);

  while (`${y}-${String(m).padStart(2, "0")}` <= current) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }

  return months;
}

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
  const monthNumber = parseMonthNumber(month);
  const catMap = buildCategoryMap(allCategories);

  // 1. Large transactions: >2x budget for their category, or >5000 if no budget
  for (const t of monthTxns) {
    const be = budgetEntries.find((b) => b.categoryId === t.categoryId);
    const cat = catMap.get(t.categoryId);
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
      const cat = catMap.get(be.categoryId);
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
    const current = unexpectedCats.get(t.categoryId) ?? 0;
    unexpectedCats.set(t.categoryId, current + t.amount);
  }
  for (const [catId, total] of unexpectedCats) {
    if (Math.abs(total) < UNEXPECTED_CAT_MIN_AMOUNT) continue;
    const cat = catMap.get(catId);
    anomalies.push({
      type: "unexpected_category",
      severity: Math.abs(total) > UNEXPECTED_CAT_HIGH_THRESHOLD ? "high" : "low",
      description: `${cat?.nameDA || catId}: ${total.toLocaleString("da-DK")} kr. with no budget set`,
      descriptionDA: `${cat?.nameDA || catId}: ${total.toLocaleString("da-DK")} kr. uden budget`,
      amount: total,
      categoryName: cat?.nameDA || catId,
    });
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };
  anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return anomalies;
}
