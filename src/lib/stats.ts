import { Transaction, MonthlyStats } from "@/types";

export function getTransactionsForMonth(
  transactions: Transaction[],
  yearMonth: string // "YYYY-MM"
): Transaction[] {
  return transactions.filter((t) => t.date.startsWith(yearMonth));
}

export function getMonthlyStats(transactions: Transaction[]): MonthlyStats {
  const income = transactions
    .filter((t) => t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter((t) => !t.isIncome)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const net = income - expenses;
  const savingsRate = income > 0 ? net / income : 0;

  // Group by category
  const byCategory = new Map<string, number>();
  for (const t of transactions) {
    const current = byCategory.get(t.categoryId) ?? 0;
    byCategory.set(t.categoryId, current + t.amount);
  }

  return {
    totalIncome: income,
    totalExpenses: expenses,
    net,
    savingsRate,
    byCategory: Array.from(byCategory.entries()).map(([categoryId, total]) => ({
      categoryId,
      total,
    })),
  };
}

export function getAvailableMonths(transactions: Transaction[]): string[] {
  const months = new Set<string>();
  for (const t of transactions) {
    months.add(t.date.substring(0, 7));
  }
  return Array.from(months).sort().reverse();
}
