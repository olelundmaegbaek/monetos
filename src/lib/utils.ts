import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Transaction } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Compact DKK formatter for chart axes (e.g. "12K") */
export const formatDKKCompact = (value: number) =>
  new Intl.NumberFormat("da-DK", { notation: "compact", compactDisplay: "short" }).format(value);

/** Dedup key for a transaction — must be identical everywhere dedup is performed */
export function transactionKey(t: Pick<Transaction, "date" | "amount" | "name" | "description">): string {
  return `${t.date}|${t.amount}|${t.name}|${t.description}`;
}
