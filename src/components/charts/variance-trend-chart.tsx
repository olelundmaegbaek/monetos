"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { MonthVariance } from "@/types";

interface Props {
  data: MonthVariance[];
  locale: "da" | "en";
}

const TREND_COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#06b6d4"];

export function VarianceTrendChart({ data, locale }: Props) {
  const da = locale === "da";

  const catVariances = new Map<string, { name: string; totalAbsVariance: number }>();

  for (const month of data) {
    for (const cv of month.byCategory) {
      if (cv.projected === 0 && cv.actual === 0) continue;
      const existing = catVariances.get(cv.categoryId) || { name: cv.categoryName, totalAbsVariance: 0 };
      existing.totalAbsVariance += Math.abs(cv.variance);
      catVariances.set(cv.categoryId, existing);
    }
  }

  const topCategories = [...catVariances.entries()]
    .sort((a, b) => b[1].totalAbsVariance - a[1].totalAbsVariance)
    .slice(0, 5);

  if (topCategories.length === 0 || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        {da ? "Mindst 2 måneder med data kræves for tendenser" : "At least 2 months of data required for trends"}
      </div>
    );
  }

  // Build chart data
  const chartData = data.map((month) => {
    const point: Record<string, string | number> = { monthLabel: month.monthLabel };
    for (const [catId, info] of topCategories) {
      const cv = month.byCategory.find((c) => c.categoryId === catId);
      point[catId] = cv?.percentDeviation || 0;
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="monthLabel" className="text-xs" />
        <YAxis
          tickFormatter={(v) => `${v}%`}
          className="text-xs"
          domain={["auto", "auto"]}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-md border bg-card p-3 text-sm shadow-sm">
                <p className="font-medium mb-1">{label}</p>
                {payload.map((p) => (
                  <p key={p.dataKey as string} style={{ color: p.color }}>
                    {p.name}: {p.value}%
                  </p>
                ))}
              </div>
            );
          }}
        />
        <Legend />
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
        {topCategories.map(([catId, info], i) => (
          <Line
            key={catId}
            type="monotone"
            dataKey={catId}
            name={info.name}
            stroke={TREND_COLORS[i]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
