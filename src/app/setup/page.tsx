"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers/app-provider";
import { defaultCategories } from "@/config/categories";
import { parseCSV } from "@/lib/csv/parser";
import { aiCategorizeTransactions, AICategorizeStats } from "@/lib/csv/ai-categorizer";
import { loadOpenAIKey } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { HouseholdConfig, HouseholdMember, Child, Transaction } from "@/types";
import { v4 as uuid } from "uuid";

const STEPS = [
  { title: "Husstand", titleEN: "Household" },
  { title: "Voksne", titleEN: "Adults" },
  { title: "Børn", titleEN: "Children" },
  { title: "Importer CSV", titleEN: "Import CSV" },
  { title: "Opsummering", titleEN: "Summary" },
];

export default function SetupPage() {
  const router = useRouter();
  const { setConfig, addTransactions, completeSetup, locale } = useApp();

  const [step, setStep] = useState(0);
  const [householdName, setHouseholdName] = useState("");
  const [numAdults, setNumAdults] = useState(2);
  const [numChildren, setNumChildren] = useState(0);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [parsedTransactions, setParsedTransactions] = useState<Transaction[]>([]);
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);
  const [aiStats, setAiStats] = useState<AICategorizeStats | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const da = locale === "da";

  // Initialize members when numAdults changes
  const initMembers = useCallback(() => {
    const m: HouseholdMember[] = [];
    for (let i = 0; i < numAdults; i++) {
      m.push({
        name: "",
        role: i === 0 ? "primary" : "secondary",
        employer: null,
        selfEmployed: false,
        monthlyNetSalary: 0,
        selfEmploymentMonthlyIncome: 0,
        kommune: "Aarhus",
      });
    }
    setMembers(m);
  }, [numAdults]);

  const initChildren = useCallback(() => {
    const c: Child[] = [];
    for (let i = 0; i < numChildren; i++) {
      c.push({
        name: "",
        birthYear: 2015,
        schoolType: "public",
        monthlyEducationCost: 0,
        monthlyAllowance: 0,
        hasBoerneopsparing: false,
        boerneopsparingAnnual: 0,
        activities: [],
      });
    }
    setChildren(c);
  }, [numChildren]);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const transactions = parseCSV(text);
      setParsedTransactions(transactions);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleAICategorize = async () => {
    if (parsedTransactions.length === 0) return;

    setIsAiCategorizing(true);
    setAiError(null);
    const apiKey = loadOpenAIKey();

    try {
      const uncategorized = parsedTransactions.filter(
        (t) => t.categoryId === "uncategorized" || t.categoryId === "other_income"
      );
      const alreadyCategorized = parsedTransactions.filter(
        (t) => t.categoryId !== "uncategorized" && t.categoryId !== "other_income"
      );

      if (uncategorized.length > 0) {
        const result = await aiCategorizeTransactions(
          uncategorized,
          defaultCategories,
          apiKey || undefined
        );
        setParsedTransactions([...alreadyCategorized, ...result.transactions]);
        setAiStats(result.stats);
      } else {
        setAiStats({ totalTransactions: parsedTransactions.length, uniquePatterns: 0, categorized: 0, tokensUsed: 0 });
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI categorization failed");
    } finally {
      setIsAiCategorizing(false);
    }
  };

  const finishSetup = () => {
    const config: HouseholdConfig = {
      id: uuid(),
      name: householdName || "min-husstand",
      displayName: householdName || "Min Husstand",
      locale: "da",
      currency: "DKK",
      members,
      children,
      budgetEntries: [],
      categorizationRules: [],
    };

    setConfig(config);

    if (parsedTransactions.length > 0) {
      addTransactions(parsedTransactions);
    }

    completeSetup();
    router.push("/");
  };

  const updateMember = (idx: number, updates: Partial<HouseholdMember>) => {
    const updated = [...members];
    updated[idx] = { ...updated[idx], ...updates };
    setMembers(updated);
  };

  const updateChild = (idx: number, updates: Partial<Child>) => {
    const updated = [...children];
    updated[idx] = { ...updated[idx], ...updates };
    setChildren(updated);
  };

  // Count categorized transactions
  const categorizedCount = parsedTransactions.filter(
    (t) => t.categoryId !== "uncategorized" && t.categoryId !== "other_income"
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">PrivatFinance</h1>
          <p className="text-muted-foreground mt-2">
            {da ? "Opsæt din privatøkonomi" : "Set up your personal finances"}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Household basics */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{da ? "Husstand" : "Household"}</CardTitle>
              <CardDescription>
                {da ? "Grundlæggende oplysninger om din husstand" : "Basic household information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name">{da ? "Husstandens navn" : "Household name"}</Label>
                <Input
                  id="name"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder={da ? "F.eks. 'Hansen familien'" : "E.g. 'The Hansen family'"}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>{da ? "Antal voksne" : "Number of adults"}</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2].map((n) => (
                    <Button
                      key={n}
                      variant={numAdults === n ? "default" : "outline"}
                      onClick={() => setNumAdults(n)}
                      className="w-16"
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>{da ? "Antal børn" : "Number of children"}</Label>
                <div className="flex gap-2 mt-2">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <Button
                      key={n}
                      variant={numChildren === n ? "default" : "outline"}
                      onClick={() => setNumChildren(n)}
                      className="w-16"
                    >
                      {n === 4 ? "4+" : n}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Adults */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{da ? "Voksne" : "Adults"}</CardTitle>
              <CardDescription>
                {da ? "Oplysninger om voksne i husstanden" : "Information about adults in the household"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {members.map((member, idx) => (
                <div key={idx} className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold">
                    {da ? `Voksen ${idx + 1}` : `Adult ${idx + 1}`}
                    {member.name && ` - ${member.name}`}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{da ? "Navn" : "Name"}</Label>
                      <Input
                        value={member.name}
                        onChange={(e) => updateMember(idx, { name: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>{da ? "Arbejdsgiver" : "Employer"}</Label>
                      <Input
                        value={member.employer || ""}
                        onChange={(e) => updateMember(idx, { employer: e.target.value || null })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{da ? "Månedlig nettoløn (DKK)" : "Monthly net salary (DKK)"}</Label>
                      <Input
                        type="number"
                        value={member.monthlyNetSalary || ""}
                        onChange={(e) => updateMember(idx, { monthlyNetSalary: Number(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>{da ? "Kommune" : "Municipality"}</Label>
                      <Input
                        value={member.kommune}
                        onChange={(e) => updateMember(idx, { kommune: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.selfEmployed}
                        onChange={(e) => updateMember(idx, { selfEmployed: e.target.checked })}
                        className="rounded"
                      />
                      {da ? "Selvstændig" : "Self-employed"}
                    </Label>
                  </div>

                  {member.selfEmployed && (
                    <div>
                      <Label>{da ? "Selvstændig månedlig indkomst (DKK)" : "Self-employment monthly income (DKK)"}</Label>
                      <Input
                        type="number"
                        value={member.selfEmploymentMonthlyIncome || ""}
                        onChange={(e) => updateMember(idx, { selfEmploymentMonthlyIncome: Number(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Children */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{da ? "Børn" : "Children"}</CardTitle>
              <CardDescription>
                {numChildren === 0
                  ? (da ? "Ingen børn i husstanden" : "No children in the household")
                  : (da ? "Oplysninger om børn" : "Children information")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {children.map((child, idx) => (
                <div key={idx} className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold">
                    {da ? `Barn ${idx + 1}` : `Child ${idx + 1}`}
                    {child.name && ` - ${child.name}`}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{da ? "Navn" : "Name"}</Label>
                      <Input
                        value={child.name}
                        onChange={(e) => updateChild(idx, { name: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>{da ? "Fødselsår" : "Birth year"}</Label>
                      <Input
                        type="number"
                        value={child.birthYear}
                        onChange={(e) => updateChild(idx, { birthYear: Number(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{da ? "Skoletype" : "School type"}</Label>
                      <select
                        value={child.schoolType}
                        onChange={(e) => updateChild(idx, { schoolType: e.target.value as Child["schoolType"] })}
                        className="mt-1 w-full border rounded-md px-3 py-2 bg-background text-sm"
                      >
                        <option value="public">{da ? "Folkeskole" : "Public school"}</option>
                        <option value="private">{da ? "Privatskole" : "Private school"}</option>
                        <option value="daycare">{da ? "Dagpleje/vuggestue" : "Daycare"}</option>
                        <option value="sfo">{da ? "SFO" : "After-school care"}</option>
                      </select>
                    </div>
                    <div>
                      <Label>{da ? "Månedlig uddannelsesudgift" : "Monthly education cost"}</Label>
                      <Input
                        type="number"
                        value={child.monthlyEducationCost || ""}
                        onChange={(e) => updateChild(idx, { monthlyEducationCost: Number(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{da ? "Månedlige lommepenge" : "Monthly allowance"}</Label>
                      <Input
                        type="number"
                        value={child.monthlyAllowance || ""}
                        onChange={(e) => updateChild(idx, { monthlyAllowance: Number(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-end gap-4">
                      <Label className="flex items-center gap-2 cursor-pointer pb-2">
                        <input
                          type="checkbox"
                          checked={child.hasBoerneopsparing}
                          onChange={(e) => updateChild(idx, { hasBoerneopsparing: e.target.checked })}
                          className="rounded"
                        />
                        {da ? "Børneopsparing" : "Children savings"}
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
              {numChildren === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  {da ? "Spring dette trin over" : "Skip this step"}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: CSV Import */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>{da ? "Importer kontoudtog" : "Import bank statement"}</CardTitle>
              <CardDescription>
                {da
                  ? "Upload din banks CSV-fil for at importere transaktioner (valgfrit)"
                  : "Upload your bank's CSV file to import transactions (optional)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <Label
                  htmlFor="csv-upload"
                  className="cursor-pointer text-primary hover:underline text-lg"
                >
                  {da ? "Vælg CSV-fil" : "Choose CSV file"}
                </Label>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {da ? "Understøtter Nordea CSV-format" : "Supports Nordea CSV format"}
                </p>
              </div>

              {parsedTransactions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-base px-4 py-1">
                      {parsedTransactions.length} {da ? "transaktioner" : "transactions"}
                    </Badge>
                    <Badge variant="outline" className="text-base px-4 py-1">
                      {categorizedCount} {da ? "kategoriseret" : "categorized"}
                    </Badge>
                  </div>

                  {/* AI Categorization */}
                  <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      {da ? "AI-kategorisering (OpenAI)" : "AI Categorization (OpenAI)"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {da
                        ? "Brug OpenAI til at kategorisere ukendte transaktioner automatisk. Kræver API-nøgle (kan tilføjes i Indstillinger)."
                        : "Use OpenAI to automatically categorize unknown transactions. Requires API key (can be added in Settings)."}
                    </p>
                    <Button
                      onClick={handleAICategorize}
                      disabled={isAiCategorizing}
                      variant="outline"
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {isAiCategorizing
                        ? (da ? "Kategoriserer..." : "Categorizing...")
                        : da
                          ? `AI-kategoriser ${parsedTransactions.length - categorizedCount} ukendte`
                          : `AI-categorize ${parsedTransactions.length - categorizedCount} unknown`}
                    </Button>
                    {aiStats && (
                      <p className="text-xs text-muted-foreground">
                        {da
                          ? `${aiStats.categorized} af ${aiStats.uniquePatterns} mønstre kategoriseret (${aiStats.tokensUsed} tokens)`
                          : `${aiStats.categorized} of ${aiStats.uniquePatterns} patterns categorized (${aiStats.tokensUsed} tokens)`}
                      </p>
                    )}
                    {aiError && (
                      <p className="text-xs text-red-600">{aiError}</p>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="max-h-64 overflow-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2">{da ? "Dato" : "Date"}</th>
                          <th className="text-left px-3 py-2">{da ? "Beskrivelse" : "Description"}</th>
                          <th className="text-right px-3 py-2">{da ? "Beløb" : "Amount"}</th>
                          <th className="text-left px-3 py-2">{da ? "Kategori" : "Category"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedTransactions.slice(0, 20).map((t) => {
                          const cat = defaultCategories.find((c) => c.id === t.categoryId);
                          return (
                            <tr key={t.id} className="border-t">
                              <td className="px-3 py-1.5">{t.date}</td>
                              <td className="px-3 py-1.5 max-w-[200px] truncate">{t.description}</td>
                              <td className={`px-3 py-1.5 text-right ${t.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {t.amount.toLocaleString("da-DK", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-1.5">
                                <Badge variant="outline" className="text-xs">
                                  {cat ? (locale === "da" ? cat.nameDA : cat.name) : t.categoryId}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Summary */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>{da ? "Opsummering" : "Summary"}</CardTitle>
              <CardDescription>
                {da ? "Gennemgå din opsætning" : "Review your setup"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{da ? "Husstand" : "Household"}</p>
                <p className="text-lg font-semibold">{householdName || "Min Husstand"}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">{da ? "Voksne" : "Adults"} ({members.length})</h3>
                {members.map((m, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span>{m.name || `Voksen ${i + 1}`}</span>
                    <span className="text-sm text-muted-foreground">
                      {m.monthlyNetSalary.toLocaleString("da-DK")} kr./md
                      {m.selfEmployed && ` + ${m.selfEmploymentMonthlyIncome.toLocaleString("da-DK")} kr. selvstændig`}
                    </span>
                  </div>
                ))}
              </div>

              {children.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">{da ? "Børn" : "Children"} ({children.length})</h3>
                  {children.map((c, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span>{c.name || `Barn ${i + 1}`} ({c.birthYear})</span>
                      <Badge variant="outline">{c.schoolType}</Badge>
                    </div>
                  ))}
                </div>
              )}

              {parsedTransactions.length > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    {parsedTransactions.length} {da ? "transaktioner klar til import" : "transactions ready to import"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {da ? "Tilbage" : "Back"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => {
                if (step === 0) {
                  if (members.length === 0) initMembers();
                  if (children.length === 0 && numChildren > 0) initChildren();
                }
                setStep(step + 1);
              }}
              className="gap-2"
            >
              {da ? "Næste" : "Next"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finishSetup} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              {da ? "Afslut opsætning" : "Finish setup"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
