"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: { month: string; total: number }[];
}

export const IncomeTrendChart = React.memo(function IncomeTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" className="text-xs" />
        <YAxis
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          className="text-xs"
        />
        <Tooltip
          formatter={(value: number | undefined) => value != null ? `${value.toLocaleString("da-DK")} kr.` : ""}
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
        />
        <Bar dataKey="total" fill="var(--positive)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});
