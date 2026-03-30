"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ForecastChart } from "@/components/charts/forecast-chart";
import { ProjectionChart } from "@/components/charts/projection-chart";
import { calculateMonthlyForecast, getNextMonth, calculateMultiMonthProjection, getAmountForMonth, getMonthlyEquivalent, getDefaultPaymentMonths } from "@/lib/forecast";
import { BudgetEntry, BudgetFrequency, BudgetVsActual, CategoryGroup } from "@/types";
import { getGroupForCategory, getExpenseGroups } from "@/config/category-groups";
import { Trash2, Plus, Pencil, Check, X, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { formatDKK } from "@/lib/tax/calculator";

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
  const entries = editing ? draftEntries : config?.budgetEntries || [];

  const selectedMonthNumber = parseInt(selectedMonth.split("-")[1]);

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
  }, [forecast.byCategory]);

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
                    const entry = config!.budgetEntries.find((e) => e.categoryId === b.categoryId)!;
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
                            const entry = config!.budgetEntries.find(
                              (e) => e.categoryId === b.categoryId
                            )!;
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

// === SUB-COMPONENTS ===

function ConfidenceBadge({ confidence, da }: { confidence: "high" | "medium" | "low"; da: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        confidence === "high"
          ? "border-green-500 text-green-600"
          : confidence === "medium"
          ? "border-yellow-500 text-yellow-600"
          : "border-red-500 text-red-600"
      }
    >
      {confidence === "high"
        ? (da ? "Høj" : "High")
        : confidence === "medium"
        ? (da ? "Middel" : "Medium")
        : (da ? "Lav" : "Low")}
    </Badge>
  );
}

function GroupedForecastRows({
  group,
  budgetAmount,
  historicalAverage,
  forecastedAmount,
  confidence,
  childEntries,
  isExpanded,
  onToggle,
  da,
  allCategories,
}: {
  group: CategoryGroup;
  budgetAmount: number;
  historicalAverage: number;
  forecastedAmount: number;
  confidence: "high" | "medium" | "low";
  childEntries: { categoryId: string; budgetAmount: number; historicalAverage: number; forecastedAmount: number; confidence: "high" | "medium" | "low" }[];
  isExpanded: boolean;
  onToggle: () => void;
  da: boolean;
  allCategories: { id: string; name: string; nameDA: string }[];
}) {
  return (
    <>
      <tr className="border-b cursor-pointer hover:bg-muted/50" onClick={onToggle}>
        <td className="py-2 pr-4">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
            <span className="font-medium">{da ? group.nameDA : group.name}</span>
          </div>
        </td>
        <td className="py-2 pr-4 text-right">
          {budgetAmount !== 0 ? `${Math.round(budgetAmount).toLocaleString("da-DK")} kr.` : "—"}
        </td>
        <td className="py-2 pr-4 text-right">
          {historicalAverage !== 0 ? `${Math.round(historicalAverage).toLocaleString("da-DK")} kr.` : "—"}
        </td>
        <td className="py-2 pr-4 text-right font-medium text-red-600">
          {Math.round(forecastedAmount).toLocaleString("da-DK")} kr.
        </td>
        <td className="py-2">
          <ConfidenceBadge confidence={confidence} da={da} />
        </td>
      </tr>
      {isExpanded &&
        childEntries
          .filter((e) => e.forecastedAmount !== 0)
          .sort((a, b) => a.forecastedAmount - b.forecastedAmount)
          .map((entry) => {
            const cat = allCategories.find((c) => c.id === entry.categoryId);
            const catName = cat ? (da ? cat.nameDA : cat.name) : entry.categoryId;
            return (
              <tr key={entry.categoryId} className="border-b last:border-0 bg-muted/30">
                <td className="py-1.5 pr-4 pl-8 text-muted-foreground">{catName}</td>
                <td className="py-1.5 pr-4 text-right text-muted-foreground">
                  {entry.budgetAmount !== 0 ? `${Math.round(entry.budgetAmount).toLocaleString("da-DK")} kr.` : "—"}
                </td>
                <td className="py-1.5 pr-4 text-right text-muted-foreground">
                  {entry.historicalAverage !== 0 ? `${Math.round(entry.historicalAverage).toLocaleString("da-DK")} kr.` : "—"}
                </td>
                <td className={`py-1.5 pr-4 text-right ${entry.forecastedAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {Math.round(entry.forecastedAmount).toLocaleString("da-DK")} kr.
                </td>
                <td className="py-1.5">
                  <ConfidenceBadge confidence={entry.confidence} da={da} />
                </td>
              </tr>
            );
          })}
    </>
  );
}

function ReadOnlyRow({
  item,
  entry,
  type,
  da,
  allCategories,
  onSave,
  onDelete,
  isGlobalEditing,
}: {
  item: BudgetVsActual;
  entry: BudgetEntry;
  type: "income" | "expense";
  da: boolean;
  allCategories: { id: string; color?: string }[];
  onSave: (categoryId: string, updates: Partial<BudgetEntry>) => void;
  onDelete: (categoryId: string) => void;
  isGlobalEditing: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftAmount, setDraftAmount] = useState(Math.abs(entry.monthlyAmount));
  const [draftFrequency, setDraftFrequency] = useState(entry.frequency);
  const [draftPaymentMonths, setDraftPaymentMonths] = useState(
    entry.paymentMonths || getDefaultPaymentMonths(entry.frequency)
  );
  const [draftNotes, setDraftNotes] = useState(entry.notes || "");

  const cat = allCategories.find((c) => c.id === item.categoryId);
  const isOver = item.percentUsed > 100;
  const isIncome = type === "income";
  const isExpense = type === "expense";
  const isNonMonthly = entry.frequency === "quarterly" || entry.frequency === "yearly";
  const isNoPaymentThisMonth = isNonMonthly && item.budgeted === 0;

  const startInlineEdit = () => {
    setDraftAmount(Math.abs(entry.monthlyAmount));
    setDraftFrequency(entry.frequency);
    setDraftPaymentMonths(entry.paymentMonths || getDefaultPaymentMonths(entry.frequency));
    setDraftNotes(entry.notes || "");
    setIsEditing(true);
  };

  const saveInlineEdit = () => {
    const showPM = draftFrequency === "quarterly" || draftFrequency === "yearly";
    onSave(entry.categoryId, {
      monthlyAmount: isExpense ? -Math.abs(draftAmount) : Math.abs(draftAmount),
      frequency: draftFrequency,
      paymentMonths: showPM ? draftPaymentMonths : undefined,
      notes: draftNotes || undefined,
    });
    setIsEditing(false);
  };

  const cancelInlineEdit = () => {
    setIsEditing(false);
  };

  const showDraftPaymentMonths = draftFrequency === "quarterly" || draftFrequency === "yearly";

  if (isEditing) {
    return (
      <div className="space-y-1 py-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium min-w-[120px] truncate">{item.categoryName}</span>
          <Input
            type="number"
            value={draftAmount || ""}
            onChange={(e) => setDraftAmount(Number(e.target.value))}
            placeholder={getAmountLabel(draftFrequency, da)}
            className="w-28"
          />
          <select
            value={draftFrequency}
            onChange={(e) => {
              const newFreq = e.target.value as BudgetFrequency;
              setDraftFrequency(newFreq);
              setDraftPaymentMonths(getDefaultPaymentMonths(newFreq));
            }}
            className="border rounded-md px-2 py-1.5 bg-background text-xs w-28"
          >
            <option value="monthly">{da ? "Månedlig" : "Monthly"}</option>
            <option value="quarterly">{da ? "Kvartalsvis" : "Quarterly"}</option>
            <option value="yearly">{da ? "Årlig" : "Yearly"}</option>
            <option value="irregular">{da ? "Uregelmæssig" : "Irregular"}</option>
          </select>
          {showDraftPaymentMonths && (
            <PaymentMonthSelector
              frequency={draftFrequency}
              selectedMonths={draftPaymentMonths}
              onChange={setDraftPaymentMonths}
              da={da}
            />
          )}
          <Input
            value={draftNotes}
            onChange={(e) => setDraftNotes(e.target.value)}
            placeholder={da ? "Noter" : "Notes"}
            className="w-32 text-xs"
          />
          <Button variant="ghost" size="icon" onClick={saveInlineEdit} className="shrink-0">
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={cancelInlineEdit} className="shrink-0">
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(entry.categoryId)} className="shrink-0">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  if (isNoPaymentThisMonth) {
    return (
      <div className="space-y-1 opacity-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {!isIncome && (
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: (cat as { color?: string })?.color }}
              />
            )}
            <span>{item.categoryName}</span>
            <Badge variant="outline" className="text-[10px] py-0">
              {getFrequencyLabel(entry.frequency, da)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {da ? "Ingen betaling denne måned" : "No payment this month"}
            </span>
            <span className="text-xs text-muted-foreground">
              ({da ? "gns." : "avg."} {Math.round(Math.abs(getMonthlyEquivalent(entry))).toLocaleString("da-DK")} kr./md.)
            </span>
            {!isGlobalEditing && (
              <Button variant="ghost" size="icon" onClick={startInlineEdit} className="h-6 w-6 shrink-0">
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {!isIncome && (
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: (cat as { color?: string })?.color }}
            />
          )}
          <span>{item.categoryName}</span>
          {isNonMonthly && (
            <Badge variant="outline" className="text-[10px] py-0">
              {getFrequencyLabel(entry.frequency, da)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isIncome ? "text-green-600" : isOver ? "text-red-600" : ""}`}>
            {Math.round(item.actual).toLocaleString("da-DK")}
          </span>
          <span className="text-muted-foreground">
            / {Math.round(item.budgeted).toLocaleString("da-DK")} kr.
          </span>
          <Badge
            variant={isOver && !isIncome ? "destructive" : item.percentUsed >= 100 && isIncome ? "default" : "outline"}
            className="text-xs"
          >
            {item.percentUsed.toFixed(0)}%
          </Badge>
          {!isGlobalEditing && (
            <Button variant="ghost" size="icon" onClick={startInlineEdit} className="h-6 w-6 shrink-0">
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
      <Progress
        value={Math.min(item.percentUsed, 100)}
        className={`h-2 ${isOver && !isIncome ? "[&>div]:bg-red-500" : ""}`}
      />
    </div>
  );
}

const QUARTER_PRESETS = [
  { label: "Jan/Apr/Jul/Okt", months: [1, 4, 7, 10] },
  { label: "Feb/Maj/Aug/Nov", months: [2, 5, 8, 11] },
  { label: "Mar/Jun/Sep/Dec", months: [3, 6, 9, 12] },
];

const MONTH_NAMES_DA = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function PaymentMonthSelector({
  frequency,
  selectedMonths,
  onChange,
  da,
}: {
  frequency: BudgetFrequency;
  selectedMonths: number[];
  onChange: (months: number[]) => void;
  da: boolean;
}) {
  const monthNames = da ? MONTH_NAMES_DA : MONTH_NAMES_EN;

  if (frequency === "quarterly") {
    const currentPresetIdx = QUARTER_PRESETS.findIndex(
      (p) => JSON.stringify(p.months) === JSON.stringify([...selectedMonths].sort((a, b) => a - b))
    );
    return (
      <select
        value={currentPresetIdx >= 0 ? currentPresetIdx : 0}
        onChange={(e) => onChange(QUARTER_PRESETS[Number(e.target.value)].months)}
        className="border rounded-md px-2 py-1.5 bg-background text-xs w-36"
      >
        {QUARTER_PRESETS.map((p, i) => (
          <option key={i} value={i}>{p.label}</option>
        ))}
      </select>
    );
  }

  if (frequency === "yearly") {
    return (
      <select
        value={selectedMonths[0] || 1}
        onChange={(e) => onChange([Number(e.target.value)])}
        className="border rounded-md px-2 py-1.5 bg-background text-xs w-28"
      >
        {monthNames.map((name, i) => (
          <option key={i} value={i + 1}>{name}</option>
        ))}
      </select>
    );
  }

  return null;
}

function getAmountLabel(frequency: BudgetFrequency, da: boolean): string {
  switch (frequency) {
    case "quarterly": return da ? "Kvartalsbeløb" : "Quarterly amount";
    case "yearly": return da ? "Årligt beløb" : "Yearly amount";
    default: return da ? "Beløb" : "Amount";
  }
}

function getFrequencyLabel(frequency: BudgetFrequency, da: boolean): string {
  switch (frequency) {
    case "quarterly": return da ? "Kvartalsvis" : "Quarterly";
    case "yearly": return da ? "Årlig" : "Yearly";
    case "irregular": return da ? "Uregelmæssig" : "Irregular";
    default: return da ? "Månedlig" : "Monthly";
  }
}

function EditableRow({
  entry,
  index,
  allCategories,
  usedCategoryIds,
  da,
  onUpdate,
  onRemove,
  isExpense,
}: {
  entry: BudgetEntry;
  index: number;
  allCategories: { id: string; name: string; nameDA: string }[];
  usedCategoryIds: Set<string>;
  da: boolean;
  onUpdate: (index: number, updates: Partial<BudgetEntry>) => void;
  onRemove: (index: number) => void;
  isExpense?: boolean;
}) {
  const availableCategories = allCategories.filter(
    (c) => c.id === entry.categoryId || !usedCategoryIds.has(c.id)
  );

  const showPaymentMonths = entry.frequency === "quarterly" || entry.frequency === "yearly";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <select
          value={entry.categoryId}
          onChange={(e) => onUpdate(index, { categoryId: e.target.value })}
          className="border rounded-md px-2 py-1.5 bg-background text-sm flex-1 min-w-[140px]"
        >
          <option value="">{da ? "Vælg kategori..." : "Select category..."}</option>
          {availableCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {da ? c.nameDA : c.name}
            </option>
          ))}
        </select>
        <Input
          type="number"
          value={Math.abs(entry.monthlyAmount) || ""}
          onChange={(e) => {
            const val = Number(e.target.value);
            onUpdate(index, { monthlyAmount: isExpense ? -Math.abs(val) : Math.abs(val) });
          }}
          placeholder={getAmountLabel(entry.frequency, da)}
          className="w-28"
        />
        <select
          value={entry.frequency}
          onChange={(e) => {
            const newFreq = e.target.value as BudgetFrequency;
            onUpdate(index, {
              frequency: newFreq,
              paymentMonths: getDefaultPaymentMonths(newFreq),
            });
          }}
          className="border rounded-md px-2 py-1.5 bg-background text-xs w-28"
        >
          <option value="monthly">{da ? "Månedlig" : "Monthly"}</option>
          <option value="quarterly">{da ? "Kvartalsvis" : "Quarterly"}</option>
          <option value="yearly">{da ? "Årlig" : "Yearly"}</option>
          <option value="irregular">{da ? "Uregelmæssig" : "Irregular"}</option>
        </select>
        {showPaymentMonths && (
          <PaymentMonthSelector
            frequency={entry.frequency}
            selectedMonths={entry.paymentMonths || getDefaultPaymentMonths(entry.frequency)}
            onChange={(months) => onUpdate(index, { paymentMonths: months })}
            da={da}
          />
        )}
        <Button variant="ghost" size="icon" onClick={() => onRemove(index)} className="shrink-0">
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
