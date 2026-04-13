"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileSpreadsheet,
  Sparkles,
  Calculator,
  PiggyBank,
  Users,
  Github,
  AlertTriangle,
} from "lucide-react";
import { HouseholdConfig, HouseholdMember, Child } from "@/types";
import { KOMMUNER } from "@/config/tax-2026";
import { v4 as uuid } from "uuid";
import { PinStep } from "@/components/vault/pin-step";
import { saveConfig } from "@/lib/store";

const STEPS = [
  { title: "PIN-kode", titleEN: "PIN code" },
  { title: "Husstand", titleEN: "Household" },
  { title: "Voksne", titleEN: "Adults" },
  { title: "Børn", titleEN: "Children" },
  { title: "Opsummering", titleEN: "Summary" },
];

export default function SetupPage() {
  const router = useRouter();
  const { setConfig, completeSetup, locale, createVault, vaultState } = useApp();

  const [showWelcome, setShowWelcome] = useState(true);
  // If a vault already exists (user started onboarding previously but didn't
  // finish), skip the PIN step — we can't re-create the vault without losing
  // the derived key. Start directly at Household.
  const [step, setStep] = useState(() => (vaultState === "unlocked" ? 1 : 0));
  const [householdName, setHouseholdName] = useState("");
  const [numAdults, setNumAdults] = useState(2);
  const [numChildren, setNumChildren] = useState(0);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
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
        kirkeskat: true,
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

  const [finishing, setFinishing] = useState(false);

  const finishSetup = async () => {
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

    setFinishing(true);
    try {
      // Write the encrypted config to localStorage BEFORE navigating away,
      // so a subsequent reload reliably finds it. The provider's setConfig
      // is fire-and-forget, so we await the persistent write explicitly.
      await saveConfig(config);
      setConfig(config);
      completeSetup();
      router.push("/");
    } catch (err) {
      console.error("[monetos] finishSetup failed", err);
      setFinishing(false);
    }
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif tracking-tight text-foreground">Monetos</h1>
          <p className="text-lg text-muted-foreground mt-2">
            {showWelcome
              ? da
                ? "Privatøkonomisk overblik med dansk skatteoptimering"
                : "Personal finance overview with Danish tax optimization"
              : da
              ? "Opsæt din privatøkonomi"
              : "Set up your personal finances"}
          </p>
        </div>

        {/* Privacy notice (welcome and first two steps) */}
        {(showWelcome || step === 0 || step === 1) && (
          <div className="mb-6 p-4 border rounded-lg bg-card text-card-foreground shadow-sm space-y-3">
            <div className="flex gap-3">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-base text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">
                  {da
                    ? "Dine data forbliver private — med ét vigtigt forbehold"
                    : "Your data stays private — with one important caveat"}
                </p>
                <p>
                  {da ? (
                    <>
                      Al din økonomidata gemmes udelukkende i din browsers{" "}
                      <strong>LocalStorage</strong> på denne enhed. Intet sendes til en server.
                      I næste trin opretter du en 6-cifret PIN-kode, som bruges til at{" "}
                      <strong>kryptere dine data lokalt i browseren</strong> (AES-256 via Web
                      Crypto). Uden PIN-koden kan dataen ikke læses. Der er ingen gendannelse —
                      glemmer du koden, er dine data tabt.
                    </>
                  ) : (
                    <>
                      All your financial data is stored exclusively in your browser&apos;s{" "}
                      <strong>LocalStorage</strong> on this device. Nothing is sent to a server.
                      In the next step you&apos;ll create a 6-digit PIN that{" "}
                      <strong>encrypts your data locally in the browser</strong> (AES-256 via
                      the Web Crypto API). Without the PIN the data cannot be read. There is
                      no recovery — if you forget the code, your data is lost.
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-3 border-t border-warning/30">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">
                  {da ? "Advarsel om LLM/AI" : "LLM/AI warning"}
                </p>
                <p>
                  {da ? (
                    <>
                      Monetos kan valgfrit bruge OpenAI til automatisk kategorisering af
                      transaktioner. Hvis du senere tilføjer en API-nøgle under Indstillinger,{" "}
                      <strong>sendes dine transaktioner til OpenAI</strong> — de forlader din
                      enhed og eksponeres for en tredjepart. Funktionen er slået fra som
                      standard.
                    </>
                  ) : (
                    <>
                      Monetos can optionally use OpenAI to auto-categorize transactions. If
                      you later add an API key under Settings,{" "}
                      <strong>your transactions will be sent to OpenAI</strong> — they leave
                      your device and are exposed to a third party. This feature is off by
                      default.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step indicators (hidden on welcome screen) */}
        {!showWelcome && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
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
        )}

        {/* Welcome screen */}
        {showWelcome && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-serif">
                <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                {da ? "Velkommen til Monetos" : "Welcome to Monetos"}
              </CardTitle>
              <CardDescription className="text-base">
                {da
                  ? "Et gratis privatøkonomi-værktøj skræddersyet til danske husstande"
                  : "A free personal finance tool tailored for Danish households"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-base text-muted-foreground leading-relaxed">
                {da
                  ? "Monetos hjælper dig med at få det fulde overblik over husstandens økonomi — fra månedligt budget og udgifter til dansk skatteoptimering. Importér kontoudtog fra din bank, kategoriser dine transaktioner og planlæg fremtiden med budgetter og prognoser."
                  : "Monetos gives you a complete overview of your household finances — from monthly budgets and expenses to Danish tax optimization. Import bank statements, categorize transactions and plan ahead with budgets and forecasts."}
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {da ? "Husstandsfokuseret" : "Household-focused"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {da
                        ? "Voksne, børn, lommepenge og børneopsparing"
                        : "Adults, children, allowances and savings"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="h-9 w-9 rounded-xl bg-info/8 flex items-center justify-center shrink-0">
                    <Calculator className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {da ? "Dansk skatteberegning" : "Danish tax engine"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {da
                        ? "AM-bidrag, bund-, mellem- og topskat, kommune + kirkeskat"
                        : "AM-bidrag, tax brackets, municipal and church tax"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="h-9 w-9 rounded-xl bg-positive/8 flex items-center justify-center shrink-0">
                    <PiggyBank className="h-5 w-5 text-positive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {da ? "Budget og prognoser" : "Budgets and forecasts"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {da
                        ? "Planlæg indkomst, udgifter og opsparing måned for måned"
                        : "Plan income, expenses and savings month by month"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="h-9 w-9 rounded-xl bg-warning/8 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {da ? "CSV-import fra banken" : "CSV bank import"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {da
                        ? "Indlæs kontoudtog og kategoriser automatisk"
                        : "Load statements and auto-categorize transactions"}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {da
                  ? "Opsætningen tager kun et par minutter. Du bliver bedt om grundlæggende oplysninger om husstanden, de voksne og eventuelle børn."
                  : "Setup takes just a few minutes. You'll be asked for basic details about your household, the adults and any children."}
              </p>

              <Button
                onClick={() => setShowWelcome(false)}
                className="w-full gap-2"
                size="lg"
              >
                {da ? "Kom i gang" : "Get started"}
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
                <span>
                  {da
                    ? "Monetos er gratis og open source."
                    : "Monetos is free and open source."}
                </span>
                <a
                  href="https://github.com/olelundmaegbaek/monetos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <Github className="h-4 w-4" />
                  {da ? "Se koden på GitHub" : "View source on GitHub"}
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 0: PIN code */}
        {!showWelcome && step === 0 && (
          <PinStep
            locale={locale}
            onComplete={async (pin) => {
              await createVault(pin);
              setStep(1);
            }}
          />
        )}

        {/* Step 1: Household basics */}
        {!showWelcome && step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">{da ? "Husstand" : "Household"}</CardTitle>
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

        {/* Step 2: Adults */}
        {!showWelcome && step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">{da ? "Voksne" : "Adults"}</CardTitle>
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
                      <select
                        value={member.kommune}
                        onChange={(e) => updateMember(idx, { kommune: e.target.value })}
                        className="mt-1 w-full border rounded-md px-3 py-2 bg-background text-sm"
                      >
                        {KOMMUNER.map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.selfEmployed}
                        onChange={(e) => updateMember(idx, { selfEmployed: e.target.checked })}
                        className="rounded"
                      />
                      {da ? "Selvstændig" : "Self-employed"}
                    </Label>
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.kirkeskat ?? true}
                        onChange={(e) => updateMember(idx, { kirkeskat: e.target.checked })}
                        className="rounded"
                      />
                      {da ? "Betaler kirkeskat" : "Pays church tax"}
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

        {/* Step 3: Children */}
        {!showWelcome && step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">{da ? "Børn" : "Children"}</CardTitle>
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

        {/* Step 4: Summary */}
        {!showWelcome && step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">{da ? "Opsummering" : "Summary"}</CardTitle>
              <CardDescription>
                {da ? "Gennemgå din opsætning" : "Review your setup"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-base text-muted-foreground">{da ? "Husstand" : "Household"}</p>
                <p className="text-lg font-serif">{householdName || "Min Husstand"}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">{da ? "Voksne" : "Adults"} ({members.length})</h3>
                {members.map((m, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span>{m.name || `Voksen ${i + 1}`}</span>
                    <span className="text-base font-serif text-muted-foreground">
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

              <div className="p-4 border border-info/30 rounded-lg bg-info/10 space-y-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-info shrink-0" />
                  <p className="font-medium text-info">
                    {da ? "Importer dine kontoudtog" : "Import your bank statements"}
                  </p>
                </div>
                <p className="text-sm text-info/80">
                  {da
                    ? "Når opsætningen er færdig, kan du importere dine CSV-kontoudtog fra Importer-siden i menuen. Dette gør det muligt at kategorisere dine udgifter og opbygge et budget."
                    : "Once setup is complete, you can import your CSV bank statements from the Import page in the menu. This allows you to categorize your expenses and build a budget."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons (hidden on welcome screen) */}
        {!showWelcome && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => {
                // Step 0 (PIN) and step 1 (Household) both go back to welcome
                // since the PIN has already been created and can't be re-set
                // from the onboarding flow.
                if (step <= 1) {
                  setShowWelcome(true);
                } else {
                  setStep(step - 1);
                }
              }}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {da ? "Tilbage" : "Back"}
            </Button>

            {/* Step 0 (PIN) has its own submit button inside PinStep */}
            {step === 0 ? (
              <div />
            ) : step < STEPS.length - 1 ? (
              <Button
                onClick={() => {
                  if (step === 1) {
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
              <Button onClick={finishSetup} disabled={finishing} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                {finishing
                  ? da
                    ? "Gemmer…"
                    : "Saving…"
                  : da
                    ? "Afslut opsætning"
                    : "Finish setup"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
