"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Transaction, HouseholdConfig, MonthlyStats, BudgetEntry, Category } from "@/types";
import { aiCategorizeTransactions } from "@/lib/csv/ai-categorizer";
import { getAllCategories } from "@/config/categories";
import { transactionKey } from "@/lib/utils";
import { currentMonthKey } from "@/lib/utils/date";
import {
  loadConfig,
  saveConfig,
  loadTransactions,
  saveTransactions,
  STORAGE_KEYS,
  hasCompletedSetup,
  markSetupComplete,
  getTransactionsForMonth,
  getMonthlyStats,
  getAvailableMonths,
  loadAiConfig,
  hasVault,
  loadVaultMeta,
  saveVaultMeta,
  setVaultKey,
  clearVaultKey,
  clearVault,
} from "@/lib/store";
import {
  createVaultMeta,
  verifyPin,
  computeVerifier,
  generateSalt,
  deriveKey,
  bytesToBase64,
  encryptJson,
  VaultMeta,
} from "@/lib/crypto";
import { PinUnlock } from "@/components/vault/pin-unlock";

export interface ImportState {
  parsed: Transaction[];
  imported: boolean;
  isAiCategorizing: boolean;
  aiError: string | null;
}

export type VaultState = "loading" | "fresh" | "locked" | "unlocked";

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
  // Vault
  vaultState: VaultState;
  createVault: (pin: string) => Promise<void>;
  unlockVault: (pin: string) => Promise<boolean>;
  lockVault: () => void;
  changePin: (currentPin: string, newPin: string) => Promise<boolean>;
  // Category helpers
  allCategories: Category[];
  categoryMap: Map<string, Category>;
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

/**
 * Fire-and-forget wrapper for async persistence.
 * The store's internal write queue serializes writes per key, so the only
 * thing we need here is to log (not crash) if a write fails.
 */
function persist(promise: Promise<unknown>) {
  promise.catch((err) => {
    console.error("[monetos] persist failed", err);
  });
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<HouseholdConfig | null>(null);
  const [transactions, setTransactionsState] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isSetupDone, setIsSetupDone] = useState(false);
  const [locale, setLocale] = useState<"da" | "en">("da");
  const [isLoading, setIsLoading] = useState(true);
  const [vaultState, setVaultState] = useState<VaultState>("loading");

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

  // Abort controller to cancel in-flight AI requests when a new one starts
  const aiAbortRef = useRef<AbortController | null>(null);

  const startAiCategorization = useCallback(
    async (uncategorized: Transaction[], alreadyCategorized: Transaction[]) => {
      const aiConfig = loadAiConfig();
      if (!aiConfig) return;

      // Abort any previous in-flight request
      aiAbortRef.current?.abort();
      const controller = new AbortController();
      aiAbortRef.current = controller;

      setImportState((prev) => ({ ...prev, isAiCategorizing: true, aiError: null }));

      try {
        const result = await aiCategorizeTransactions(
          uncategorized,
          getAllCategories(config?.customCategories),
          aiConfig,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setImportState((prev) => ({
          ...prev,
          parsed: [...alreadyCategorized, ...result.transactions],
          isAiCategorizing: false,
        }));
      } catch (err) {
        if (controller.signal.aborted) return;
        setImportState((prev) => ({
          ...prev,
          isAiCategorizing: false,
          aiError: err instanceof Error ? err.message : "AI categorization failed",
        }));
      }
    },
    [config?.customCategories],
  );

  // === Vault bootstrap ===
  useEffect(() => {
    const setupDone = hasCompletedSetup();
    setIsSetupDone(setupDone);
    if (hasVault()) {
      setVaultState("locked");
    } else {
      setVaultState("fresh");
    }
    // Initialize selected month now so the UI doesn't flash empty
    setSelectedMonth(currentMonthKey());
    setIsLoading(false);
  }, []);

  // === Vault methods ===
  const loadUnlockedData = useCallback(async () => {
    const cfg = await loadConfig();
    const txns = await loadTransactions();
    if (cfg) setConfigState(cfg);
    if (txns.length > 0) {
      setTransactionsState(txns);
      const months = getAvailableMonths(txns);
      if (months.length > 0) setSelectedMonth(months[0]);
    }
  }, []);

  const createVault = useCallback(async (pin: string) => {
    const { meta, key } = await createVaultMeta(pin);
    saveVaultMeta(meta);
    setVaultKey(key);
    setVaultState("unlocked");
  }, []);

  const unlockVault = useCallback(
    async (pin: string): Promise<boolean> => {
      const meta = loadVaultMeta();
      if (!meta) return false;
      const key = await verifyPin(pin, meta);
      if (!key) return false;
      setVaultKey(key);
      await loadUnlockedData();
      setVaultState("unlocked");
      return true;
    },
    [loadUnlockedData],
  );

  const lockVault = useCallback(() => {
    clearVaultKey();
    setConfigState(null);
    setTransactionsState([]);
    setVaultState("locked");
  }, []);

  /**
   * Re-encrypts all vault data under a new PIN. Uses the in-memory
   * config/transactions as the source of truth so we don't have to
   * round-trip through decrypt.
   */
  const changePin = useCallback(
    async (currentPin: string, newPin: string): Promise<boolean> => {
      const meta = loadVaultMeta();
      if (!meta) return false;
      const currentKey = await verifyPin(currentPin, meta);
      if (!currentKey) return false;

      // Derive the new key
      const newSalt = generateSalt();
      const newKey = await deriveKey(newPin, newSalt);
      const newVerifier = await computeVerifier(newKey);

      // Encrypt everything under the new key FIRST. If any encryption
      // fails, nothing is written — avoids partial corruption where config
      // is under the new key but transactions are still under the old one.
      const configBlob = config ? await encryptJson(config, newKey) : null;
      const txBlob = transactions.length > 0 ? await encryptJson(transactions, newKey) : null;

      const newMeta: VaultMeta = {
        v: 1,
        salt: bytesToBase64(newSalt),
        verifier: newVerifier,
        createdAt: meta.createdAt,
      };

      // All encryption succeeded — write all at once
      if (configBlob) localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(configBlob));
      if (txBlob) localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(txBlob));
      saveVaultMeta(newMeta);
      setVaultKey(newKey);
      return true;
    },
    [config, transactions],
  );

  const setConfig = useCallback((cfg: HouseholdConfig) => {
    setConfigState(cfg);
    persist(saveConfig(cfg));
  }, []);

  const setTransactions = useCallback((txns: Transaction[]) => {
    setTransactionsState(txns);
    persist(saveTransactions(txns));
  }, []);

  const addTransactions = useCallback(
    (newTxns: Transaction[]) => {
      let merged: Transaction[];
      setTransactionsState((prev) => {
        const existingKeys = new Set(prev.map(transactionKey));
        const unique = newTxns.filter((t) => !existingKeys.has(transactionKey(t)));
        merged = [...prev, ...unique];
        return merged;
      });
      persist(saveTransactions(merged!));
      if (newTxns.length > 0) {
        const months = getAvailableMonths(merged!);
        if (months.length > 0) {
          setSelectedMonth(months[0]);
        }
      }
    },
    [],
  );

  const completeSetup = useCallback(() => {
    markSetupComplete();
    setIsSetupDone(true);
  }, []);

  // Merged categories: default + custom
  const allCategories = useMemo(
    () => getAllCategories(config?.customCategories),
    [config?.customCategories],
  );

  // O(1) category lookup by ID
  const categoryMap = useMemo(
    () => new Map(allCategories.map((c) => [c.id, c])),
    [allCategories],
  );

  // Budget entry mutations
  const addBudgetEntry = useCallback((entry: BudgetEntry) => {
    setConfigState((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, budgetEntries: [...(prev.budgetEntries || []), entry] };
      persist(saveConfig(updated));
      return updated;
    });
  }, []);

  const updateBudgetEntry = useCallback((categoryId: string, updates: Partial<BudgetEntry>) => {
    setConfigState((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        budgetEntries: (prev.budgetEntries || []).map((be) =>
          be.categoryId === categoryId ? { ...be, ...updates } : be,
        ),
      };
      persist(saveConfig(updated));
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
      persist(saveConfig(updated));
      return updated;
    });
  }, []);

  // Custom category mutations
  const addCustomCategory = useCallback((category: Category) => {
    setConfigState((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, customCategories: [...(prev.customCategories || []), category] };
      persist(saveConfig(updated));
      return updated;
    });
  }, []);

  const updateCustomCategory = useCallback((id: string, updates: Partial<Category>) => {
    setConfigState((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        customCategories: (prev.customCategories || []).map((c) =>
          c.id === id ? { ...c, ...updates } : c,
        ),
      };
      persist(saveConfig(updated));
      return updated;
    });
  }, []);

  const removeCustomCategory = useCallback((id: string, reassignTo: string) => {
    // Reassign transactions, budget entries, and rules that reference this category
    setTransactionsState((prevTxns) => {
      const updated = prevTxns.map((t) =>
        t.categoryId === id ? { ...t, categoryId: reassignTo } : t,
      );
      persist(saveTransactions(updated));
      return updated;
    });

    setConfigState((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        customCategories: (prev.customCategories || []).filter((c) => c.id !== id),
        budgetEntries: (prev.budgetEntries || []).map((be) =>
          be.categoryId === id ? { ...be, categoryId: reassignTo } : be,
        ),
        categorizationRules: (prev.categorizationRules || []).map((r) =>
          r.categoryId === id ? { ...r, categoryId: reassignTo } : r,
        ),
      };
      persist(saveConfig(updated));
      return updated;
    });
  }, []);

  const availableMonths = useMemo(() => getAvailableMonths(transactions), [transactions]);
  const monthTransactions = useMemo(
    () => getTransactionsForMonth(transactions, selectedMonth),
    [transactions, selectedMonth],
  );
  const monthlyStats = useMemo(() => getMonthlyStats(monthTransactions), [monthTransactions]);

  const contextValue: AppContextType = useMemo(() => ({
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
    vaultState,
    createVault,
    unlockVault,
    lockVault,
    changePin,
    allCategories,
    categoryMap,
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
  }), [
    config, setConfig, transactions, setTransactions, addTransactions,
    selectedMonth, availableMonths, monthlyStats, monthTransactions,
    isSetupDone, completeSetup, locale, isLoading, vaultState,
    createVault, unlockVault, lockVault, changePin, allCategories, categoryMap,
    addCustomCategory, updateCustomCategory, removeCustomCategory,
    addBudgetEntry, updateBudgetEntry, removeBudgetEntry,
    importState, setImportParsed, setImportImported, resetImport,
    startAiCategorization,
  ]);

  // While we're determining the vault state, render nothing (or a lightweight
  // skeleton) to avoid a flash of unlock screen.
  if (vaultState === "loading") {
    return (
      <AppContext.Provider value={contextValue}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-muted-foreground">Indlæser...</div>
        </div>
      </AppContext.Provider>
    );
  }

  // Locked: show the unlock gate. The gate has its own AppContext access for
  // `unlockVault` and the "forget everything" flow.
  if (vaultState === "locked") {
    return (
      <AppContext.Provider value={contextValue}>
        <PinUnlock
          locale={locale}
          onUnlock={unlockVault}
          onForget={() => {
            clearVault();
            localStorage.removeItem(STORAGE_KEYS.hasCompletedSetup);
            window.location.reload();
          }}
        />
      </AppContext.Provider>
    );
  }

  // Fresh or Unlocked: render children normally
  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
