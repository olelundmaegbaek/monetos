"use client";

import { useState, useCallback } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { parseCSV } from "@/lib/csv/parser";
import { categorizeTransactions } from "@/lib/csv/categorizer";
import { getCategoryById } from "@/config/categories";
import { loadOpenAIKey } from "@/lib/store";
import { detectRecurringPatterns, RecurringPattern } from "@/lib/recurring-detection";
import { getMonthlyEquivalent } from "@/lib/forecast";
import { MAX_CSV_FILE_SIZE } from "@/lib/constants";
import { Sparkles, TrendingUp, Check, X, CalendarClock, Loader2 } from "lucide-react";

export default function ImportPage() {
  const {
    config,
    setConfig,
    transactions,
    addTransactions,
    locale,
    allCategories,
    importState,
    setImportParsed,
    setImportImported,
    resetImport,
    startAiCategorization,
  } = useApp();
  const da = locale === "da";

  // Derive from provider state
  const { parsed, imported, isAiCategorizing, aiError } = importState;

  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recurring pattern detection (local — only relevant post-import on this page)
  const [patterns, setPatterns] = useState<RecurringPattern[]>([]);
  const [acceptedPatterns, setAcceptedPatterns] = useState<Set<string>>(new Set());
  const [dismissedPatterns, setDismissedPatterns] = useState<Set<string>>(new Set());

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      setImportImported(false);

      if (!file.name.endsWith(".csv")) {
        setError(da ? "Filen skal være en CSV-fil." : "File must be a CSV file.");
        return;
      }

      if (file.size > MAX_CSV_FILE_SIZE) {
        setError(
          da
            ? `Filen er for stor (max ${Math.round(MAX_CSV_FILE_SIZE / 1024 / 1024)} MB).`
            : `File is too large (max ${Math.round(MAX_CSV_FILE_SIZE / 1024 / 1024)} MB).`
        );
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => {
        setError(da ? "Kunne ikke læse filen. Tjek at den er en gyldig tekstfil." : "Could not read file. Check that it is a valid text file.");
      };
      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          if (typeof text !== "string" || text.trim().length === 0) {
            setError(da ? "Filen er tom." : "File is empty.");
            return;
          }
          let txns = parseCSV(text);

          if (txns.length === 0) {
            setError(da ? "Ingen transaktioner fundet i filen." : "No transactions found in file.");
            return;
          }

          // Auto-categorize if we have rules
          if (config?.categorizationRules?.length) {
            txns = categorizeTransactions(txns, config.categorizationRules);
          }

          setImportParsed(txns);

          // Proactively run AI categorization on uncategorized transactions
          const uncategorized = txns.filter(
            (t) => t.categoryId === "uncategorized" || t.categoryId === "other_income"
          );
          if (uncategorized.length > 0 && loadOpenAIKey()) {
            const alreadyCategorized = txns.filter(
              (t) => t.categoryId !== "uncategorized" && t.categoryId !== "other_income"
            );
            startAiCategorization(uncategorized, alreadyCategorized);
          }
        } catch {
          setError(da ? "Kunne ikke parse CSV-filen." : "Failed to parse CSV file.");
        }
      };
      reader.readAsText(file, "utf-8");
    },
    [config, da, setImportParsed, setImportImported, startAiCategorization]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const doImport = () => {
    addTransactions(parsed);
    setImportImported(true);

    // Run recurring pattern detection on ALL transactions (existing + new)
    const allTxns = [...transactions, ...parsed];
    const detected = detectRecurringPatterns(
      allTxns,
      config?.budgetEntries || []
    );
    setPatterns(detected);
    setAcceptedPatterns(new Set());
    setDismissedPatterns(new Set());
  };

  const acceptPattern = (key: string) => {
    setAcceptedPatterns((prev) => new Set(prev).add(key));
    setDismissedPatterns((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const dismissPattern = (key: string) => {
    setDismissedPatterns((prev) => new Set(prev).add(key));
    setAcceptedPatterns((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const applyAcceptedPatterns = () => {
    if (!config) return;
    const toAdd = patterns
      .filter((p) => acceptedPatterns.has(p.key))
      .map((p) => p.suggestedEntry);

    if (toAdd.length === 0) return;

    const existingIds = new Set(config.budgetEntries.map((be) => be.categoryId));
    const newEntries = toAdd.filter((e) => !existingIds.has(e.categoryId));

    setConfig({
      ...config,
      budgetEntries: [...config.budgetEntries, ...newEntries],
    });
    setPatterns([]);
  };

  const visiblePatterns = patterns.filter(
    (p) => !dismissedPatterns.has(p.key)
  );

  // Summary by category
  const categorySummary = parsed.reduce<Record<string, { count: number; total: number }>>((acc, t) => {
    if (!acc[t.categoryId]) acc[t.categoryId] = { count: 0, total: 0 };
    acc[t.categoryId].count++;
    acc[t.categoryId].total += t.amount;
    return acc;
  }, {});

  const incomeCount = parsed.filter((t) => t.isIncome).length;
  const expenseCount = parsed.filter((t) => !t.isIncome).length;
  const uncategorizedCount = parsed.filter(
    (t) => t.categoryId === "uncategorized" || t.categoryId === "other_income"
  ).length;

  const handleAICategorize = () => {
    const uncategorized = parsed.filter(
      (t) => t.categoryId === "uncategorized" || t.categoryId === "other_income"
    );
    if (uncategorized.length === 0) return;

    const alreadyCategorized = parsed.filter(
      (t) => t.categoryId !== "uncategorized" && t.categoryId !== "other_income"
    );
    startAiCategorization(uncategorized, alreadyCategorized);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{da ? "Importér transaktioner" : "Import Transactions"}</h2>

      {/* Drop zone */}
      <Card>
        <CardContent className="pt-6">
          <div
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
          >
            <p className="text-lg font-medium mb-2">
              {da ? "Træk CSV-fil hertil" : "Drop CSV file here"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {da ? "Nordea CSV-format (semikolon-adskilt)" : "Nordea CSV format (semicolon-delimited)"}
            </p>
            <label className="inline-block">
              <span className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium cursor-pointer hover:bg-primary/90">
                {da ? "Vælg fil" : "Choose file"}
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={onFileInput}
                className="hidden"
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 text-sm text-negative">{error}</p>
          )}

          {/* Show spinner when AI is running during initial file load */}
          {isAiCategorizing && parsed.length === 0 && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-info/10 rounded-lg border border-info/30">
              <Loader2 className="h-5 w-5 text-info animate-spin" />
              <div>
                <p className="text-sm font-medium text-info">
                  {da ? "AI kategoriserer transaktioner..." : "AI categorizing transactions..."}
                </p>
                <p className="text-xs text-info/80">
                  {da
                    ? "Sender transaktioner til OpenAI — dette kan tage op til 1 minut"
                    : "Sending transactions to OpenAI — this may take up to 1 minute"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {parsed.length > 0 && !imported && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {da ? "Forhåndsvisning" : "Preview"} — {parsed.length}{" "}
                {da ? "transaktioner" : "transactions"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">{da ? "Total" : "Total"}</p>
                  <p className="font-bold">{parsed.length}</p>
                </div>
                <div className="p-3 bg-positive/10 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">{da ? "Indkomst" : "Income"}</p>
                  <p className="font-bold text-positive">{incomeCount}</p>
                </div>
                <div className="p-3 bg-negative/10 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">{da ? "Udgifter" : "Expenses"}</p>
                  <p className="font-bold text-negative">{expenseCount}</p>
                </div>
              </div>

              <Separator />

              {/* Category breakdown */}
              <h4 className="font-medium text-sm">{da ? "Kategorisering" : "Categorization"}</h4>
              <div className="space-y-1 text-sm max-h-60 overflow-y-auto">
                {Object.entries(categorySummary)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([catId, { count, total }]) => {
                    const cat = getCategoryById(catId);
                    return (
                      <div key={catId} className="flex justify-between items-center py-1">
                        <span>
                          {cat ? (da ? cat.nameDA : cat.name) : catId}{" "}
                          <span className="text-muted-foreground">({count})</span>
                        </span>
                        <span className={total >= 0 ? "text-positive" : "text-negative"}>
                          {total.toLocaleString("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* AI Categorization */}
              {uncategorizedCount > 0 && (
                <>
                  <Separator />
                  {isAiCategorizing ? (
                    <div className="flex items-center gap-3 p-3 bg-info/10 rounded-lg border border-info/30">
                      <Loader2 className="h-5 w-5 text-info animate-spin" />
                      <div>
                        <p className="text-sm font-medium text-info">
                          {da ? "AI kategoriserer transaktioner..." : "AI categorizing transactions..."}
                        </p>
                        <p className="text-xs text-info/80">
                          {da
                            ? `Sender ${uncategorizedCount} transaktioner til OpenAI — dette kan tage op til 1 minut`
                            : `Sending ${uncategorizedCount} transactions to OpenAI — this may take up to 1 minute`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={handleAICategorize}
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        {da
                          ? `AI-kategoriser ${uncategorizedCount} ukendte`
                          : `AI-categorize ${uncategorizedCount} unknown`}
                      </Button>
                      {aiError && (
                        <p className="text-xs text-negative">{aiError}</p>
                      )}
                    </div>
                  )}
                </>
              )}

              <Separator />

              {/* Sample transactions */}
              <h4 className="font-medium text-sm">
                {da ? "Eksempler (første 10)" : "Sample (first 10)"}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-1 pr-4">{da ? "Dato" : "Date"}</th>
                      <th className="py-1 pr-4">{da ? "Beskrivelse" : "Description"}</th>
                      <th className="py-1 pr-4 text-right">{da ? "Beløb" : "Amount"}</th>
                      <th className="py-1">{da ? "Kategori" : "Category"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.slice(0, 10).map((t) => {
                      const cat = getCategoryById(t.categoryId);
                      return (
                        <tr key={t.id} className="border-b border-muted">
                          <td className="py-1 pr-4 whitespace-nowrap">{t.date}</td>
                          <td className="py-1 pr-4 truncate max-w-[200px]">{t.name}</td>
                          <td
                            className={`py-1 pr-4 text-right whitespace-nowrap ${
                              t.isIncome ? "text-positive" : "text-negative"
                            }`}
                          >
                            {t.amount.toLocaleString("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 })}
                          </td>
                          <td className="py-1 text-xs">
                            {cat ? (da ? cat.nameDA : cat.name) : t.categoryId}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Button onClick={doImport} className="w-full mt-4">
                {da
                  ? `Importér ${parsed.length} transaktioner`
                  : `Import ${parsed.length} transactions`}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Success */}
      {imported && (
        <>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-3">&#10003;</div>
              <p className="text-lg font-medium text-positive">
                {da
                  ? `${parsed.length} transaktioner importeret!`
                  : `${parsed.length} transactions imported!`}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {da
                  ? "Du kan se dem under Transaktioner."
                  : "You can view them under Transactions."}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  resetImport();
                  setPatterns([]);
                }}
              >
                {da ? "Importér flere" : "Import more"}
              </Button>
            </CardContent>
          </Card>

          {/* Recurring Pattern Detection */}
          {visiblePatterns.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">
                    {da
                      ? `${visiblePatterns.length} tilbagevendende betalinger fundet`
                      : `${visiblePatterns.length} recurring payments detected`}
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  {da
                    ? "Vi har analyseret dine transaktioner og fundet faste betalinger. Acceptér dem for at oprette budgetposter automatisk."
                    : "We analyzed your transactions and found recurring payments. Accept them to create budget entries automatically."}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {visiblePatterns.map((pattern) => {
                  const cat = getCategoryById(pattern.categoryId);
                  const isAccepted = acceptedPatterns.has(pattern.key);
                  const freqLabel =
                    pattern.frequency === "monthly"
                      ? (da ? "Månedlig" : "Monthly")
                      : pattern.frequency === "quarterly"
                      ? (da ? "Kvartalsvis" : "Quarterly")
                      : pattern.frequency === "yearly"
                      ? (da ? "Årlig" : "Yearly")
                      : (da ? "Uregelmæssig" : "Irregular");

                  const monthlyEquiv = getMonthlyEquivalent(pattern.suggestedEntry);

                  return (
                    <div
                      key={pattern.key}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isAccepted
                          ? "bg-positive/10 border-positive/30"
                          : "bg-muted/50"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {pattern.displayName}
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0 shrink-0">
                            {freqLabel}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 shrink-0 ${
                              pattern.confidence === "high"
                                ? "border-positive text-positive"
                                : pattern.confidence === "medium"
                                ? "border-warning text-warning"
                                : "border-negative text-negative"
                            }`}
                          >
                            {pattern.confidence === "high"
                              ? (da ? "Sikker" : "Confident")
                              : pattern.confidence === "medium"
                              ? (da ? "Sandsynlig" : "Likely")
                              : (da ? "Mulig" : "Possible")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>
                            {cat ? (da ? cat.nameDA : cat.name) : pattern.categoryId}
                          </span>
                          <span>
                            {pattern.occurrences}x {da ? "forekomster" : "occurrences"}
                          </span>
                          <span
                            className={
                              pattern.averageAmount >= 0
                                ? "text-positive"
                                : "text-negative"
                            }
                          >
                            {pattern.averageAmount.toLocaleString("da-DK")} kr.
                            {pattern.frequency !== "monthly" && (
                              <span className="text-muted-foreground">
                                {" "}({da ? "gns." : "avg."} {Math.round(Math.abs(monthlyEquiv)).toLocaleString("da-DK")} kr./md.)
                              </span>
                            )}
                          </span>
                          {pattern.suggestedEntry.paymentMonths && (
                            <span>
                              {da ? "mdr:" : "months:"}{" "}
                              {pattern.suggestedEntry.paymentMonths
                                .map((m) =>
                                  ["Jan","Feb","Mar","Apr","Maj","Jun","Jul","Aug","Sep","Okt","Nov","Dec"][m - 1]
                                )
                                .join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button
                          variant={isAccepted ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => acceptPattern(pattern.key)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => dismissPattern(pattern.key)}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {acceptedPatterns.size > 0 && (
                  <>
                    <Separator />
                    <Button onClick={applyAcceptedPatterns} className="w-full gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {da
                        ? `Opret ${acceptedPatterns.size} budgetpost${acceptedPatterns.size > 1 ? "er" : ""}`
                        : `Create ${acceptedPatterns.size} budget entr${acceptedPatterns.size > 1 ? "ies" : "y"}`}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
