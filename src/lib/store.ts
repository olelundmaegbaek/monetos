"use client";

import { Transaction, HouseholdConfig, BudgetEntry, Category } from "@/types";

const STORAGE_KEYS = {
  config: "pf_config",
  transactions: "pf_transactions",
  hasCompletedSetup: "pf_setup_done",
  openaiApiKey: "pf_openai_key",
} as const;

// === CONFIG ===

export function saveConfig(config: HouseholdConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config));
}

export function loadConfig(): HouseholdConfig | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS.config);
  if (!raw) return null;
  try {
    const config = JSON.parse(raw) as HouseholdConfig;
    return migrateBudgetEntries(config);
  } catch {
    return null;
  }
}

/**
 * Migrate old budget entries where quarterly/yearly entries stored monthly equivalents
 * to the new format where they store the actual payment amount.
 * Entries that already have paymentMonths are considered migrated.
 */
function migrateBudgetEntries(config: HouseholdConfig): HouseholdConfig {
  let needsSave = false;
  const migrated = config.budgetEntries.map((be) => {
    if (be.frequency === "quarterly" && !be.paymentMonths) {
      needsSave = true;
      return {
        ...be,
        monthlyAmount: be.monthlyAmount * 3, // Convert monthly equiv → quarterly amount
        paymentMonths: [1, 4, 7, 10],
      };
    }
    if (be.frequency === "yearly" && !be.paymentMonths) {
      needsSave = true;
      return {
        ...be,
        monthlyAmount: be.monthlyAmount * 12, // Convert monthly equiv → yearly amount
        paymentMonths: [1],
      };
    }
    return be;
  });

  if (needsSave) {
    const updated = { ...config, budgetEntries: migrated };
    saveConfig(updated);
    return updated;
  }
  return config;
}

// === TRANSACTIONS ===

export function saveTransactions(transactions: Transaction[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
}

export function loadTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEYS.transactions);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Transaction[];
  } catch {
    return [];
  }
}

export function addTransactions(newTransactions: Transaction[]): Transaction[] {
  const existing = loadTransactions();
  // Deduplicate by date + amount + name to prevent double-imports
  const existingKeys = new Set(
    existing.map((t) => `${t.date}|${t.amount}|${t.name}`)
  );
  const unique = newTransactions.filter(
    (t) => !existingKeys.has(`${t.date}|${t.amount}|${t.name}`)
  );
  const merged = [...existing, ...unique];
  saveTransactions(merged);
  return merged;
}

export function updateTransaction(id: string, updates: Partial<Transaction>): void {
  const transactions = loadTransactions();
  const idx = transactions.findIndex((t) => t.id === id);
  if (idx >= 0) {
    transactions[idx] = { ...transactions[idx], ...updates };
    saveTransactions(transactions);
  }
}

// === SETUP STATUS ===

export function hasCompletedSetup(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEYS.hasCompletedSetup) === "true";
}

export function markSetupComplete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.hasCompletedSetup, "true");
}

// === BUDGET HELPERS ===

export function getBudgetEntries(): BudgetEntry[] {
  const config = loadConfig();
  return config?.budgetEntries || [];
}

// === BUDGET ENTRY MUTATIONS ===

export function addBudgetEntry(entry: BudgetEntry): HouseholdConfig | null {
  const config = loadConfig();
  if (!config) return null;
  config.budgetEntries = [...(config.budgetEntries || []), entry];
  saveConfig(config);
  return config;
}

export function updateBudgetEntry(categoryId: string, updates: Partial<BudgetEntry>): HouseholdConfig | null {
  const config = loadConfig();
  if (!config) return null;
  config.budgetEntries = (config.budgetEntries || []).map((be) =>
    be.categoryId === categoryId ? { ...be, ...updates } : be
  );
  saveConfig(config);
  return config;
}

export function removeBudgetEntry(categoryId: string): HouseholdConfig | null {
  const config = loadConfig();
  if (!config) return null;
  config.budgetEntries = (config.budgetEntries || []).filter((be) => be.categoryId !== categoryId);
  saveConfig(config);
  return config;
}

// === CUSTOM CATEGORY MUTATIONS ===

export function addCustomCategory(category: Category): HouseholdConfig | null {
  const config = loadConfig();
  if (!config) return null;
  config.customCategories = [...(config.customCategories || []), category];
  saveConfig(config);
  return config;
}

export function updateCustomCategory(id: string, updates: Partial<Category>): HouseholdConfig | null {
  const config = loadConfig();
  if (!config) return null;
  config.customCategories = (config.customCategories || []).map((c) =>
    c.id === id ? { ...c, ...updates } : c
  );
  saveConfig(config);
  return config;
}

export function removeCustomCategory(id: string): HouseholdConfig | null {
  const config = loadConfig();
  if (!config) return null;
  config.customCategories = (config.customCategories || []).filter((c) => c.id !== id);
  saveConfig(config);
  return config;
}

// === OPENAI API KEY ===

export function saveOpenAIKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.openaiApiKey, key);
}

export function loadOpenAIKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.openaiApiKey);
}

export function clearOpenAIKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.openaiApiKey);
}

// === STATS HELPERS ===

export function getTransactionsForMonth(
  transactions: Transaction[],
  yearMonth: string // "YYYY-MM"
): Transaction[] {
  return transactions.filter((t) => t.date.startsWith(yearMonth));
}

export function getMonthlyStats(transactions: Transaction[]) {
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
    const current = byCategory.get(t.categoryId) || 0;
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
