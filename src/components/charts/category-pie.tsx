"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { defaultCategories } from "@/config/categories";
import { Category } from "@/types";

interface Props {
  categoryData: { categoryId: string; total: number }[];
  locale: "da" | "en";
  categories?: Category[];
}

export function CategoryPieChart({ categoryData, locale, categories }: Props) {
  const cats = categories || defaultCategories;
  // Filter to expenses and take top 8
  const expenseData = categoryData
    .filter((d) => d.total < 0)
    .map((d) => {
      const cat = cats.find((c) => c.id === d.categoryId);
      return {
        name: cat ? (locale === "da" ? cat.nameDA : cat.name) : d.categoryId,
        value: Math.abs(d.total),
        color: cat?.color || "#9ca3af",
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (expenseData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        {locale === "da" ? "Ingen udgifter endnu" : "No expenses yet"}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={expenseData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {expenseData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number | undefined) => value != null ? `${value.toLocaleString("da-DK")} kr.` : ""}
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          wrapperStyle={{ fontSize: "12px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
