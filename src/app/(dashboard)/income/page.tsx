"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const IncomeTrendChart = dynamic(() => import("@/components/charts/income-trend-chart").then((m) => ({ default: m.IncomeTrendChart })), { ssr: false, loading: () => <div className="h-[250px]" /> });

export default function IncomePage() {
  const { monthTransactions, transactions, availableMonths, locale, allCategories } = useApp();
  const da = locale === "da";

  // Income by source for current month
  const incomeBySource = useMemo(() => {
    const incTxns = monthTransactions.filter((t) => t.isIncome);
    const map = new Map<string, number>();
    for (const t of incTxns) {
      const current = map.get(t.categoryId) || 0;
      map.set(t.categoryId, current + t.amount);
    }
    return Array.from(map.entries())
      .map(([categoryId, total]) => {
        const cat = allCategories.find((c) => c.id === categoryId);
        return {
          categoryId,
          name: cat ? (da ? cat.nameDA : cat.name) : categoryId,
          total,
          color: cat?.color || "#22c55e",
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [monthTransactions, da]);

  // Monthly income trend
  const trendData = useMemo(() => {
    return availableMonths
      .slice(0, 6)
      .reverse()
      .map((month) => {
        const monthTxns = transactions.filter((t) => t.date.startsWith(month) && t.isIncome);
        const total = monthTxns.reduce((sum, t) => sum + t.amount, 0);
        return {
          month: month.substring(5),
          total: Math.round(total),
        };
      });
  }, [transactions, availableMonths]);

  const totalIncome = incomeBySource.reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{da ? "Indkomst" : "Income"}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income by source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{da ? "Indkomst pr. kilde" : "Income by Source"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incomeBySource.map((src) => (
                <div key={src.categoryId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: src.color }} />
                    <span className="text-sm">{src.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-positive">
                      {Math.round(src.total).toLocaleString("da-DK")} kr.
                    </span>
                    {totalIncome > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({((src.total / totalIncome) * 100).toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {incomeBySource.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  {da ? "Ingen indkomst denne måned" : "No income this month"}
                </p>
              )}
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>{da ? "Total" : "Total"}</span>
                <span className="text-positive">{Math.round(totalIncome).toLocaleString("da-DK")} kr.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{da ? "Månedlig tendens" : "Monthly Trend"}</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeTrendChart data={trendData} />
          </CardContent>
        </Card>
      </div>

      {/* Income transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{da ? "Indkomsttransaktioner" : "Income Transactions"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {monthTransactions
              .filter((t) => t.isIncome)
              .sort((a, b) => b.amount - a.amount)
              .map((t) => {
                const cat = allCategories.find((c) => c.id === t.categoryId);
                return (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm">{t.description}</p>
                      <div className="flex gap-2 items-center mt-0.5">
                        <span className="text-xs text-muted-foreground">{t.date}</span>
                        {cat && (
                          <Badge variant="outline" className="text-xs" style={{ borderColor: cat.color }}>
                            {da ? cat.nameDA : cat.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-positive">
                      +{t.amount.toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr.
                    </span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
