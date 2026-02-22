"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ForecastChart } from "@/components/charts/forecast-chart";
import { ProjectionChart } from "@/components/charts/projection-chart";
import { calculateMonthlyForecast, getNextMonth, calculateMultiMonthProjection } from "@/lib/forecast";
import { BudgetEntry, BudgetVsActual } from "@/types";
import { Trash2, Plus } from "lucide-react";

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
    // Filter out entries with zero amount and no category
    const cleaned = draftEntries.filter((e) => e.categoryId && e.monthlyAmount !== 0);
    setConfig({ ...config, budgetEntries: cleaned });
    setEditing(false);
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

  const budgetComparison = useMemo((): BudgetVsActual[] => {
    return entries
      .filter((be) => be.monthlyAmount < 0)
      .map((be) => {
        const cat = allCategories.find((c) => c.id === be.categoryId);
        const actual = monthTransactions
          .filter((t) => t.categoryId === be.categoryId && !t.isIncome)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const budgeted = Math.abs(be.monthlyAmount);
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
  }, [entries, monthTransactions, da, allCategories]);

  const incomeComparison = useMemo(() => {
    return entries
      .filter((be) => be.monthlyAmount > 0)
      .map((be) => {
        const cat = allCategories.find((c) => c.id === be.categoryId);
        const actual = monthTransactions
          .filter((t) => t.categoryId === be.categoryId && t.isIncome)
          .reduce((sum, t) => sum + t.amount, 0);
        const budgeted = be.monthlyAmount;
        return {
          categoryId: be.categoryId,
          categoryName: cat ? (da ? cat.nameDA : cat.name) : be.categoryId,
          budgeted,
          actual,
          difference: actual - budgeted,
          percentUsed: budgeted > 0 ? (actual / budgeted) * 100 : 0,
        };
      });
  }, [entries, monthTransactions, da, allCategories]);

  const totalBudgeted = budgetComparison.reduce((s, b) => s + b.budgeted, 0);
  const totalActual = budgetComparison.reduce((s, b) => s + b.actual, 0);
  const overBudgetCount = budgetComparison.filter((b) => b.percentUsed > 100).length;

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

  // Categories available for new entries
  const usedCategoryIds = new Set(draftEntries.map((e) => e.categoryId));

  if (!config?.budgetEntries || (config.budgetEntries.length === 0 && !editing)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{da ? "Budget" : "Budget"}</h2>
          <Button onClick={startEditing}>{da ? "Opret budget" : "Create Budget"}</Button>
        </div>
        {editing ? (
          renderEditMode()
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {da
                  ? "Ingen budgetdata. Klik 'Opret budget' for at starte."
                  : "No budget data. Click 'Create Budget' to start."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderEditMode() {
    const incomeEntries = draftEntries
      .map((e, i) => ({ entry: e, index: i }))
      .filter(({ entry }) => entry.monthlyAmount >= 0 && (entry.categoryId === "" || allCategories.find((c) => c.id === entry.categoryId)?.type === "income" || entry.monthlyAmount > 0));
    const expenseEntries = draftEntries
      .map((e, i) => ({ entry: e, index: i }))
      .filter(({ entry }) => entry.monthlyAmount < 0 || (entry.categoryId !== "" && allCategories.find((c) => c.id === entry.categoryId)?.type === "expense"));

    // Simplify: split by sign or if new entry with no amount
    const incomeIdxs = draftEntries
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => e.monthlyAmount > 0 || (e.monthlyAmount === 0 && e.categoryId === "" && incomeEntries.length <= expenseEntries.length));

    return null; // This is handled inline below
  }

  const incomeIndices = draftEntries
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.monthlyAmount > 0);
  const expenseIndices = draftEntries
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.monthlyAmount < 0);
  // New entries (amount = 0, no category yet)
  const newEntryIndices = draftEntries
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.monthlyAmount === 0 && e.categoryId === "");

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
                    {overBudgetCount} {da ? "kategorier" : "categories"}
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
                : incomeComparison.map((b) => (
                    <ReadOnlyRow key={b.categoryId} item={b} type="income" da={da} allCategories={allCategories} />
                  ))}
            </CardContent>
          </Card>

          {/* Expense section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{da ? "Udgifter" : "Expenses"}</CardTitle>
                {editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addDraftEntry("expense")}
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
                    if (entry.monthlyAmount > 0) return null;
                    if (entry.categoryId === "" && entry.monthlyAmount === 0) {
                      // New entry — could be income or expense, show in expense if not already shown in income
                      // We handle this by checking if income section already rendered it
                    }
                    if (entry.categoryId !== "" && entry.monthlyAmount === 0) {
                      const cat = allCategories.find((c) => c.id === entry.categoryId);
                      if (cat?.type === "income") return null;
                    }
                    return (
                      <EditableRow
                        key={i}
                        entry={entry}
                        index={i}
                        allCategories={allCategories.filter((c) => c.type === "expense")}
                        usedCategoryIds={usedCategoryIds}
                        da={da}
                        onUpdate={updateDraftEntry}
                        onRemove={removeDraftEntry}
                        isExpense
                      />
                    );
                  })
                : budgetComparison.map((b) => (
                    <ReadOnlyRow key={b.categoryId} item={b} type="expense" da={da} allCategories={allCategories} />
                  ))}
            </CardContent>
          </Card>
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

          {/* Forecast detail table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {da ? "Prognose pr. kategori" : "Forecast by Category"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-4">{da ? "Kategori" : "Category"}</th>
                      <th className="py-2 pr-4 text-right">{da ? "Budget" : "Budget"}</th>
                      <th className="py-2 pr-4 text-right">{da ? "Historisk gns." : "Hist. avg."}</th>
                      <th className="py-2 pr-4 text-right">{da ? "Prognose" : "Forecast"}</th>
                      <th className="py-2">{da ? "Tillid" : "Confidence"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.byCategory
                      .filter((e) => e.forecastedAmount !== 0)
                      .sort((a, b) => a.forecastedAmount - b.forecastedAmount)
                      .map((entry) => {
                        const cat = allCategories.find((c) => c.id === entry.categoryId);
                        const catName = cat ? (da ? cat.nameDA : cat.name) : entry.categoryId;
                        return (
                          <tr key={entry.categoryId} className="border-b last:border-0">
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
                            <td
                              className={`py-2 pr-4 text-right font-medium ${
                                entry.forecastedAmount >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {Math.round(entry.forecastedAmount).toLocaleString("da-DK")} kr.
                            </td>
                            <td className="py-2">
                              <Badge
                                variant="outline"
                                className={
                                  entry.confidence === "high"
                                    ? "border-green-500 text-green-600"
                                    : entry.confidence === "medium"
                                    ? "border-yellow-500 text-yellow-600"
                                    : "border-red-500 text-red-600"
                                }
                              >
                                {entry.confidence === "high"
                                  ? (da ? "Høj" : "High")
                                  : entry.confidence === "medium"
                                  ? (da ? "Middel" : "Medium")
                                  : (da ? "Lav" : "Low")}
                              </Badge>
                            </td>
                          </tr>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

// === SUB-COMPONENTS ===

function ReadOnlyRow({
  item,
  type,
  da,
  allCategories,
}: {
  item: BudgetVsActual;
  type: "income" | "expense";
  da: boolean;
  allCategories: { id: string; color?: string }[];
}) {
  const cat = allCategories.find((c) => c.id === item.categoryId);
  const isOver = item.percentUsed > 100;
  const isIncome = type === "income";

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
        </div>
      </div>
      <Progress
        value={Math.min(item.percentUsed, 100)}
        className={`h-2 ${isOver && !isIncome ? "[&>div]:bg-red-500" : ""}`}
      />
    </div>
  );
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

  return (
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
        placeholder={da ? "Beløb" : "Amount"}
        className="w-28"
      />
      <select
        value={entry.frequency}
        onChange={(e) => onUpdate(index, { frequency: e.target.value as BudgetEntry["frequency"] })}
        className="border rounded-md px-2 py-1.5 bg-background text-xs w-28"
      >
        <option value="monthly">{da ? "Månedlig" : "Monthly"}</option>
        <option value="quarterly">{da ? "Kvartalsvis" : "Quarterly"}</option>
        <option value="yearly">{da ? "Årlig" : "Yearly"}</option>
        <option value="irregular">{da ? "Uregelmæssig" : "Irregular"}</option>
      </select>
      <Button variant="ghost" size="icon" onClick={() => onRemove(index)} className="shrink-0">
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}
