"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/stores";
import { getAllCategories } from "@/config/categories";
import {
  getTransactionsForMonth,
  getMonthlyStats,
  getAvailableMonths,
} from "@/lib/stats";

export type { ImportState } from "@/lib/stores/app-store";

export function useApp() {
  const state = useAppStore();

  const availableMonths = useMemo(
    () => getAvailableMonths(state.transactions),
    [state.transactions]
  );

  const monthTransactions = useMemo(
    () => getTransactionsForMonth(state.transactions, state.selectedMonth),
    [state.transactions, state.selectedMonth]
  );

  const monthlyStats = useMemo(
    () => getMonthlyStats(monthTransactions),
    [monthTransactions]
  );

  const allCategories = useMemo(
    () => getAllCategories(state.config?.customCategories),
    [state.config?.customCategories]
  );

  return {
    ...state,
    availableMonths,
    monthTransactions,
    monthlyStats,
    allCategories,
  };
}
