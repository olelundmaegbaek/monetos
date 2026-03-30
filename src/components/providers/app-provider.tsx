"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { Transaction, HouseholdConfig, MonthlyStats, BudgetEntry, Category } from "@/types";
import { aiCategorizeTransactions, AICategorizeResult } from "@/lib/csv/ai-categorizer";
import { loadOpenAIKey } from "@/lib/store";
import { getAllCategories } from "@/config/categories";
import {
  loadConfig,
  saveConfig,
  loadTransactions,
  saveTransactions,
  addTransactions as storeAddTransactions,
  hasCompletedSetup,
  markSetupComplete,
  getTransactionsForMonth,
  getMonthlyStats,
  getAvailableMonths,
} from "@/lib/store";

export interface ImportState {
  parsed: Transaction[];
  imported: boolean;
  isAiCategorizing: boolean;
  aiError: string | null;
}

interface AppContextType {
  config: HouseholdConfig | null;
  setConfig: (config: HouseholdConfig) => void;
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransactions: (newTransactions: Transaction[]) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  availableMonths: string[];
  monthlyStats: MonthlyStats;
  monthTransactions: Transaction[];
  isSetupDone: boolean;
  completeSetup: () => void;
  locale: "da" | "en";
  setLocale: (locale: "da" | "en") => void;
  isLoading: boolean;
  // Category helpers
  allCategories: Category[];
  addCustomCategory: (category: Category) => void;
  updateCustomCategory: (id: string, updates: Partial<Category>) => void;
  removeCustomCategory: (id: string, reassignTo: string) => void;
  // Budget helpers
  addBudgetEntry: (entry: BudgetEntry) => void;
  updateBudgetEntry: (categoryId: string, updates: Partial<BudgetEntry>) => void;
  removeBudgetEntry: (categoryId: string) => void;
  // Import state (survives navigation)
  importState: ImportState;
  setImportParsed: (parsed: Transaction[]) => void;
  setImportImported: (imported: boolean) => void;
  resetImport: () => void;
  startAiCategorization: (uncategorized: Transaction[], alreadyCategorized: Transaction[]) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<HouseholdConfig | null>(null);
  const [transactions, setTransactionsState] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isSetupDone, setIsSetupDone] = useState(false);
  const [locale, setLocale] = useState<"da" | "en">("da");
  const [isLoading, setIsLoading] = useState(true);

  // Import state — lives here so it survives route changes
  const [importState, setImportState] = useState<ImportState>({
    parsed: [],
    imported: false,
    isAiCategorizing: false,
    aiError: null,
  });

  const setImportParsed = useCallback((parsed: Transaction[]) => {
    setImportState((prev) => ({ ...prev, parsed }));
  }, []);

  const setImportImported = useCallback((imported: boolean) => {
    setImportState((prev) => ({ ...prev, imported }));
  }, []);

  const resetImport = useCallback(() => {
    setImportState({ parsed: [], imported: false, isAiCategorizing: false, aiError: null });
  }, []);

  const startAiCategorization = useCallback(
    (uncategorized: Transaction[], alreadyCategorized: Transaction[]) => {
      const apiKey = loadOpenAIKey();
      if (!apiKey) return;

      setImportState((prev) => ({ ...prev, isAiCategorizing: true, aiError: null }));

      aiCategorizeTransactions(uncategorized, getAllCategories(config?.customCategories), apiKey)
        .then((result) => {
          setImportState((prev) => ({
            ...prev,
            parsed: [...alreadyCategorized, ...result.transactions],
            isAiCategorizing: false,
          }));
        })
        .catch((err) => {
          setImportState((prev) => ({
            ...prev,
            isAiCategorizing: false,
            aiError: err instanceof Error ? err.message : "AI categorization failed",
          }));
        });
    },
    [config?.customCategories]
  );

  // Load from localStorage on mount
  useEffect(() => {
    const cfg = loadConfig();
    const txns = loadTransactions();
    const setupDone = hasCompletedSetup();

    if (cfg) setConfigState(cfg);
    if (txns.length > 0) {
      setTransactionsState(txns);
      const months = getAvailableMonths(txns);
      if (months.length > 0) setSelectedMonth(months[0]);
    }
    if (!selectedMonth) {
      const now = new Date();
      setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    }
    setIsSetupDone(setupDone);
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setConfig = useCallback((cfg: HouseholdConfig) => {
    setConfigState(cfg);
    saveConfig(cfg);
  }, []);

  const setTransactions = useCallback((txns: Transaction[]) => {
    setTransactionsState(txns);
    saveTransactions(txns);
  }, []);

  const addTransactions = useCallback((newTxns: Transaction[]) => {
    const all = storeAddTransactions(newTxns);
    setTransactionsState(all);
    // Auto-switch to the most recent month with imported data
    if (newTxns.length > 0) {
      const months = getAvailableMonths(all);
      if (months.length > 0) {
        setSelectedMonth(months[0]);
      }
    }
  }, []);

  const completeSetup = useCallback(() => {
    markSetupComplete();
    setIsSetupDone(true);
  }, []);

  // Merged categories: default + custom
  const allCategories = useMemo(
    () => getAllCategories(config?.customCategories),
    [config?.customCategories]
  );

  // Budget entry mutations
  const addBudgetEntry = useCallback((entry: BudgetEntry) => {
    setConfigState((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, budgetEntries: [...(prev.budgetEntries || []), entry] };
      saveConfig(updated);
      return updated;
    });
  }, []);

  const updateBudgetEntry = useCallback((categoryId: string, updates: Partial<BudgetEntry>) => {
    setConfigState((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        budgetEntries: (prev.budgetEntries || []).map((be) =>
          be.categoryId === categoryId ? { ...be, ...updates } : be
        ),
      };
      saveConfig(updated);
      return updated;
    });
  }, []);

  const removeBudgetEntry = useCallback((categoryId: string) => {
    setConfigState((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        budgetEntries: (prev.budgetEntries || []).filter((be) => be.categoryId !== categoryId),
      };
      saveConfig(updated);
      return updated;
    });
  }, []);

  // Custom category mutations
  const addCustomCategory = useCallback((category: Category) => {
    setConfigState((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, customCategories: [...(prev.customCategories || []), category] };
      saveConfig(updated);
      return updated;
    });
  }, []);

  const updateCustomCategory = useCallback((id: string, updates: Partial<Category>) => {
    setConfigState((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        customCategories: (prev.customCategories || []).map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      };
      saveConfig(updated);
      return updated;
    });
  }, []);

  const removeCustomCategory = useCallback((id: string, reassignTo: string) => {
    // Reassign transactions, budget entries, and rules that reference this category
    setTransactionsState((prevTxns) => {
      const updated = prevTxns.map((t) =>
        t.categoryId === id ? { ...t, categoryId: reassignTo } : t
      );
      saveTransactions(updated);
      return updated;
    });

    setConfigState((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        customCategories: (prev.customCategories || []).filter((c) => c.id !== id),
        budgetEntries: (prev.budgetEntries || []).map((be) =>
          be.categoryId === id ? { ...be, categoryId: reassignTo } : be
        ),
        categorizationRules: (prev.categorizationRules || []).map((r) =>
          r.categoryId === id ? { ...r, categoryId: reassignTo } : r
        ),
      };
      saveConfig(updated);
      return updated;
    });
  }, []);

  const availableMonths = getAvailableMonths(transactions);
  const monthTransactions = getTransactionsForMonth(transactions, selectedMonth);
  const monthlyStats = getMonthlyStats(monthTransactions);

  return (
    <AppContext.Provider
      value={{
        config,
        setConfig,
        transactions,
        setTransactions,
        addTransactions,
        selectedMonth,
        setSelectedMonth,
        availableMonths,
        monthlyStats,
        monthTransactions,
        isSetupDone,
        completeSetup,
        locale,
        setLocale,
        isLoading,
        allCategories,
        addCustomCategory,
        updateCustomCategory,
        removeCustomCategory,
        addBudgetEntry,
        updateBudgetEntry,
        removeBudgetEntry,
        importState,
        setImportParsed,
        setImportImported,
        resetImport,
        startAiCategorization,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
