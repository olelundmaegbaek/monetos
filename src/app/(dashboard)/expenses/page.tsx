"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import dynamic from "next/dynamic";

const CategoryPieChart = dynamic(() => import("@/components/charts/category-pie").then((m) => ({ default: m.CategoryPieChart })), { ssr: false, loading: () => <div className="h-[300px]" /> });
import { ChevronDown, ChevronRight } from "lucide-react";

export default function ExpensesPage() {
  const { monthlyStats, monthTransactions, locale, allCategories } = useApp();
  const da = locale === "da";
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTransactions.filter((t) => !t.isIncome)) {
      const current = map.get(t.categoryId) || 0;
      map.set(t.categoryId, current + Math.abs(t.amount));
    }
    return Array.from(map.entries())
      .map(([categoryId, total]) => {
        const cat = allCategories.find((c) => c.id === categoryId);
        return {
          categoryId,
          name: cat ? (da ? cat.nameDA : cat.name) : categoryId,
          total,
          color: cat?.color || "#9ca3af",
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [monthTransactions, da]);

  const totalExpenses = monthlyStats.totalExpenses;

  // Top merchants
  const topMerchants = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTransactions.filter((t) => !t.isIncome)) {
      const key = t.description.substring(0, 30);
      const current = map.get(key) || 0;
      map.set(key, current + Math.abs(t.amount));
    }
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [monthTransactions]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-serif tracking-tight">{da ? "Udgifter" : "Expenses"}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{da ? "Fordeling" : "Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart categoryData={monthlyStats.byCategory} locale={locale} categories={allCategories} />
          </CardContent>
        </Card>

        {/* Top merchants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{da ? "Største udgiftssteder" : "Top Merchants"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topMerchants.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <span className="text-sm truncate max-w-[200px]">{m.name}</span>
                  <span className="text-sm font-medium text-negative">
                    {Math.round(m.total).toLocaleString("da-DK")} kr.
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{da ? "Udgifter pr. kategori" : "Expenses by Category"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expensesByCategory.map((cat) => {
              const pct = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0;
              const isExpanded = expandedCat === cat.categoryId;
              const catTransactions = monthTransactions
                .filter((t) => !t.isIncome && t.categoryId === cat.categoryId)
                .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

              return (
                <div key={cat.categoryId}>
                  <button
                    onClick={() => setExpandedCat(isExpanded ? null : cat.categoryId)}
                    className="w-full"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm flex-1 text-left">{cat.name}</span>
                      <span className="text-sm font-medium text-negative">
                        {Math.round(cat.total).toLocaleString("da-DK")} kr.
                      </span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={pct} className="mt-1 h-1.5 ml-7" />
                  </button>

                  {isExpanded && (
                    <div className="ml-10 mt-2 space-y-1 mb-3">
                      {catTransactions.map((t) => (
                        <div key={t.id} className="flex justify-between text-xs py-1 text-muted-foreground">
                          <span className="truncate max-w-[250px]">{t.description}</span>
                          <span className="text-negative">
                            {Math.abs(t.amount).toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr.
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>{da ? "Total udgifter" : "Total Expenses"}</span>
              <span className="text-negative">
                {Math.round(totalExpenses).toLocaleString("da-DK")} kr.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
