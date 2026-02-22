"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ForecastCategoryEntry } from "@/types";

interface Props {
  forecastData: ForecastCategoryEntry[];
  locale: "da" | "en";
}

interface ChartRow {
  name: string;
  budget: number;
  historical: number;
}

export function ForecastChart({ forecastData, locale }: Props) {
  const da = locale === "da";

  // Show top 10 expense categories (negative amounts)
  const chartData: ChartRow[] = forecastData
    .filter((e) => e.budgetAmount < 0 || e.historicalAverage < 0)
    .map((e): ChartRow => ({
      name: e.categoryName.length > 15
        ? e.categoryName.substring(0, 13) + "..."
        : e.categoryName,
      budget: Math.abs(e.budgetAmount),
      historical: Math.abs(e.historicalAverage),
    }))
    .sort((a, b) => Math.max(b.budget, b.historical) - Math.max(a.budget, a.historical))
    .slice(0, 10);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        {da ? "Ingen data til prognose" : "No data for forecast"}
      </div>
    );
  }

  const budgetLabel = "Budget";
  const histLabel = da ? "Historisk gns." : "Historical avg.";

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          type="number"
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          className="text-xs"
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          className="text-xs"
        />
        <Tooltip
          formatter={(value: number | undefined) =>
            value != null ? `${value.toLocaleString("da-DK")} kr.` : ""
          }
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        />
        <Legend />
        <Bar dataKey="budget" name={budgetLabel} fill="#3b82f6" radius={[0, 4, 4, 0]} />
        <Bar dataKey="historical" name={histLabel} fill="#f97316" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
