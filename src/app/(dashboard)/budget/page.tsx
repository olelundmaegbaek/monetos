"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ForecastChart } from "@/components/charts/forecast-chart";
import { ProjectionChart } from "@/components/charts/projection-chart";
import { calculateMonthlyForecast, getNextMonth, calculateMultiMonthProjection, getAmountForMonth } from "@/lib/forecast";
import { BudgetEntry, BudgetVsActual, CategoryGroup } from "@/types";
import { getGroupForCategory, getExpenseGroups } from "@/config/category-groups";
import { Plus, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { formatDKK } from "@/lib/tax/calculator";
import { parseMonthNumber } from "@/lib/utils/date";
import { ConfidenceBadge, GroupedForecastRows, ReadOnlyRow, EditableRow } from "@/components/budget/budget-row-components";

export default function BudgetPage() {
  const {
    config,
    setConfig,
    monthTransactions,
    transactions,
    locale,
    selectedMonth,
    allCategories,
  } = useApp();
  const da = locale === "da";

  // === EDIT MODE ===
  const [editing, setEditing] = useState(false);
  const [draftEntries, setDraftEntries] = useState<BudgetEntry[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const startEditing = () => {
    setDraftEntries([...(config?.budgetEntries || [])]);
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraftEntries([]);
    setEditing(false);
  };

  const saveEditing = () => {
    if (!config) return;
    // Filter out entries with no category selected (incomplete rows)
    const cleaned = draftEntries.filter((e) => e.categoryId);
    setConfig({ ...config, budgetEntries: cleaned });
    setEditing(false);
  };

  // === INLINE EDIT (single row) ===
  const handleInlineSave = (categoryId: string, updates: Partial<BudgetEntry>) => {
    if (!config) return;
    const newEntries = config.budgetEntries.map((e) =>
      e.categoryId === categoryId ? { ...e, ...updates } : e
    );
    setConfig({ ...config, budgetEntries: newEntries });
  };

  const handleInlineDelete = (categoryId: string) => {
    if (!config) return;
    const confirmed = window.confirm(
      da ? "Slet dette budgetpost?" : "Delete this budget entry?"
    );
    if (!confirmed) return;
    const newEntries = config.budgetEntries.filter((e) => e.categoryId !== categoryId);
    setConfig({ ...config, budgetEntries: newEntries });
  };

  const updateDraftEntry = (index: number, updates: Partial<BudgetEntry>) => {
    setDraftEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...updates } : e)));
  };

  const removeDraftEntry = (index: number) => {
    setDraftEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const addDraftEntry = (type: "income" | "expense") => {
    setDraftEntries((prev) => [
      ...prev,
      {
        categoryId: "",
        monthlyAmount: type === "income" ? 0 : 0,
        frequency: "monthly" as const,
        notes: "",
      },
    ]);
  };

  // === BUDGET vs ACTUAL COMPUTATION ===
  const entries = useMemo(() => editing ? draftEntries : config?.budgetEntries || [], [editing, draftEntries, config?.budgetEntries]);

  const selectedMonthNumber = parseMonthNumber(selectedMonth);

  const budgetComparison = useMemo((): BudgetVsActual[] => {
    return entries
      .filter((be) => be.monthlyAmount < 0)
      .map((be) => {
        const cat = allCategories.find((c) => c.id === be.categoryId);
        const actual = monthTransactions
          .filter((t) => t.categoryId === be.categoryId && !t.isIncome)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const budgeted = Math.abs(getAmountForMonth(be, selectedMonthNumber));
        return {
          categoryId: be.categoryId,
          categoryName: cat ? (da ? cat.nameDA : cat.name) : be.categoryId,
          budgeted,
          actual,
          difference: budgeted - actual,
          percentUsed: budgeted > 0 ? (actual / budgeted) * 100 : 0,
        };
      })
      .sort((a, b) => b.percentUsed - a.percentUsed);
  }, [entries, monthTransactions, da, allCategories, selectedMonthNumber]);

  const incomeComparison = useMemo(() => {
    return entries
      .filter((be) => be.monthlyAmount > 0)
      .map((be) => {
        const cat = allCategories.find((c) => c.id === be.categoryId);
        const actual = monthTransactions
          .filter((t) => t.categoryId === be.categoryId && t.isIncome)
          .reduce((sum, t) => sum + t.amount, 0);
        const budgeted = getAmountForMonth(be, selectedMonthNumber);
        return {
          categoryId: be.categoryId,
          categoryName: cat ? (da ? cat.nameDA : cat.name) : be.categoryId,
          budgeted,
          actual,
          difference: actual - budgeted,
          percentUsed: budgeted > 0 ? (actual / budgeted) * 100 : 0,
        };
      });
  }, [entries, monthTransactions, da, allCategories, selectedMonthNumber]);

  const totalBudgeted = budgetComparison.reduce((s, b) => s + b.budgeted, 0);
  const totalActual = budgetComparison.reduce((s, b) => s + b.actual, 0);

  // === GROUPED EXPENSES ===
  const groupedExpenses = useMemo(() => {
    const expGroups = getExpenseGroups();
    return expGroups
      .map((group) => {
        const items = budgetComparison.filter(
          (b) => getGroupForCategory(b.categoryId).id === group.id
        );
        const totalBud = items.reduce((s, b) => s + b.budgeted, 0);
        const totalAct = items.reduce((s, b) => s + b.actual, 0);
        return {
          group,
          items,
          totalBudgeted: totalBud,
          totalActual: totalAct,
          totalDifference: totalBud - totalAct,
          percentUsed: totalBud > 0 ? (totalAct / totalBud) * 100 : 0,
        };
      })
      .filter((g) => g.items.length > 0);
  }, [budgetComparison]);

  const overBudgetCount = groupedExpenses.filter((g) => g.percentUsed > 100).length;

  // === FORECAST ===
  const nextMonth = getNextMonth(selectedMonth);
  const forecast = useMemo(
    () =>
      calculateMonthlyForecast(
        transactions,
        config?.budgetEntries || [],
        nextMonth,
        allCategories
      ),
    [transactions, config?.budgetEntries, nextMonth, allCategories]
  );

  // === PROJECTION ===
  const [projectionRange, setProjectionRange] = useState(6);
  const projection = useMemo(
    () =>
      calculateMultiMonthProjection(
        transactions,
        config?.budgetEntries || [],
        selectedMonth,
        allCategories,
        projectionRange
      ),
    [transactions, config?.budgetEntries, selectedMonth, allCategories, projectionRange]
  );

  // === GROUPED FORECAST ===
  const groupedForecast = useMemo(() => {
    const expGroups = getExpenseGroups();
    return expGroups
      .map((group) => {
        const groupEntries = forecast.byCategory.filter(
          (e) => getGroupForCategory(e.categoryId).id === group.id
        );
        if (groupEntries.length === 0) return null;
        const budgetAmount = groupEntries.reduce((s, e) => s + e.budgetAmount, 0);
        const historicalAverage = groupEntries.reduce((s, e) => s + e.historicalAverage, 0);
        const forecastedAmount = groupEntries.reduce((s, e) => s + e.forecastedAmount, 0);
        const confidenceOrder = { low: 0, medium: 1, high: 2 } as const;
        const worstConfidence = groupEntries.reduce(
          (worst, e) =>
            confidenceOrder[e.confidence] < confidenceOrder[worst] ? e.confidence : worst,
          "high" as "high" | "medium" | "low"
        );
        return { group, budgetAmount, historicalAverage, forecastedAmount, confidence: worstConfidence, children: groupEntries };
      })
      .filter(Boolean) as { group: CategoryGroup; budgetAmount: number; historicalAverage: number; forecastedAmount: number; confidence: "high" | "medium" | "low"; children: typeof forecast.byCategory }[];
  }, [forecast]);

  // Categories available for new entries
  const usedCategoryIds = new Set(draftEntries.map((e) => e.categoryId));

  if (!config?.budgetEntries || (config.budgetEntries.length === 0 && !editing)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{da ? "Budget" : "Budget"}</h2>
          <Button onClick={startEditing}>{da ? "Opret budget" : "Create Budget"}</Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {da
                ? "Ingen budgetdata. Klik 'Opret budget' for at starte."
                : "No budget data. Click 'Create Budget' to start."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{da ? "Budget" : "Budget"}</h2>
        {!editing ? (
          <Button onClick={startEditing}>{da ? "Rediger" : "Edit"}</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelEditing}>
              {da ? "Annullér" : "Cancel"}
            </Button>
            <Button onClick={saveEditing}>{da ? "Gem" : "Save"}</Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="actual">
        <TabsList>
          <TabsTrigger value="actual">{da ? "Budget vs. Faktisk" : "Budget vs. Actual"}</TabsTrigger>
          <TabsTrigger value="forecast">{da ? "Prognose" : "Forecast"}</TabsTrigger>
          <TabsTrigger value="projection">{da ? "Fremskrivning" : "Projection"}</TabsTrigger>
        </TabsList>

        {/* === BUDGET vs ACTUAL TAB === */}
        <TabsContent value="actual" className="space-y-6 mt-4">
          {/* Summary cards */}
          {!editing && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{da ? "Budgetteret" : "Budgeted"}</p>
                  <p className="text-2xl font-bold">
                    {Math.round(totalBudgeted).toLocaleString("da-DK")} kr.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{da ? "Faktisk" : "Actual"}</p>
                  <p className="text-2xl font-bold">
                    {Math.round(totalActual).toLocaleString("da-DK")} kr.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{da ? "Over budget" : "Over budget"}</p>
                  <p
                    className={`text-2xl font-bold ${
                      overBudgetCount > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {overBudgetCount} {da ? "grupper" : "groups"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Income section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{da ? "Indkomst" : "Income"}</CardTitle>
                {editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addDraftEntry("income")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {da ? "Tilføj" : "Add"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing
                ? draftEntries.map((entry, i) => {
                    if (entry.monthlyAmount < 0) return null;
                    // New entries or income entries
                    if (entry.categoryId !== "" && entry.monthlyAmount === 0) {
                      // Check if it's an expense category
                      const cat = allCategories.find((c) => c.id === entry.categoryId);
                      if (cat?.type === "expense") return null;
                    }
                    return (
                      <EditableRow
                        key={i}
                        entry={entry}
                        index={i}
                        allCategories={allCategories.filter((c) => c.type === "income")}
                        usedCategoryIds={usedCategoryIds}
                        da={da}
                        onUpdate={updateDraftEntry}
                        onRemove={removeDraftEntry}
                      />
                    );
                  })
                : incomeComparison.map((b) => {
                    const entry = config?.budgetEntries?.find((e) => e.categoryId === b.categoryId);
                    if (!entry) return null;
                    return (
                      <ReadOnlyRow
                        key={b.categoryId}
                        item={b}
                        entry={entry}
                        type="income"
                        da={da}
                        allCategories={allCategories}
                        onSave={handleInlineSave}
                        onDelete={handleInlineDelete}
                        isGlobalEditing={editing}
                      />
                    );
                  })}
            </CardContent>
          </Card>

          {/* Grouped expense sections */}
          {!editing ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{da ? "Udgifter" : "Expenses"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {groupedExpenses.map((gb) => {
                  const isExpanded = expandedGroups.has(gb.group.id);
                  const isOver = gb.percentUsed > 100;
                  return (
                    <div key={gb.group.id}>
                      <button
                        onClick={() => toggleGroup(gb.group.id)}
                        className="w-full text-left"
                      >
                        <div className="space-y-1 py-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: gb.group.color }}
                              />
                              <span className="font-medium">
                                {da ? gb.group.nameDA : gb.group.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({gb.items.length})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${isOver ? "text-red-600" : ""}`}>
                                {Math.round(gb.totalActual).toLocaleString("da-DK")}
                              </span>
                              <span className="text-muted-foreground">
                                / {Math.round(gb.totalBudgeted).toLocaleString("da-DK")} kr.
                              </span>
                              <Badge
                                variant={isOver ? "destructive" : "outline"}
                                className="text-xs"
                              >
                                {gb.percentUsed.toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                          <Progress
                            value={Math.min(gb.percentUsed, 100)}
                            className={`h-2 ${isOver ? "[&>div]:bg-red-500" : ""}`}
                          />
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="ml-6 border-l-2 pl-4 space-y-3 pb-2" style={{ borderColor: gb.group.color }}>
                          {gb.items.map((b) => {
                            const entry = config?.budgetEntries?.find(
                              (e) => e.categoryId === b.categoryId
                            );
                            if (!entry) return null;
                            return (
                              <ReadOnlyRow
                                key={b.categoryId}
                                item={b}
                                entry={entry}
                                type="expense"
                                da={da}
                                allCategories={allCategories}
                                onSave={handleInlineSave}
                                onDelete={handleInlineDelete}
                                isGlobalEditing={editing}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{da ? "Udgifter" : "Expenses"}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addDraftEntry("expense")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {da ? "Tilføj" : "Add"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {(() => {
                  const expGroups = getExpenseGroups();
                  const grouped = expGroups
                    .map((group) => ({
                      group,
                      entries: draftEntries
                        .map((e, i) => ({ entry: e, index: i }))
                        .filter(({ entry }) => {
                          if (entry.monthlyAmount > 0) return false;
                          if (entry.categoryId === "") return false;
                          const cat = allCategories.find((c) => c.id === entry.categoryId);
                          if (cat?.type === "income") return false;
                          return getGroupForCategory(entry.categoryId).id === group.id;
                        }),
                    }))
                    .filter((g) => g.entries.length > 0);
                  const unassigned = draftEntries
                    .map((e, i) => ({ entry: e, index: i }))
                    .filter(({ entry }) => entry.monthlyAmount <= 0 && entry.categoryId === "");
                  return (
                    <>
                      {grouped.map(({ group, entries: groupEntries }) => (
                        <div key={group.id}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                            <span className="text-sm font-medium">{da ? group.nameDA : group.name}</span>
                          </div>
                          <div className="space-y-2 ml-4">
                            {groupEntries.map(({ entry, index }) => (
                              <EditableRow
                                key={index}
                                entry={entry}
                                index={index}
                                allCategories={allCategories.filter((c) => c.type === "expense")}
                                usedCategoryIds={usedCategoryIds}
                                da={da}
                                onUpdate={updateDraftEntry}
                                onRemove={removeDraftEntry}
                                isExpense
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                      {unassigned.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-medium text-muted-foreground">
                              {da ? "Nye poster" : "New entries"}
                            </span>
                          </div>
                          <div className="space-y-2 ml-4">
                            {unassigned.map(({ entry, index }) => (
                              <EditableRow
                                key={index}
                                entry={entry}
                                index={index}
                                allCategories={allCategories.filter((c) => c.type === "expense")}
                                usedCategoryIds={usedCategoryIds}
                                da={da}
                                onUpdate={updateDraftEntry}
                                onRemove={removeDraftEntry}
                                isExpense
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === FORECAST TAB === */}
        <TabsContent value="forecast" className="space-y-6 mt-4">
          {/* Forecast summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  {da ? "Forventet indkomst" : "Expected Income"}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(forecast.forecastedIncome).toLocaleString("da-DK")} kr.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  {da ? "Forventet udgifter" : "Expected Expenses"}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {Math.round(forecast.forecastedExpenses).toLocaleString("da-DK")} kr.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  {da ? "Forventet netto" : "Expected Net"}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    forecast.forecastedNet >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {Math.round(forecast.forecastedNet).toLocaleString("da-DK")} kr.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Forecast chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {da ? "Budget vs. Historisk gennemsnit" : "Budget vs. Historical Average"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ForecastChart forecastData={forecast.byCategory} locale={locale} />
            </CardContent>
          </Card>

          {/* Grouped forecast detail table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {da ? "Prognose pr. gruppe" : "Forecast by Group"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-4">{da ? "Gruppe" : "Group"}</th>
                      <th className="py-2 pr-4 text-right">{da ? "Budget" : "Budget"}</th>
                      <th className="py-2 pr-4 text-right">{da ? "Historisk gns." : "Hist. avg."}</th>
                      <th className="py-2 pr-4 text-right">{da ? "Prognose" : "Forecast"}</th>
                      <th className="py-2">{da ? "Tillid" : "Confidence"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Income entries */}
                    {forecast.byCategory
                      .filter((e) => e.forecastedAmount > 0)
                      .map((entry) => {
                        const cat = allCategories.find((c) => c.id === entry.categoryId);
                        const catName = cat ? (da ? cat.nameDA : cat.name) : entry.categoryId;
                        return (
                          <tr key={entry.categoryId} className="border-b">
                            <td className="py-2 pr-4">{catName}</td>
                            <td className="py-2 pr-4 text-right">
                              {entry.budgetAmount !== 0
                                ? `${Math.round(entry.budgetAmount).toLocaleString("da-DK")} kr.`
                                : "—"}
                            </td>
                            <td className="py-2 pr-4 text-right">
                              {entry.historicalAverage !== 0
                                ? `${Math.round(entry.historicalAverage).toLocaleString("da-DK")} kr.`
                                : "—"}
                            </td>
                            <td className="py-2 pr-4 text-right font-medium text-green-600">
                              {Math.round(entry.forecastedAmount).toLocaleString("da-DK")} kr.
                            </td>
                            <td className="py-2">
                              <ConfidenceBadge confidence={entry.confidence} da={da} />
                            </td>
                          </tr>
                        );
                      })}
                    {/* Grouped expense entries */}
                    {groupedForecast
                      .filter((g) => g.forecastedAmount !== 0)
                      .sort((a, b) => a.forecastedAmount - b.forecastedAmount)
                      .map((gf) => {
                        const isExp = expandedGroups.has(`forecast_${gf.group.id}`);
                        return (
                          <GroupedForecastRows
                            key={gf.group.id}
                            group={gf.group}
                            budgetAmount={gf.budgetAmount}
                            historicalAverage={gf.historicalAverage}
                            forecastedAmount={gf.forecastedAmount}
                            confidence={gf.confidence}
                            childEntries={gf.children}
                            isExpanded={isExp}
                            onToggle={() => toggleGroup(`forecast_${gf.group.id}`)}
                            da={da}
                            allCategories={allCategories}
                          />
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === PROJECTION TAB === */}
        <TabsContent value="projection" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {da
                  ? `Indkomst / Udgifter / Netto — ${projectionRange} måneders fremskrivning`
                  : `Income / Expenses / Net — ${projectionRange} month projection`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectionChart
                data={projection.months}
                locale={locale}
                onRangeChange={setProjectionRange}
                selectedRange={projectionRange}
              />
            </CardContent>
          </Card>

          {/* Tight months warning */}
          {(() => {
            const tightMonths = projection.months.filter((m) => m.net < 0);
            if (tightMonths.length === 0) return null;
            return (
              <Card className="border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    {da ? "Stramme måneder" : "Tight Months"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tightMonths.map((m) => (
                    <div key={m.month} className="p-3 bg-muted/50 rounded-lg space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{m.monthLabel}</span>
                        <span className="text-red-600 font-medium text-sm">{formatDKK(m.net)}</span>
                      </div>
                      {m.scheduledPayments.length > 0 && (
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {m.scheduledPayments.map((sp, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{sp.categoryName}</span>
                              <span>{formatDKK(sp.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    {da
                      ? "Kvartalsvise betalinger kan skabe likviditets-pres. Overvej at spare op til disse måneder."
                      : "Quarterly payments can create cash flow pressure. Consider saving ahead for these months."}
                  </p>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

