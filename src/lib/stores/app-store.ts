import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import {
  Transaction,
  HouseholdConfig,
  BudgetEntry,
  Category,
} from "@/types";
import { aiCategorizeTransactions } from "@/lib/ai/categorize";
import type { AIProviderConfig } from "@/lib/ai/types";
import { getAllCategories } from "@/config/categories";
import { getAvailableMonths } from "@/lib/stats";
import { createEncryptedStorage } from "./encrypted-storage";

// ── Types ──────────────────────────────────────────────────────────

export interface ImportState {
  parsed: Transaction[];
  imported: boolean;
  isAiCategorizing: boolean;
  aiError: string | null;
}

interface AppState {
  // Persisted state
  config: HouseholdConfig | null;
  transactions: Transaction[];
  isSetupDone: boolean;
  locale: "da" | "en";
  aiProviderConfig: AIProviderConfig | null;
  selectedMonth: string;

  // Ephemeral state (excluded from persistence)
  isLoading: boolean;
  importState: ImportState;

  // Config actions
  setConfig: (config: HouseholdConfig) => void;
  completeSetup: () => void;

  // Transaction actions
  setTransactions: (transactions: Transaction[]) => void;
  addTransactions: (newTransactions: Transaction[]) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;

  // Budget actions
  addBudgetEntry: (entry: BudgetEntry) => void;
  updateBudgetEntry: (
    categoryId: string,
    updates: Partial<BudgetEntry>
  ) => void;
  removeBudgetEntry: (categoryId: string) => void;

  // Category actions
  addCustomCategory: (category: Category) => void;
  updateCustomCategory: (id: string, updates: Partial<Category>) => void;
  removeCustomCategory: (id: string, reassignTo: string) => void;

  // UI actions
  setSelectedMonth: (month: string) => void;
  setLocale: (locale: "da" | "en") => void;

  // AI provider actions
  setAiProviderConfig: (config: AIProviderConfig) => void;
  clearAiProviderConfig: () => void;

  // Import actions
  setImportParsed: (parsed: Transaction[]) => void;
  setImportImported: (imported: boolean) => void;
  resetImport: () => void;
  startAiCategorization: (
    uncategorized: Transaction[],
    alreadyCategorized: Transaction[]
  ) => void;

  // Data actions
  exportData: () => void;
  importData: (json: string) => boolean;
}

// ── Budget migration ───────────────────────────────────────────────

function migrateBudgetEntries(config: HouseholdConfig): HouseholdConfig {
  let needsMigration = false;
  const migrated = config.budgetEntries.map((be) => {
    if (be.frequency === "quarterly" && !be.paymentMonths) {
      needsMigration = true;
      return {
        ...be,
        monthlyAmount: be.monthlyAmount * 3,
        paymentMonths: [1, 4, 7, 10],
      };
    }
    if (be.frequency === "yearly" && !be.paymentMonths) {
      needsMigration = true;
      return {
        ...be,
        monthlyAmount: be.monthlyAmount * 12,
        paymentMonths: [1],
      };
    }
    return be;
  });

  if (needsMigration) {
    return { ...config, budgetEntries: migrated };
  }
  return config;
}

// ── AI abort controller ────────────────────────────────────────────
let aiAbortController: AbortController | null = null;

function transactionKey(t: Transaction): string {
  return `${t.date}|${t.amount}|${t.name}|${t.description}`;
}

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ── Store ──────────────────────────────────────────────────────────

const STORAGE_KEY = "pf_store";

export const useAppStore = create<AppState>()(
  immer(
    persist(
      (set, get) => ({
        // ── Initial state ──
        config: null,
        transactions: [],
        isSetupDone: false,
        locale: "da",
        aiProviderConfig: null,
        selectedMonth: currentYearMonth(),
        isLoading: true,
        importState: {
          parsed: [],
          imported: false,
          isAiCategorizing: false,
          aiError: null,
        },

        // ── Config actions ──
        setConfig: (config) =>
          set((state) => {
            state.config = config;
          }),

        completeSetup: () =>
          set((state) => {
            state.isSetupDone = true;
          }),

        // ── Transaction actions ──
        setTransactions: (transactions) =>
          set((state) => {
            state.transactions = transactions;
          }),

        addTransactions: (newTransactions) =>
          set((state) => {
            const existingKeys = new Set(
              state.transactions.map(transactionKey)
            );
            const unique = newTransactions.filter(
              (t) => !existingKeys.has(transactionKey(t))
            );
            state.transactions.push(...unique);

            // Auto-switch to most recent month
            if (unique.length > 0) {
              const months = getAvailableMonths(state.transactions);
              if (months.length > 0) {
                state.selectedMonth = months[0];
              }
            }
          }),

        updateTransaction: (id, updates) =>
          set((state) => {
            const idx = state.transactions.findIndex((t) => t.id === id);
            if (idx >= 0) {
              Object.assign(state.transactions[idx], updates);
            }
          }),

        // ── Budget actions ──
        addBudgetEntry: (entry) =>
          set((state) => {
            if (!state.config) return;
            state.config.budgetEntries.push(entry);
          }),

        updateBudgetEntry: (categoryId, updates) =>
          set((state) => {
            if (!state.config) return;
            const idx = state.config.budgetEntries.findIndex(
              (be) => be.categoryId === categoryId
            );
            if (idx >= 0) {
              Object.assign(state.config.budgetEntries[idx], updates);
            }
          }),

        removeBudgetEntry: (categoryId) =>
          set((state) => {
            if (!state.config) return;
            state.config.budgetEntries = state.config.budgetEntries.filter(
              (be) => be.categoryId !== categoryId
            );
          }),

        // ── Category actions ──
        addCustomCategory: (category) =>
          set((state) => {
            if (!state.config) return;
            if (!state.config.customCategories) {
              state.config.customCategories = [];
            }
            state.config.customCategories.push(category);
          }),

        updateCustomCategory: (id, updates) =>
          set((state) => {
            if (!state.config?.customCategories) return;
            const idx = state.config.customCategories.findIndex(
              (c) => c.id === id
            );
            if (idx >= 0) {
              Object.assign(state.config.customCategories[idx], updates);
            }
          }),

        removeCustomCategory: (id, reassignTo) =>
          set((state) => {
            // Atomically reassign transactions, budget entries, and rules
            for (const t of state.transactions) {
              if (t.categoryId === id) t.categoryId = reassignTo;
            }
            if (state.config) {
              state.config.customCategories = (
                state.config.customCategories || []
              ).filter((c) => c.id !== id);

              for (const be of state.config.budgetEntries) {
                if (be.categoryId === id) be.categoryId = reassignTo;
              }

              for (const r of state.config.categorizationRules || []) {
                if (r.categoryId === id) r.categoryId = reassignTo;
              }
            }
          }),

        // ── UI actions ──
        setSelectedMonth: (month) =>
          set((state) => {
            state.selectedMonth = month;
          }),

        setLocale: (locale) =>
          set((state) => {
            state.locale = locale;
          }),

        // ── AI provider actions ──
        setAiProviderConfig: (config) =>
          set((state) => {
            state.aiProviderConfig = config;
          }),

        clearAiProviderConfig: () =>
          set((state) => {
            state.aiProviderConfig = null;
          }),

        // ── Import actions ──
        setImportParsed: (parsed) =>
          set((state) => {
            state.importState.parsed = parsed;
          }),

        setImportImported: (imported) =>
          set((state) => {
            state.importState.imported = imported;
          }),

        resetImport: () =>
          set((state) => {
            state.importState = {
              parsed: [],
              imported: false,
              isAiCategorizing: false,
              aiError: null,
            };
          }),

        startAiCategorization: (uncategorized, alreadyCategorized) => {
          const { aiProviderConfig, config } = get();
          if (!aiProviderConfig?.apiKey) return;

          // Abort previous request
          aiAbortController?.abort();
          const controller = new AbortController();
          aiAbortController = controller;

          set((state) => {
            state.importState.isAiCategorizing = true;
            state.importState.aiError = null;
          });

          aiCategorizeTransactions(
            uncategorized,
            getAllCategories(config?.customCategories),
            aiProviderConfig,
            controller.signal
          )
            .then((result) => {
              if (controller.signal.aborted) return;
              set((state) => {
                state.importState.parsed = [
                  ...alreadyCategorized,
                  ...result.transactions,
                ];
                state.importState.isAiCategorizing = false;
              });
            })
            .catch((err) => {
              if (controller.signal.aborted) return;
              set((state) => {
                state.importState.isAiCategorizing = false;
                state.importState.aiError =
                  err instanceof Error
                    ? err.message
                    : "AI categorization failed";
              });
            });
        },

        // ── Data actions ──
        exportData: () => {
          const { config, transactions } = get();
          const data = JSON.stringify({ config, transactions }, null, 2);
          const blob = new Blob([data], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `monetos-backup-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
        },

        importData: (json) => {
          try {
            const data = JSON.parse(json);
            if (!data || typeof data !== "object") return false;

            const { config, transactions } = data;
            if (!config || !Array.isArray(transactions)) return false;

            // Basic validation
            if (!config.id || !config.name || !Array.isArray(config.members))
              return false;

            set((state) => {
              state.config = config;
              state.transactions = transactions;
              state.isSetupDone = true;

              const months = getAvailableMonths(transactions);
              if (months.length > 0) {
                state.selectedMonth = months[0];
              }
            });
            return true;
          } catch {
            return false;
          }
        },
      }),
      {
        name: STORAGE_KEY,
        storage: createEncryptedStorage<AppState>(),
        skipHydration: true,
        partialize: (state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { isLoading, importState, ...persisted } = state;
          return persisted as unknown as AppState;
        },
        onRehydrateStorage: () => {
          return (state) => {
            // Migrate budget entries if needed
            if (state?.config) {
              const migrated = migrateBudgetEntries(state.config);
              if (migrated !== state.config) {
                useAppStore.setState({ config: migrated });
              }
            }

            // Migrate legacy openaiApiKey → aiProviderConfig
            const raw = state as unknown as Record<string, unknown>;
            if (raw?.openaiApiKey && typeof raw.openaiApiKey === "string" && !state?.aiProviderConfig) {
              useAppStore.setState({
                aiProviderConfig: {
                  provider: "openai",
                  apiKey: raw.openaiApiKey as string,
                  model: "gpt-5-mini",
                },
              });
            }

            // Set selectedMonth from transactions if available
            if (state?.transactions && state.transactions.length > 0) {
              const months = getAvailableMonths(state.transactions);
              if (months.length > 0 && months[0] !== state.selectedMonth) {
                useAppStore.setState({ selectedMonth: months[0] });
              }
            }

            useAppStore.setState({ isLoading: false });
          };
        },
      }
    )
  )
);
