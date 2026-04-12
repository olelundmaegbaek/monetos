"use client";

import { Transaction, HouseholdConfig, AIProvider, AIProviderConfig } from "@/types";
import {
  EncryptedBlob,
  VaultMeta,
  VaultLockedError,
  encryptJson,
  decryptJson,
} from "./crypto";

const STORAGE_KEYS = {
  config: "pf_config",
  transactions: "pf_transactions",
  hasCompletedSetup: "pf_setup_done",
  aiConfig: "pf_ai_config",
  openaiApiKey: "pf_openai_key", // legacy — migrated to pf_ai_config
  vaultMeta: "pf_vault_meta",
} as const;

// === IN-MEMORY VAULT KEY ===
// Held in memory only — cleared on reload. The provider sets this after
// createVault() or a successful unlockVault() and clears it on lock.

let _vaultKey: CryptoKey | null = null;

export function setVaultKey(key: CryptoKey | null): void {
  _vaultKey = key;
}

export function getVaultKey(): CryptoKey | null {
  return _vaultKey;
}

export function clearVaultKey(): void {
  _vaultKey = null;
}

function requireKey(): CryptoKey {
  if (!_vaultKey) throw new VaultLockedError();
  return _vaultKey;
}

// === VAULT META (plaintext) ===

export function hasVault(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEYS.vaultMeta) !== null;
}

export function loadVaultMeta(): VaultMeta | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS.vaultMeta);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VaultMeta;
  } catch {
    return null;
  }
}

export function saveVaultMeta(meta: VaultMeta): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.vaultMeta, JSON.stringify(meta));
}

export function clearVault(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.vaultMeta);
  localStorage.removeItem(STORAGE_KEYS.config);
  localStorage.removeItem(STORAGE_KEYS.transactions);
  localStorage.removeItem(STORAGE_KEYS.hasCompletedSetup);
  clearVaultKey();
}

// === WRITE SERIALIZER ===
// Ensures fire-and-forget async writes to the same key don't race.

const writeQueue = new Map<string, Promise<unknown>>();

function enqueue<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = writeQueue.get(key) ?? Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  writeQueue.set(
    key,
    next.catch(() => {}),
  );
  return next;
}

// === ENCRYPTED STORAGE PRIMITIVES ===

async function readEncrypted<T>(key: string): Promise<T | null> {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  let blob: EncryptedBlob;
  try {
    blob = JSON.parse(raw) as EncryptedBlob;
  } catch {
    return null;
  }
  const cryptoKey = requireKey();
  try {
    return await decryptJson<T>(blob, cryptoKey);
  } catch {
    return null;
  }
}

async function writeEncrypted<T>(key: string, data: T): Promise<void> {
  if (typeof window === "undefined") return;
  const cryptoKey = requireKey();
  const blob = await encryptJson(data, cryptoKey);
  localStorage.setItem(key, JSON.stringify(blob));
}

// === CONFIG ===

export async function saveConfig(config: HouseholdConfig): Promise<void> {
  await enqueue(STORAGE_KEYS.config, () => writeEncrypted(STORAGE_KEYS.config, config));
}

export async function loadConfig(): Promise<HouseholdConfig | null> {
  const config = await readEncrypted<HouseholdConfig>(STORAGE_KEYS.config);
  if (!config) return null;
  return migrateBudgetEntries(config);
}

/**
 * Migrate old budget entries where quarterly/yearly entries stored monthly equivalents
 * to the new format where they store the actual payment amount.
 * Entries that already have paymentMonths are considered migrated.
 */
async function migrateBudgetEntries(config: HouseholdConfig): Promise<HouseholdConfig> {
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
    await saveConfig(updated);
    return updated;
  }
  return config;
}

// === TRANSACTIONS ===

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  await enqueue(STORAGE_KEYS.transactions, () =>
    writeEncrypted(STORAGE_KEYS.transactions, transactions),
  );
}

export async function loadTransactions(): Promise<Transaction[]> {
  const txns = await readEncrypted<Transaction[]>(STORAGE_KEYS.transactions);
  return txns ?? [];
}

export async function addTransactions(
  existing: Transaction[],
  newTransactions: Transaction[],
): Promise<Transaction[]> {
  // Deduplicate by date + amount + name + description to prevent double-imports
  const existingKeys = new Set(
    existing.map((t) => `${t.date}|${t.amount}|${t.name}|${t.description}`),
  );
  const unique = newTransactions.filter(
    (t) => !existingKeys.has(`${t.date}|${t.amount}|${t.name}|${t.description}`),
  );
  const merged = [...existing, ...unique];
  await saveTransactions(merged);
  return merged;
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

// === AI PROVIDER CONFIG ===

export function saveAiConfig(config: AIProviderConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.aiConfig, JSON.stringify(config));
  // Clean up legacy key if present
  localStorage.removeItem(STORAGE_KEYS.openaiApiKey);
}

export function loadAiConfig(): AIProviderConfig | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS.aiConfig);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AIProviderConfig;
      if (parsed.provider && parsed.apiKey) return parsed;
    } catch { /* fall through */ }
  }
  // Migrate legacy openaiApiKey
  const legacyKey = localStorage.getItem(STORAGE_KEYS.openaiApiKey);
  if (legacyKey) {
    const migrated: AIProviderConfig = { provider: "openai", apiKey: legacyKey };
    saveAiConfig(migrated);
    return migrated;
  }
  return null;
}

export function clearAiConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.aiConfig);
  localStorage.removeItem(STORAGE_KEYS.openaiApiKey);
}

// === STATS HELPERS ===

export function getTransactionsForMonth(
  transactions: Transaction[],
  yearMonth: string, // "YYYY-MM"
): Transaction[] {
  return transactions.filter((t) => t.date.startsWith(yearMonth));
}

export function getMonthlyStats(transactions: Transaction[]) {
  const income = transactions.filter((t) => t.isIncome).reduce((sum, t) => sum + t.amount, 0);
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
