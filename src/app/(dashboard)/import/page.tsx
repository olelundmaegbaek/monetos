"use client";

import { useState, useCallback } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { parseCSV } from "@/lib/csv/parser";
import { categorizeTransactions } from "@/lib/csv/categorizer";
import { getCategoryById } from "@/config/categories";
import { aiCategorizeTransactions } from "@/lib/csv/ai-categorizer";
import { loadOpenAIKey } from "@/lib/store";
import { Transaction } from "@/types";
import { Sparkles } from "lucide-react";

export default function ImportPage() {
  const { config, addTransactions, locale, allCategories } = useApp();
  const da = locale === "da";

  const [dragOver, setDragOver] = useState(false);
  const [parsed, setParsed] = useState<Transaction[]>([]);
  const [imported, setImported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      setImported(false);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          let transactions = parseCSV(text);

          if (transactions.length === 0) {
            setError(da ? "Ingen transaktioner fundet i filen." : "No transactions found in file.");
            return;
          }

          // Auto-categorize if we have rules
          if (config?.categorizationRules?.length) {
            transactions = categorizeTransactions(transactions, config.categorizationRules);
          }

          setParsed(transactions);
        } catch {
          setError(da ? "Kunne ikke parse CSV-filen." : "Failed to parse CSV file.");
        }
      };
      reader.readAsText(file, "utf-8");
    },
    [config, da]
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
    setImported(true);
  };

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

  const handleAICategorize = async () => {
    const uncategorized = parsed.filter(
      (t) => t.categoryId === "uncategorized" || t.categoryId === "other_income"
    );
    if (uncategorized.length === 0) return;

    setIsAiCategorizing(true);
    setAiError(null);
    const apiKey = loadOpenAIKey();

    try {
      const alreadyCategorized = parsed.filter(
        (t) => t.categoryId !== "uncategorized" && t.categoryId !== "other_income"
      );
      const result = await aiCategorizeTransactions(
        uncategorized,
        allCategories,
        apiKey || undefined
      );
      setParsed([...alreadyCategorized, ...result.transactions]);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI categorization failed");
    } finally {
      setIsAiCategorizing(false);
    }
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
            <p className="mt-4 text-sm text-red-600">{error}</p>
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
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">{da ? "Indkomst" : "Income"}</p>
                  <p className="font-bold text-green-600">{incomeCount}</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">{da ? "Udgifter" : "Expenses"}</p>
                  <p className="font-bold text-red-600">{expenseCount}</p>
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
                        <span className={total >= 0 ? "text-green-600" : "text-red-600"}>
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
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={handleAICategorize}
                      disabled={isAiCategorizing}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {isAiCategorizing
                        ? (da ? "Kategoriserer..." : "Categorizing...")
                        : da
                          ? `AI-kategoriser ${uncategorizedCount} ukendte`
                          : `AI-categorize ${uncategorizedCount} unknown`}
                    </Button>
                    {aiError && (
                      <p className="text-xs text-red-600">{aiError}</p>
                    )}
                  </div>
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
                              t.isIncome ? "text-green-600" : "text-red-600"
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
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-3">&#10003;</div>
            <p className="text-lg font-medium text-green-600">
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
                setParsed([]);
                setImported(false);
              }}
            >
              {da ? "Importér flere" : "Import more"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
