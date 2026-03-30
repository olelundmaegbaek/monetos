"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { ProjectionMonth, ScheduledPayment } from "@/lib/forecast";

interface Props {
  data: ProjectionMonth[];
  locale: "da" | "en";
  onRangeChange: (months: number) => void;
  selectedRange: number;
}

const RANGE_OPTIONS = [3, 6, 12, 24];

export function ProjectionChart({ data, locale, onRangeChange, selectedRange }: Props) {
  const da = locale === "da";

  const formatDKK = (value: number) =>
    new Intl.NumberFormat("da-DK", {
      notation: "compact",
      compactDisplay: "short",
    }).format(value);

  return (
    <div className="space-y-4">
      {/* Range selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {da ? "Periode:" : "Range:"}
        </span>
        {RANGE_OPTIONS.map((months) => (
          <Button
            key={months}
            variant={selectedRange === months ? "default" : "outline"}
            size="sm"
            onClick={() => onRangeChange(months)}
          >
            {months} {da ? "mdr" : "mo"}
          </Button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="monthLabel"
            className="text-xs"
            interval={selectedRange <= 6 ? 0 : selectedRange <= 12 ? 1 : 2}
            angle={selectedRange > 6 ? -45 : 0}
            textAnchor={selectedRange > 6 ? "end" : "middle"}
            height={selectedRange > 6 ? 60 : 30}
          />
          <YAxis tickFormatter={formatDKK} className="text-xs" />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const monthData = data.find((d) => d.monthLabel === label);
              return (
                <div className="rounded-md border bg-card p-3 text-sm shadow-sm">
                  <p className="font-medium mb-1">{label}</p>
                  {payload.map((p) => (
                    <p key={p.dataKey as string} style={{ color: p.color }}>
                      {p.name}: {(p.value as number)?.toLocaleString("da-DK")} kr.
                    </p>
                  ))}
                  {monthData?.scheduledPayments && monthData.scheduledPayments.length > 0 && (
                    <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                      <p className="font-medium">{da ? "Planlagte betalinger:" : "Scheduled payments:"}</p>
                      {monthData.scheduledPayments.map((sp, i) => (
                        <p key={i}>
                          {sp.categoryName}: {sp.amount.toLocaleString("da-DK")} kr.
                          <span className="opacity-60"> ({sp.frequency === "quarterly" ? (da ? "kvartal" : "quarterly") : (da ? "årlig" : "yearly")})</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            }}
          />
          <Legend />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="income"
            name={da ? "Indkomst" : "Income"}
            stroke="#22c55e"
            fill="url(#colorIncome)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            name={da ? "Udgifter" : "Expenses"}
            stroke="#ef4444"
            fill="url(#colorExpenses)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="net"
            name={da ? "Netto" : "Net"}
            stroke="#3b82f6"
            fill="none"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <Area
            type="monotone"
            dataKey="cumulativeNet"
            name={da ? "Kumulativ netto" : "Cumulative net"}
            stroke="#8b5cf6"
            fill="none"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Explanation of terms */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span><strong>{da ? "Indkomst" : "Income"}:</strong> {da ? "Løn, overførsler og andre indbetalinger" : "Salary, transfers and other deposits"}</span>
        <span><strong>{da ? "Udgifter" : "Expenses"}:</strong> {da ? "Alle udbetalinger og regninger" : "All payments and bills"}</span>
        <span><strong>{da ? "Netto" : "Net"}:</strong> {da ? "Indkomst minus udgifter pr. måned" : "Income minus expenses per month"}</span>
        <span><strong>{da ? "Kumulativ netto" : "Cumulative net"}:</strong> {da ? "Samlet opsparing/underskud over hele perioden" : "Total savings/deficit across the entire period"}</span>
      </div>

      {/* Summary stats below chart */}
      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-muted-foreground">
              {da ? "Gns. månedlig indkomst" : "Avg. monthly income"}
            </p>
            <p className="font-bold text-green-600">
              {Math.round(
                data.reduce((s, d) => s + d.income, 0) / data.length
              ).toLocaleString("da-DK")}{" "}
              kr.
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {da ? "Gns. månedlige udgifter" : "Avg. monthly expenses"}
            </p>
            <p className="font-bold text-red-600">
              {Math.round(
                data.reduce((s, d) => s + d.expenses, 0) / data.length
              ).toLocaleString("da-DK")}{" "}
              kr.
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {da ? `Kumulativ netto (${data.length} mdr)` : `Cumulative net (${data.length} mo)`}
            </p>
            <p
              className={`font-bold ${
                data[data.length - 1].cumulativeNet >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {data[data.length - 1].cumulativeNet.toLocaleString("da-DK")} kr.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
