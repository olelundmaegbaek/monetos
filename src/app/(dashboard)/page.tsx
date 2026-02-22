"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IncomeVsExpensesChart } from "@/components/charts/income-vs-expenses";
import { CategoryPieChart } from "@/components/charts/category-pie";
import { ProjectionChart } from "@/components/charts/projection-chart";
import { calculateMultiMonthProjection } from "@/lib/forecast";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  const { monthlyStats, monthTransactions, transactions, availableMonths, locale, selectedMonth, allCategories, config } = useApp();
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

  const formatKr = (amount: number) =>
    `${Math.round(amount).toLocaleString("da-DK")} kr.`;

  // Recent transactions
  const recentTransactions = monthTransactions
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{da ? "Oversigt" : "Dashboard"}</h2>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{da ? "Indkomst" : "Income"}</p>
                <p className="text-2xl font-bold text-green-600">{formatKr(totalIncome)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{da ? "Udgifter" : "Expenses"}</p>
                <p className="text-2xl font-bold text-red-600">{formatKr(totalExpenses)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{da ? "Netto" : "Net"}</p>
                <p className={`text-2xl font-bold ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatKr(net)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{da ? "Opsparingsrate" : "Savings Rate"}</p>
                <p className={`text-2xl font-bold ${savingsRate >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {(savingsRate * 100).toFixed(1)}%
                </p>
              </div>
              <PiggyBank className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{da ? "Indkomst vs. Udgifter" : "Income vs. Expenses"}</CardTitle>
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
            <CardTitle className="text-base">{da ? "Udgifter pr. kategori" : "Expenses by Category"}</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart categoryData={byCategory} locale={locale} categories={allCategories} />
          </CardContent>
        </Card>
      </div>

      {/* Projection chart */}
      {config?.budgetEntries && config.budgetEntries.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">
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
          <CardTitle className="text-base">{da ? "Seneste transaktioner" : "Recent Transactions"}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {da ? "Ingen transaktioner for denne måned" : "No transactions for this month"}
            </p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((t) => {
                const cat = allCategories.find((c) => c.id === t.categoryId);
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
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
                      </div>
                    </div>
                    <span
                      className={`text-sm font-medium ml-4 ${
                        t.amount >= 0 ? "text-green-600" : "text-red-600"
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
