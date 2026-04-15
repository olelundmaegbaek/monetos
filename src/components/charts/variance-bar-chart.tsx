"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { MonthVariance } from "@/types";
import { formatDKKCompact } from "@/lib/utils";

interface Props {
  data: MonthVariance[];
  locale: "da" | "en";
}

export const VarianceBarChart = React.memo(function VarianceBarChart({ data, locale }: Props) {
  const da = locale === "da";

  const chartData = data.map((d) => ({
    monthLabel: d.monthLabel,
    projectedIncome: d.projectedIncome,
    actualIncome: d.hasActualData ? d.actualIncome : null,
    projectedExpenses: -d.projectedExpenses,
    actualExpenses: d.hasActualData ? -d.actualExpenses : null,
    hasActualData: d.hasActualData,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="monthLabel" className="text-xs" />
        <YAxis tickFormatter={formatDKKCompact} className="text-xs" />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-md border bg-card p-3 text-sm shadow-sm">
                <p className="font-medium mb-1">{label}</p>
                {payload.map((p) => {
                  if (p.value === null) return null;
                  return (
                    <p key={p.dataKey as string} style={{ color: p.color }}>
                      {p.name}: {Math.abs(p.value as number).toLocaleString("da-DK")} kr.
                    </p>
                  );
                })}
              </div>
            );
          }}
        />
        <Legend />
        <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="3 3" />

        {/* Income bars */}
        <Bar
          dataKey="projectedIncome"
          name={da ? "Proj. indkomst" : "Proj. income"}
          fill="var(--positive)"
          opacity={0.4}
          radius={[2, 2, 0, 0]}
        />
        <Bar
          dataKey="actualIncome"
          name={da ? "Faktisk indkomst" : "Actual income"}
          fill="var(--positive)"
          radius={[2, 2, 0, 0]}
        />

        {/* Expense bars (shown as negative) */}
        <Bar
          dataKey="projectedExpenses"
          name={da ? "Proj. udgifter" : "Proj. expenses"}
          fill="var(--negative)"
          opacity={0.4}
          radius={[0, 0, 2, 2]}
        />
        <Bar
          dataKey="actualExpenses"
          name={da ? "Faktiske udgifter" : "Actual expenses"}
          fill="var(--negative)"
          radius={[0, 0, 2, 2]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
});
