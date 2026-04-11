"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Transaction } from "@/types";
import { format, parse } from "date-fns";
import { da as daLocale } from "date-fns/locale";

interface Props {
  transactions: Transaction[];
  months: string[];
  locale: "da" | "en";
}

export function IncomeVsExpensesChart({ transactions, months, locale }: Props) {
  const data = months
    .slice(0, 6)
    .reverse()
    .map((month) => {
      const monthTxns = transactions.filter((t) => t.date.startsWith(month));
      const income = monthTxns
        .filter((t) => t.isIncome)
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTxns
        .filter((t) => !t.isIncome)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const date = parse(month + "-01", "yyyy-MM-dd", new Date());
      const label = format(date, "MMM", { locale: locale === "da" ? daLocale : undefined });

      return { month: label, income: Math.round(income), expenses: Math.round(expenses) };
    });

  const formatDKK = (value: number) =>
    new Intl.NumberFormat("da-DK", { notation: "compact", compactDisplay: "short" }).format(value);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" className="text-xs" />
        <YAxis tickFormatter={formatDKK} className="text-xs" />
        <Tooltip
          formatter={(value: number | undefined) => value != null ? `${value.toLocaleString("da-DK")} kr.` : ""}
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
        />
        <Legend />
        <Bar
          dataKey="income"
          name={locale === "da" ? "Indkomst" : "Income"}
          fill="var(--positive)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="expenses"
          name={locale === "da" ? "Udgifter" : "Expenses"}
          fill="var(--negative)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
