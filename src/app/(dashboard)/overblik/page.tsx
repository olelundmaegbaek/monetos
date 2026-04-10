"use client";

import { useMemo } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VarianceBarChart } from "@/components/charts/variance-bar-chart";
import { VarianceTrendChart } from "@/components/charts/variance-trend-chart";
import {
  calculateVarianceHistory,
  getMonthRange,
  detectAnomalies,
} from "@/lib/variance";
import { Anomaly } from "@/types";
import { AlertTriangle, TrendingDown, TrendingUp, Target, ArrowDown, ArrowUp } from "lucide-react";

export default function OverblikPage() {
  const { config, transactions, locale, selectedMonth, allCategories } = useApp();
  const da = locale === "da";
  const budgetEntries = useMemo(() => config?.budgetEntries || [], [config?.budgetEntries]);

  // Calculate variance for all months with transactions
  const monthRange = useMemo(() => getMonthRange(transactions), [transactions]);

  const varianceHistory = useMemo(() => {
    if (monthRange.length === 0) return [];
    return calculateVarianceHistory(transactions, budgetEntries, allCategories, monthRange);
  }, [transactions, budgetEntries, allCategories, monthRange]);

  // Last 6 months for bar chart
  const recentMonths = useMemo(
    () => varianceHistory.slice(-6),
    [varianceHistory]
  );

  // Anomalies for selected month
  const anomalies = useMemo(
    () => detectAnomalies(transactions, budgetEntries, allCategories, selectedMonth),
    [transactions, budgetEntries, allCategories, selectedMonth]
  );

  // Current month variance
  const currentVariance = useMemo(
    () => varianceHistory.find((v) => v.month === selectedMonth),
    [varianceHistory, selectedMonth]
  );

  // Months with actual data for trends
  const monthsWithData = useMemo(
    () => varianceHistory.filter((v) => v.hasActualData),
    [varianceHistory]
  );

  // Accuracy score: average absolute percent deviation across months with data
  const accuracyScore = useMemo(() => {
    if (monthsWithData.length === 0) return null;
    let totalDeviation = 0;
    let count = 0;
    for (const month of monthsWithData) {
      if (month.projectedExpenses > 0) {
        const dev = Math.abs(month.actualExpenses - month.projectedExpenses) / month.projectedExpenses * 100;
        totalDeviation += dev;
        count++;
      }
    }
    return count > 0 ? Math.max(0, Math.round(100 - totalDeviation / count)) : null;
  }, [monthsWithData]);

  // Worst offenders: categories with highest average absolute deviation
  const worstOffenders = useMemo(() => {
    if (monthsWithData.length < 1) return [];
    const catDeviations = new Map<string, { name: string; deviations: number[]; totalVariance: number }>();

    for (const month of monthsWithData) {
      for (const cv of month.byCategory) {
        if (cv.projected === 0 && cv.actual === 0) continue;
        const existing = catDeviations.get(cv.categoryId) || {
          name: cv.categoryName,
          deviations: [],
          totalVariance: 0,
        };
        existing.deviations.push(cv.percentDeviation);
        existing.totalVariance += Math.abs(cv.variance);
        catDeviations.set(cv.categoryId, existing);
      }
    }

    return [...catDeviations.entries()]
      .map(([id, data]) => ({
        categoryId: id,
        categoryName: data.name,
        avgDeviation: Math.round(data.deviations.reduce((s, v) => s + Math.abs(v), 0) / data.deviations.length),
        totalVariance: Math.round(data.totalVariance),
        months: data.deviations.length,
      }))
      .sort((a, b) => b.totalVariance - a.totalVariance)
      .slice(0, 10);
  }, [monthsWithData]);

  const formatDKK = (amount: number) =>
    Math.round(amount).toLocaleString("da-DK") + " kr.";

  if (transactions.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{da ? "Overblik" : "Overview"}</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {da
              ? "Importer CSV-filer for at se overblik over projektioner vs. faktiske tal."
              : "Import CSV files to see an overview of projections vs. actuals."}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{da ? "Overblik" : "Overview"}</h1>

      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">{da ? "Månedsoversigt" : "Monthly"}</TabsTrigger>
          <TabsTrigger value="trends">{da ? "Tendenser" : "Trends"}</TabsTrigger>
          <TabsTrigger value="anomalies">
            {da ? "Afvigelser" : "Anomalies"}
            {anomalies.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {anomalies.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* === MONTHLY OVERVIEW === */}
        <TabsContent value="monthly" className="space-y-6">
          {/* Summary cards for selected month */}
          {currentVariance && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryCard
                title={da ? "Indkomst" : "Income"}
                subtitle={da ? "Løn, overførsler og andre indbetalinger" : "Salary, transfers and other deposits"}
                projected={currentVariance.projectedIncome}
                actual={currentVariance.hasActualData ? currentVariance.actualIncome : null}
                icon={<TrendingUp className="h-4 w-4 text-green-500" />}
                positiveIsGood={true}
                da={da}
              />
              <SummaryCard
                title={da ? "Udgifter" : "Expenses"}
                subtitle={da ? "Alle udbetalinger og regninger" : "All payments and bills"}
                projected={currentVariance.projectedExpenses}
                actual={currentVariance.hasActualData ? currentVariance.actualExpenses : null}
                icon={<TrendingDown className="h-4 w-4 text-red-500" />}
                positiveIsGood={false}
                da={da}
              />
              <SummaryCard
                title={da ? "Netto" : "Net"}
                subtitle={da ? "Indkomst minus udgifter — det du har til overs" : "Income minus expenses — what you have left"}
                projected={currentVariance.projectedNet}
                actual={currentVariance.hasActualData ? currentVariance.actualNet : null}
                icon={<Target className="h-4 w-4 text-blue-500" />}
                positiveIsGood={true}
                da={da}
              />
            </div>
          )}

          {/* Grouped bar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {da ? "Projekteret vs. faktisk (seneste 6 mdr)" : "Projected vs. actual (last 6 months)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentMonths.length > 0 ? (
                <VarianceBarChart data={recentMonths} locale={locale} />
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">
                  {da ? "Ingen data endnu" : "No data yet"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Category variance table for selected month */}
          {currentVariance && currentVariance.hasActualData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {da ? "Afvigelse pr. kategori" : "Variance by category"} — {currentVariance.monthLabel}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 pr-4">{da ? "Kategori" : "Category"}</th>
                        <th className="text-right py-2 px-2">{da ? "Projekteret" : "Projected"}</th>
                        <th className="text-right py-2 px-2">{da ? "Faktisk" : "Actual"}</th>
                        <th className="text-right py-2 px-2">{da ? "Afvigelse" : "Variance"}</th>
                        <th className="text-right py-2 pl-2">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentVariance.byCategory
                        .filter((cv) => cv.projected !== 0 || cv.actual !== 0)
                        .map((cv) => (
                          <tr key={cv.categoryId} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">{cv.categoryName}</td>
                            <td className="text-right py-2 px-2 text-muted-foreground">
                              {formatDKK(cv.projected)}
                            </td>
                            <td className="text-right py-2 px-2">{formatDKK(cv.actual)}</td>
                            <td
                              className={`text-right py-2 px-2 font-medium ${
                                cv.variance > 0 ? "text-green-600" : cv.variance < 0 ? "text-red-600" : ""
                              }`}
                            >
                              {cv.variance > 0 ? "+" : ""}
                              {formatDKK(cv.variance)}
                            </td>
                            <td
                              className={`text-right py-2 pl-2 ${
                                Math.abs(cv.percentDeviation) > 50
                                  ? "text-red-600 font-medium"
                                  : Math.abs(cv.percentDeviation) > 20
                                  ? "text-yellow-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {cv.percentDeviation > 0 ? "+" : ""}
                              {cv.percentDeviation}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === TRENDS === */}
        <TabsContent value="trends" className="space-y-6">
          {/* Accuracy score */}
          {accuracyScore !== null && (
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {da ? "Gennemsnitlig nøjagtighed" : "Average accuracy"}
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      <span
                        className={
                          accuracyScore >= 80
                            ? "text-green-600"
                            : accuracyScore >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {accuracyScore}%
                      </span>
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-xs text-right">
                    {da
                      ? `Baseret på ${monthsWithData.length} måned${monthsWithData.length !== 1 ? "er" : ""} med data`
                      : `Based on ${monthsWithData.length} month${monthsWithData.length !== 1 ? "s" : ""} of data`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trend chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {da ? "Afvigelses-trend pr. kategori (%)" : "Deviation trend by category (%)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VarianceTrendChart data={monthsWithData} locale={locale} />
            </CardContent>
          </Card>

          {/* Worst offenders table */}
          {worstOffenders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {da ? "Største afvigere" : "Largest deviators"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 pr-4">{da ? "Kategori" : "Category"}</th>
                      <th className="text-right py-2 px-2">{da ? "Gns. afvigelse" : "Avg. deviation"}</th>
                      <th className="text-right py-2 px-2">{da ? "Total afvigelse" : "Total variance"}</th>
                      <th className="text-right py-2 pl-2">{da ? "Måneder" : "Months"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {worstOffenders.map((wo) => (
                      <tr key={wo.categoryId} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{wo.categoryName}</td>
                        <td
                          className={`text-right py-2 px-2 ${
                            wo.avgDeviation > 50 ? "text-red-600 font-medium" : ""
                          }`}
                        >
                          {wo.avgDeviation}%
                        </td>
                        <td className="text-right py-2 px-2">{formatDKK(wo.totalVariance)}</td>
                        <td className="text-right py-2 pl-2 text-muted-foreground">{wo.months}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === ANOMALIES === */}
        <TabsContent value="anomalies" className="space-y-4">
          {anomalies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {da
                  ? "Ingen afvigelser fundet for den valgte måned."
                  : "No anomalies found for the selected month."}
              </CardContent>
            </Card>
          ) : (
            anomalies.map((anomaly, i) => (
              <AnomalyCard key={i} anomaly={anomaly} da={da} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// === Sub-components ===

function SummaryCard({
  title,
  subtitle,
  projected,
  actual,
  icon,
  positiveIsGood,
  da,
}: {
  title: string;
  subtitle?: string;
  projected: number;
  actual: number | null;
  icon: React.ReactNode;
  positiveIsGood: boolean;
  da: boolean;
}) {
  const variance = actual !== null ? actual - projected : null;
  const isGood = variance !== null ? (positiveIsGood ? variance >= 0 : variance <= 0) : null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70 mt-0.5 ml-6">{subtitle}</p>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground">{da ? "Projekteret" : "Projected"}</span>
            <span className="text-lg font-semibold">
              {Math.round(projected).toLocaleString("da-DK")} kr.
            </span>
          </div>
          {actual !== null && (
            <>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground">{da ? "Faktisk" : "Actual"}</span>
                <span className="text-lg font-semibold">
                  {Math.round(actual).toLocaleString("da-DK")} kr.
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t">
                <span className="text-xs text-muted-foreground">{da ? "Afvigelse" : "Variance"}</span>
                <span
                  className={`text-sm font-medium flex items-center gap-1 ${
                    isGood ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isGood ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {variance! > 0 ? "+" : ""}
                  {Math.round(variance!).toLocaleString("da-DK")} kr.
                </span>
              </div>
            </>
          )}
          {actual === null && (
            <p className="text-xs text-muted-foreground italic">
              {da ? "Ingen faktiske data endnu" : "No actual data yet"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AnomalyCard({ anomaly, da }: { anomaly: Anomaly; da: boolean }) {
  const severityColor = {
    high: "border-red-500 bg-red-50 dark:bg-red-950/20",
    medium: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
    low: "border-blue-500 bg-blue-50 dark:bg-blue-950/20",
  };

  const severityBadge = {
    high: "destructive" as const,
    medium: "secondary" as const,
    low: "outline" as const,
  };

  const typeLabels = {
    large_transaction: da ? "Stor transaktion" : "Large transaction",
    missing_expected: da ? "Manglende forventet" : "Missing expected",
    unexpected_category: da ? "Uventet kategori" : "Unexpected category",
  };

  return (
    <Card className={`border-l-4 ${severityColor[anomaly.severity]}`}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className={`h-5 w-5 mt-0.5 ${
              anomaly.severity === "high"
                ? "text-red-500"
                : anomaly.severity === "medium"
                ? "text-yellow-500"
                : "text-blue-500"
            }`}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={severityBadge[anomaly.severity]}>
                {typeLabels[anomaly.type]}
              </Badge>
              {anomaly.categoryName && (
                <span className="text-xs text-muted-foreground">{anomaly.categoryName}</span>
              )}
            </div>
            <p className="text-sm">{da ? anomaly.descriptionDA : anomaly.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
