"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { calculateMultiMonthProjection } from "@/lib/forecast";

const IncomeVsExpensesChart = dynamic(() => import("@/components/charts/income-vs-expenses").then((m) => ({ default: m.IncomeVsExpensesChart })), { ssr: false, loading: () => <div className="h-[300px]" /> });
const CategoryPieChart = dynamic(() => import("@/components/charts/category-pie").then((m) => ({ default: m.CategoryPieChart })), { ssr: false, loading: () => <div className="h-[300px]" /> });
const ProjectionChart = dynamic(() => import("@/components/charts/projection-chart").then((m) => ({ default: m.ProjectionChart })), { ssr: false, loading: () => <div className="h-[400px]" /> });
import { TrendingUp, TrendingDown, Wallet, PiggyBank, BarChart3, Hash } from "lucide-react";

const formatKr = (amount: number) =>
  `${Math.round(amount).toLocaleString("da-DK")} kr.`;

export default function DashboardPage() {
  const { monthlyStats, monthTransactions, transactions, availableMonths, locale, selectedMonth, allCategories, categoryMap, config } = useApp();
  const da = locale === "da";

  const { totalIncome, totalExpenses, net, savingsRate, byCategory } = monthlyStats;

  // Projection
  const [dashProjectionRange, setDashProjectionRange] = useState(6);
  const projection = useMemo(
    () => calculateMultiMonthProjection(
      transactions,
      config?.budgetEntries || [],
      selectedMonth,
      allCategories,
      dashProjectionRange
    ),
    [transactions, config?.budgetEntries, selectedMonth, allCategories, dashProjectionRange]
  );

  // Top 3 expense categories
  const top3Categories = useMemo(() => {
    return byCategory
      .filter((c) => c.total < 0)
      .sort((a, b) => a.total - b.total) // most negative first
      .slice(0, 3)
      .map((c) => {
        const cat = categoryMap.get(c.categoryId);
        return { ...c, category: cat };
      });
  }, [byCategory, categoryMap]);

  // Recent transactions (sorted copy to avoid mutating memoized array)
  const recentTransactions = useMemo(
    () => [...monthTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [monthTransactions],
  );

  const stats = [
    {
      label: da ? "Indkomst" : "Income",
      value: formatKr(totalIncome),
      icon: TrendingUp,
      color: "text-positive",
      bg: "bg-positive/8",
    },
    {
      label: da ? "Udgifter" : "Expenses",
      value: formatKr(totalExpenses),
      icon: TrendingDown,
      color: "text-negative",
      bg: "bg-negative/8",
    },
    {
      label: da ? "Netto" : "Net",
      value: formatKr(net),
      icon: Wallet,
      color: net >= 0 ? "text-positive" : "text-negative",
      bg: net >= 0 ? "bg-positive/8" : "bg-negative/8",
    },
    {
      label: da ? "Opsparingsrate" : "Savings Rate",
      value: `${(savingsRate * 100).toFixed(1)}%`,
      icon: PiggyBank,
      color: savingsRate >= 0 ? "text-positive" : "text-negative",
      bg: savingsRate >= 0 ? "bg-positive/8" : "bg-negative/8",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h2 className="text-3xl font-serif tracking-tight">{da ? "Oversigt" : "Dashboard"}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {da ? "Dit finansielle overblik" : "Your financial overview"}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                  <p className={`text-2xl font-serif mt-1.5 ${s.color}`}>
                    {s.value}
                  </p>
                </div>
                <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {da ? "Indkomst vs. Udgifter" : "Income vs. Expenses"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeVsExpensesChart
              transactions={transactions}
              months={availableMonths}
              locale={locale}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {da ? "Udgifter pr. kategori" : "Expenses by Category"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart categoryData={byCategory} locale={locale} categories={allCategories} />
          </CardContent>
        </Card>
      </div>

      {/* Top 3 expense categories */}
      {top3Categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {da ? "Top 3 udgiftskategorier" : "Top 3 Expense Categories"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {top3Categories.map((item, i) => {
                const pct = totalExpenses > 0 ? (Math.abs(item.total) / totalExpenses) * 100 : 0;
                return (
                  <div key={item.categoryId} className="flex items-center gap-4">
                    <span className="text-2xl font-serif text-muted-foreground/40 w-8 text-right">{i + 1}</span>
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.category?.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium truncate">
                          {item.category ? (da ? item.category.nameDA : item.category.name) : item.categoryId}
                        </span>
                        <span className="text-sm font-serif text-negative ml-2">
                          {formatKr(Math.abs(item.total))}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: item.category?.color || "#888",
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projection chart */}
      {config?.budgetEntries && config.budgetEntries.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {da ? "Fremskrivning" : "Projection"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ProjectionChart
              data={projection.months}
              locale={locale}
              onRangeChange={setDashProjectionRange}
              selectedRange={dashProjectionRange}
            />
          </CardContent>
        </Card>
      )}

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {da ? "Seneste transaktioner" : "Recent Transactions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {da ? "Ingen transaktioner for denne måned" : "No transactions for this month"}
            </p>
          ) : (
            <div className="space-y-1">
              {recentTransactions.map((t) => {
                const cat = categoryMap.get(t.categoryId);
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{t.date}</span>
                        {cat && (
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: cat.color, color: cat.color }}
                          >
                            {da ? cat.nameDA : cat.name}
                          </Badge>
                        )}
                        {t.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs gap-0.5">
                            <Hash className="h-2.5 w-2.5" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-serif ml-4 ${
                        t.amount >= 0 ? "text-positive" : "text-negative"
                      }`}
                    >
                      {t.amount.toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr.
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
