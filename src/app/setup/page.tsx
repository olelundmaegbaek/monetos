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
  Coins,
  ExternalLink,
  FileSpreadsheet,
} from "lucide-react";
import { GitHubIcon } from "@/components/icons/github";
import { HouseholdConfig, HouseholdMember, Child } from "@/types";
import { v4 as uuid } from "uuid";

const STEPS = [
  { title: "Husstand", titleEN: "Household" },
  { title: "Voksne", titleEN: "Adults" },
  { title: "Børn", titleEN: "Children" },
  { title: "Opsummering", titleEN: "Summary" },
];

const UNSPLASH_BG =
  "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1920&q=80";

export default function SetupPage() {
  const router = useRouter();
  const { setConfig, completeSetup, locale } = useApp();

  const [step, setStep] = useState(0);
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

  return (
    <div className="relative min-h-screen">
      {/* Unsplash background */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${UNSPLASH_BG})` }}
      />
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2">
            <Coins className="h-8 w-8 text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">monetos.me</h1>
          </div>
          <p className="text-white/70 mt-2">
            {da ? "Opsæt din privatøkonomi" : "Set up your personal finances"}
          </p>
        </div>

        {/* Welcome & privacy notice */}
        {step === 0 && (
          <div className="mb-6 p-5 border border-emerald-200 dark:border-emerald-800 rounded-xl bg-emerald-50 dark:bg-emerald-950 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <p className="font-semibold text-foreground">
                {da ? "Velkommen til monetos.me!" : "Welcome to monetos.me!"}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {da
                ? "monetos.me er 100% gratis og open source. Al data gemmes udelukkende i din browsers localStorage — intet sendes til en server, og dine oplysninger forlader aldrig din enhed."
                : "monetos.me is 100% free and open source. All data is stored exclusively in your browser's localStorage — nothing is sent to a server, and your information never leaves your device."}
            </p>
            <p className="text-sm text-muted-foreground">
              {da
                ? "Har du lyst til at bidrage eller hoste din egen monetos-server? Kig forbi vores GitHub!"
                : "Want to contribute or self-host your own server? Check out our GitHub!"}
            </p>
            <a
              href="https://github.com/olelundmaegbaek/monetos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
            >
              <GitHubIcon className="h-4 w-4" />
              GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

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

        {/* Step 3: Summary */}
        {step === 3 && (
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

              <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 space-y-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    {da ? "Importer dine kontoudtog" : "Import your bank statements"}
                  </p>
                </div>
                <p className="text-sm text-blue-700/80 dark:text-blue-300/80">
                  {da
                    ? "Når opsætningen er færdig, kan du importere dine CSV-kontoudtog fra Importer-siden i menuen. Dette gør det muligt at kategorisere dine udgifter og opbygge et budget."
                    : "Once setup is complete, you can import your CSV bank statements from the Import page in the menu. This allows you to categorize your expenses and build a budget."}
                </p>
              </div>
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
