import { Transaction, BudgetEntry, Category, MonthlyForecast, ForecastCategoryEntry } from "@/types";

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
  const historicalTxns = transactions.filter((t) =>
    historicalMonths.some((m) => t.date.startsWith(m))
  );

  // Compute historical averages per category
  const historicalByCat = new Map<string, number[]>();
  for (const month of historicalMonths) {
    const monthTxns = transactions.filter((t) => t.date.startsWith(month));
    const catTotals = new Map<string, number>();
    for (const t of monthTxns) {
      const current = catTotals.get(t.categoryId) || 0;
      catTotals.set(t.categoryId, current + t.amount);
    }
    // Add each category's total for this month
    const allCatIds = new Set([
      ...catTotals.keys(),
      ...budgetEntries.map((be) => be.categoryId),
    ]);
    for (const catId of allCatIds) {
      if (!historicalByCat.has(catId)) historicalByCat.set(catId, []);
      historicalByCat.get(catId)!.push(catTotals.get(catId) || 0);
    }
  }

  // Build forecast entries for all categories that have either budget or historical data
  const allCatIds = new Set([
    ...budgetEntries.map((be) => be.categoryId),
    ...historicalByCat.keys(),
  ]);

  const forecastEntries: ForecastCategoryEntry[] = [];

  for (const catId of allCatIds) {
    const cat = allCategories.find((c) => c.id === catId);
    const budgetEntry = budgetEntries.find((be) => be.categoryId === catId);
    const history = historicalByCat.get(catId) || [];

    const budgetAmount = budgetEntry?.monthlyAmount || 0;
    const historicalAverage = history.length > 0
      ? history.reduce((s, v) => s + v, 0) / history.length
      : 0;

    // Forecast: prefer budget if available, otherwise historical
    const forecastedAmount = budgetAmount !== 0 ? budgetAmount : historicalAverage;

    // Confidence based on data quality
    const confidence = computeConfidence(budgetAmount, history);

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
  budgetAmount: number,
  history: number[]
): "high" | "medium" | "low" {
  const hasBudget = budgetAmount !== 0;
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

export interface ProjectionMonth {
  month: string;
  monthLabel: string;
  income: number;
  expenses: number;
  net: number;
  cumulativeNet: number;
}

export interface MultiMonthProjection {
  months: ProjectionMonth[];
}

const MONTH_NAMES_DA = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

function formatMonthLabel(yearMonth: string): string {
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

  for (let i = 0; i < numMonths; i++) {
    const targetMonth = getNextMonth(currentMonth);

    const forecast = calculateMonthlyForecast(
      transactions,
      budgetEntries,
      targetMonth,
      allCategories,
      lookbackMonths
    );

    cumulativeNet += forecast.forecastedNet;

    projectionMonths.push({
      month: targetMonth,
      monthLabel: formatMonthLabel(targetMonth),
      income: Math.round(forecast.forecastedIncome),
      expenses: Math.round(forecast.forecastedExpenses),
      net: Math.round(forecast.forecastedNet),
      cumulativeNet: Math.round(cumulativeNet),
    });

    currentMonth = targetMonth;
  }

  return { months: projectionMonths };
}
