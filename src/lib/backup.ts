import { HouseholdConfig, Transaction } from "@/types";

export interface BackupData {
  config?: HouseholdConfig;
  transactions?: Transaction[];
}

export interface BackupSummary extends BackupData {
  txCount: number;
  budgetCount: number;
  ruleCount: number;
  displayName: string;
}

/**
 * Open a native file picker for a JSON backup file, parse and validate it.
 * Returns null if the user cancels or the file is invalid.
 */
export function pickBackupFile(): Promise<BackupSummary | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== "object") {
          resolve(null);
          return;
        }
        const hasConfig = parsed.config && typeof parsed.config === "object";
        const hasTxns = Array.isArray(parsed.transactions);
        if (!hasConfig && !hasTxns) {
          resolve(null);
          return;
        }
        resolve({
          config: hasConfig ? parsed.config : undefined,
          transactions: hasTxns ? parsed.transactions : undefined,
          txCount: hasTxns ? parsed.transactions.length : 0,
          budgetCount: hasConfig ? (parsed.config.budgetEntries?.length ?? 0) : 0,
          ruleCount: hasConfig ? (parsed.config.categorizationRules?.length ?? 0) : 0,
          displayName: hasConfig ? (parsed.config.displayName || parsed.config.name || "") : "",
        });
      } catch {
        resolve(null);
      }
    };
    input.click();
  });
}
