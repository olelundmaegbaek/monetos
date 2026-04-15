import { Transaction, BudgetEntry, BudgetFrequency, Category, MonthlyForecast, ForecastCategoryEntry } from "@/types";
import { parseMonthNumber } from "@/lib/utils/date";
import { buildCategoryMap } from "@/config/categories";

// === BUDGET FREQUENCY HELPERS ===

/** Default payment months for each frequency */
export function getDefaultPaymentMonths(frequency: BudgetFrequency): number[] {
  switch (frequency) {
    case "quarterly": return [1, 4, 7, 10];
    case "yearly": return [1];
    default: return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }
}

/** Get the actual amount for a specific month (1-12). Returns 0 in non-payment months for quarterly/yearly. */
export function getAmountForMonth(entry: BudgetEntry, month: number): number {
  if (entry.frequency === "monthly" || entry.frequency === "irregular") {
    return entry.monthlyAmount;
  }
  const paymentMonths = entry.paymentMonths || getDefaultPaymentMonths(entry.frequency);
  return paymentMonths.includes(month) ? entry.monthlyAmount : 0;
}

/** Get the monthly equivalent (for averages/summaries). Quarterly / 3, yearly / 12. */
export function getMonthlyEquivalent(entry: BudgetEntry): number {
  switch (entry.frequency) {
    case "quarterly": return entry.monthlyAmount / 3;
    case "yearly": return entry.monthlyAmount / 12;
    default: return entry.monthlyAmount;
  }
}

/**
 * Calculate monthly forecast based on budget entries and historical transaction data.
 */
export function calculateMonthlyForecast(
  transactions: Transaction[],
  budgetEntries: BudgetEntry[],
  targetMonth: string,
  allCategories: Category[],
  lookbackMonths: number = 3
): MonthlyForecast {
  // Get the last N months of data (before targetMonth)
  const historicalMonths = getPreviousMonths(targetMonth, lookbackMonths);

  // Compute historical averages per category
  const historicalByCat = new Map<string, number[]>();
  for (const month of historicalMonths) {
    const monthTxns = transactions.filter((t) => t.date.startsWith(month));
    const catTotals = new Map<string, number>();
    for (const t of monthTxns) {
      const current = catTotals.get(t.categoryId) ?? 0;
      catTotals.set(t.categoryId, current + t.amount);
    }
    // Add each category's total for this month
    const allCatIds = new Set([
      ...catTotals.keys(),
      ...budgetEntries.map((be) => be.categoryId),
    ]);
    for (const catId of allCatIds) {
      if (!historicalByCat.has(catId)) historicalByCat.set(catId, []);
      historicalByCat.get(catId)!.push(catTotals.get(catId) ?? 0);
    }
  }

  // Build forecast entries for all categories that have either budget or historical data
  const allCatIds = new Set([
    ...budgetEntries.map((be) => be.categoryId),
    ...historicalByCat.keys(),
  ]);

  const forecastEntries: ForecastCategoryEntry[] = [];
  const catMap = buildCategoryMap(allCategories);

  for (const catId of allCatIds) {
    const cat = catMap.get(catId);
    const budgetEntry = budgetEntries.find((be) => be.categoryId === catId);
    const history = historicalByCat.get(catId) || [];

    const targetMonthNumber = parseMonthNumber(targetMonth);
    const budgetAmount = budgetEntry
      ? getAmountForMonth(budgetEntry, targetMonthNumber)
      : 0;
    const historicalAverage = history.length > 0
      ? history.reduce((s, v) => s + v, 0) / history.length
      : 0;

    // Forecast: prefer budget if available (including 0 for non-payment months), otherwise historical
    const forecastedAmount = budgetEntry ? budgetAmount : historicalAverage;

    // Confidence based on data quality
    const confidence = computeConfidence(!!budgetEntry && budgetAmount !== 0, history);

    forecastEntries.push({
      categoryId: catId,
      categoryName: cat ? cat.nameDA : catId,
      budgetAmount,
      historicalAverage: Math.round(historicalAverage),
      forecastedAmount: Math.round(forecastedAmount),
      confidence,
    });
  }

  const forecastedIncome = forecastEntries
    .filter((e) => e.forecastedAmount > 0)
    .reduce((s, e) => s + e.forecastedAmount, 0);
  const forecastedExpenses = forecastEntries
    .filter((e) => e.forecastedAmount < 0)
    .reduce((s, e) => s + Math.abs(e.forecastedAmount), 0);

  return {
    month: targetMonth,
    forecastedIncome,
    forecastedExpenses,
    forecastedNet: forecastedIncome - forecastedExpenses,
    byCategory: forecastEntries,
  };
}

function computeConfidence(
  hasBudget: boolean,
  history: number[]
): "high" | "medium" | "low" {
  const hasHistory = history.length >= 2;

  if (!hasBudget && !hasHistory) return "low";
  if (!hasBudget && hasHistory) return "medium";

  if (hasBudget && hasHistory) {
    // Check variance: low variance = high confidence
    const mean = history.reduce((s, v) => s + v, 0) / history.length;
    const variance = history.reduce((s, v) => s + (v - mean) ** 2, 0) / history.length;
    const stddev = Math.sqrt(variance);
    const absMean = Math.abs(mean);
    const cv = absMean > 0 ? stddev / absMean : 0;
    return cv < 0.2 ? "high" : "medium";
  }

  // Budget but no history
  return "medium";
}

function getPreviousMonths(targetMonth: string, count: number): string[] {
  const [year, month] = targetMonth.split("-").map(Number);
  const months: string[] = [];
  let y = year;
  let m = month;

  for (let i = 0; i < count; i++) {
    m--;
    if (m < 1) {
      m = 12;
      y--;
    }
    months.push(`${y}-${String(m).padStart(2, "0")}`);
  }

  return months;
}

/**
 * Get the next month string from the given month.
 */
export function getNextMonth(currentMonth: string): string {
  const [year, month] = currentMonth.split("-").map(Number);
  let y = year;
  let m = month + 1;
  if (m > 12) {
    m = 1;
    y++;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

// === MULTI-MONTH PROJECTION ===

export interface ScheduledPayment {
  categoryName: string;
  amount: number;
  frequency: BudgetFrequency;
}

export interface ProjectionMonth {
  month: string;
  monthLabel: string;
  income: number;
  expenses: number;
  net: number;
  cumulativeNet: number;
  scheduledPayments: ScheduledPayment[];
}

export interface MultiMonthProjection {
  months: ProjectionMonth[];
}

export const MONTH_NAMES_DA = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  return `${MONTH_NAMES_DA[month - 1]} ${year}`;
}

/**
 * Generate a multi-month projection (1-24 months forward).
 * Uses calculateMonthlyForecast for each future month.
 */
export function calculateMultiMonthProjection(
  transactions: Transaction[],
  budgetEntries: BudgetEntry[],
  startMonth: string,
  allCategories: Category[],
  numMonths: number,
  lookbackMonths: number = 3
): MultiMonthProjection {
  const projectionMonths: ProjectionMonth[] = [];
  let currentMonth = startMonth;
  let cumulativeNet = 0;
  const catMap = buildCategoryMap(allCategories);

  for (let i = 0; i < numMonths; i++) {
    const targetMonth = getNextMonth(currentMonth);

    const forecast = calculateMonthlyForecast(
      transactions,
      budgetEntries,
      targetMonth,
      allCategories,
      lookbackMonths
    );

    // Collect non-monthly scheduled payments for this month
    const monthNumber = parseMonthNumber(targetMonth);
    const scheduledPayments: ScheduledPayment[] = budgetEntries
      .filter((be) => be.frequency !== "monthly" && be.frequency !== "irregular")
      .filter((be) => {
        const pm = be.paymentMonths || getDefaultPaymentMonths(be.frequency);
        return pm.includes(monthNumber);
      })
      .map((be) => {
        const cat = catMap.get(be.categoryId);
        return {
          categoryName: cat?.nameDA || be.categoryId,
          amount: be.monthlyAmount,
          frequency: be.frequency,
        };
      });

    cumulativeNet += forecast.forecastedNet;

    projectionMonths.push({
      month: targetMonth,
      monthLabel: formatMonthLabel(targetMonth),
      income: Math.round(forecast.forecastedIncome),
      expenses: Math.round(forecast.forecastedExpenses),
      net: Math.round(forecast.forecastedNet),
      cumulativeNet: Math.round(cumulativeNet),
      scheduledPayments,
    });

    currentMonth = targetMonth;
  }

  return { months: projectionMonths };
}
