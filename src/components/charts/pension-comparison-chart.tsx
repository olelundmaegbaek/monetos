"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: { ratepension: string; tax: number; net: number }[];
  locale: "da" | "en";
  formatDKK: (value: number) => string;
}

export const PensionComparisonChart = React.memo(function PensionComparisonChart({ data, locale, formatDKK }: Props) {
  const da = locale === "da";

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="ratepension" label={{ value: "Ratepension", position: "bottom" }} />
        <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value: number | undefined, name: string | undefined) => [
            value != null ? formatDKK(value) : "",
            name === "tax" ? (da ? "Skat" : "Tax") : (da ? "Netto" : "Net"),
          ]}
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
        />
        <Bar dataKey="tax" name={da ? "Skat" : "Tax"} fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});
