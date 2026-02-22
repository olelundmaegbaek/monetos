"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HouseholdConfig, HouseholdMember, Child } from "@/types";
import { TAX_2026 } from "@/config/tax-2026";
import { CategoryManager } from "@/components/budget/category-manager";
import { saveOpenAIKey, loadOpenAIKey, clearOpenAIKey } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { config, setConfig, transactions, setTransactions, locale } = useApp();
  const da = locale === "da";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<HouseholdConfig | null>(config);
  const [showDanger, setShowDanger] = useState(false);
  const [openaiKey, setOpenaiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    const key = loadOpenAIKey();
    if (key) setOpenaiKey(key);
  }, []);

  if (!config || !draft) {
    return <p className="text-muted-foreground">{da ? "Ingen konfiguration fundet." : "No configuration found."}</p>;
  }

  const updateDraft = (updates: Partial<HouseholdConfig>) => {
    setDraft((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const updateMember = (index: number, updates: Partial<HouseholdMember>) => {
    if (!draft) return;
    const members = [...draft.members];
    members[index] = { ...members[index], ...updates };
    updateDraft({ members });
  };

  const updateChild = (index: number, updates: Partial<Child>) => {
    if (!draft) return;
    const children = [...draft.children];
    children[index] = { ...children[index], ...updates };
    updateDraft({ children });
  };

  const addChild = () => {
    if (!draft) return;
    updateDraft({
      children: [
        ...draft.children,
        {
          name: "",
          birthYear: 2020,
          schoolType: "public",
          monthlyEducationCost: 0,
          monthlyAllowance: 0,
          hasBoerneopsparing: false,
          boerneopsparingAnnual: 0,
          activities: [],
        },
      ],
    });
  };

  const removeChild = (index: number) => {
    if (!draft) return;
    updateDraft({ children: draft.children.filter((_, i) => i !== index) });
  };

  const save = () => {
    if (draft) {
      setConfig(draft);
      setEditing(false);
    }
  };

  const cancel = () => {
    setDraft(config);
    setEditing(false);
  };

  const clearAllData = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{da ? "Indstillinger" : "Settings"}</h2>
        {!editing ? (
          <Button onClick={() => setEditing(true)}>{da ? "Rediger" : "Edit"}</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancel}>
              {da ? "Annullér" : "Cancel"}
            </Button>
            <Button onClick={save}>{da ? "Gem" : "Save"}</Button>
          </div>
        )}
      </div>

      {/* Household info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{da ? "Husstand" : "Household"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{da ? "Navn" : "Name"}</Label>
            <Input
              value={draft.displayName}
              disabled={!editing}
              onChange={(e) => updateDraft({ displayName: e.target.value })}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{da ? "Voksne" : "Adults"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {draft.members.map((member, i) => (
            <div key={i} className="space-y-3">
              {i > 0 && <Separator />}
              <h4 className="font-medium">
                {member.name || `${da ? "Voksen" : "Adult"} ${i + 1}`}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{da ? "Navn" : "Name"}</Label>
                  <Input
                    value={member.name}
                    disabled={!editing}
                    onChange={(e) => updateMember(i, { name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{da ? "Arbejdsgiver" : "Employer"}</Label>
                  <Input
                    value={member.employer || ""}
                    disabled={!editing}
                    onChange={(e) => updateMember(i, { employer: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{da ? "Månedsløn (netto)" : "Monthly salary (net)"}</Label>
                  <Input
                    type="number"
                    value={member.monthlyNetSalary}
                    disabled={!editing}
                    onChange={(e) => updateMember(i, { monthlyNetSalary: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{da ? "Kommune" : "Municipality"}</Label>
                  {editing ? (
                    <select
                      value={member.kommune}
                      onChange={(e) => updateMember(i, { kommune: e.target.value })}
                      className="mt-1 w-full border rounded-md px-3 py-2 bg-background text-sm"
                    >
                      {Object.keys(TAX_2026.kommuneskatRates)
                        .sort()
                        .map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <Input value={member.kommune} disabled className="mt-1" />
                  )}
                </div>
              </div>
              <Label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={member.selfEmployed}
                  disabled={!editing}
                  onChange={(e) => updateMember(i, { selfEmployed: e.target.checked })}
                  className="rounded"
                />
                {da ? "Selvstændig" : "Self-employed"}
              </Label>
              {member.selfEmployed && (
                <div>
                  <Label>{da ? "Selvstændig indkomst (måned)" : "Self-employment income (monthly)"}</Label>
                  <Input
                    type="number"
                    value={member.selfEmploymentMonthlyIncome}
                    disabled={!editing}
                    onChange={(e) =>
                      updateMember(i, { selfEmploymentMonthlyIncome: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Children */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {da ? "Børn" : "Children"} ({draft.children.length})
            </CardTitle>
            {editing && (
              <Button variant="outline" size="sm" onClick={addChild}>
                + {da ? "Tilføj barn" : "Add child"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {draft.children.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {da ? "Ingen børn registreret." : "No children registered."}
            </p>
          )}
          {draft.children.map((child, i) => (
            <div key={i} className="space-y-3">
              {i > 0 && <Separator />}
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {child.name || `${da ? "Barn" : "Child"} ${i + 1}`}
                </h4>
                {editing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => removeChild(i)}
                  >
                    {da ? "Fjern" : "Remove"}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{da ? "Navn" : "Name"}</Label>
                  <Input
                    value={child.name}
                    disabled={!editing}
                    onChange={(e) => updateChild(i, { name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{da ? "Fødselsår" : "Birth year"}</Label>
                  <Input
                    type="number"
                    value={child.birthYear}
                    disabled={!editing}
                    onChange={(e) => updateChild(i, { birthYear: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{da ? "Skoletype" : "School type"}</Label>
                  {editing ? (
                    <select
                      value={child.schoolType}
                      onChange={(e) =>
                        updateChild(i, {
                          schoolType: e.target.value as Child["schoolType"],
                        })
                      }
                      className="mt-1 w-full border rounded-md px-3 py-2 bg-background text-sm"
                    >
                      <option value="public">{da ? "Folkeskole" : "Public school"}</option>
                      <option value="private">{da ? "Privatskole" : "Private school"}</option>
                      <option value="sfo">{da ? "SFO" : "After-school (SFO)"}</option>
                      <option value="daycare">{da ? "Daginstitution" : "Daycare"}</option>
                    </select>
                  ) : (
                    <Input value={child.schoolType} disabled className="mt-1" />
                  )}
                </div>
                <div>
                  <Label>{da ? "Uddannelsesudgift (måned)" : "Education cost (monthly)"}</Label>
                  <Input
                    type="number"
                    value={child.monthlyEducationCost}
                    disabled={!editing}
                    onChange={(e) =>
                      updateChild(i, { monthlyEducationCost: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <Label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={child.hasBoerneopsparing}
                  disabled={!editing}
                  onChange={(e) =>
                    updateChild(i, { hasBoerneopsparing: e.target.checked })
                  }
                  className="rounded"
                />
                {da ? "Børneopsparing" : "Children savings"}
              </Label>
              {child.hasBoerneopsparing && (
                <div>
                  <Label>{da ? "Børneopsparing (årlig)" : "Children savings (annual)"}</Label>
                  <Input
                    type="number"
                    value={child.boerneopsparingAnnual}
                    disabled={!editing}
                    onChange={(e) =>
                      updateChild(i, { boerneopsparingAnnual: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{da ? "Data" : "Data"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>{da ? "Transaktioner" : "Transactions"}</span>
            <span className="font-medium">{transactions.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{da ? "Kategoriseringsregler" : "Categorization rules"}</span>
            <span className="font-medium">{config.categorizationRules?.length || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{da ? "Budgetposter" : "Budget entries"}</span>
            <span className="font-medium">{config.budgetEntries?.length || 0}</span>
          </div>

          <Separator />

          {/* Export */}
          <div>
            <h4 className="font-medium text-sm mb-2">{da ? "Eksporter" : "Export"}</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const data = JSON.stringify({ config, transactions }, null, 2);
                const blob = new Blob([data], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `privatfinance-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              {da ? "Download backup (JSON)" : "Download backup (JSON)"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category management */}
      <CategoryManager />

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{da ? "AI Kategorisering" : "AI Categorization"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{da ? "OpenAI API-nøgle" : "OpenAI API Key"}</Label>
            <p className="text-xs text-muted-foreground mb-2">
              {da
                ? "Bruges til AI-kategorisering af transaktioner. Gemmes kun lokalt i din browser."
                : "Used for AI transaction categorization. Stored locally in your browser only."}
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                value={openaiKey}
                onChange={(e) => {
                  setOpenaiKey(e.target.value);
                  setKeySaved(false);
                }}
                placeholder="sk-..."
                className="font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  saveOpenAIKey(openaiKey);
                  setKeySaved(true);
                }}
              >
                {da ? "Gem" : "Save"}
              </Button>
            </div>
            {keySaved && (
              <Badge variant="outline" className="mt-2 text-green-600 border-green-500">
                {da ? "Gemt" : "Saved"}
              </Badge>
            )}
          </div>
          {openaiKey && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={() => {
                clearOpenAIKey();
                setOpenaiKey("");
                setKeySaved(false);
              }}
            >
              {da ? "Fjern nøgle" : "Remove key"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle
            className="text-base text-red-600 cursor-pointer"
            onClick={() => setShowDanger(!showDanger)}
          >
            {da ? "Farezone" : "Danger Zone"} {showDanger ? "▴" : "▾"}
          </CardTitle>
        </CardHeader>
        {showDanger && (
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {da
                  ? "Slet alle transaktioner (beholder konfigurationen)."
                  : "Delete all transactions (keeps configuration)."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  if (
                    window.confirm(
                      da
                        ? "Er du sikker? Alle transaktioner slettes."
                        : "Are you sure? All transactions will be deleted."
                    )
                  ) {
                    setTransactions([]);
                  }
                }}
              >
                {da ? "Slet transaktioner" : "Delete transactions"}
              </Button>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {da
                  ? "Nulstil alt. Alle data slettes og du starter forfra."
                  : "Reset everything. All data will be deleted and you start fresh."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  if (
                    window.confirm(
                      da
                        ? "Er du HELT sikker? ALT data slettes!"
                        : "Are you ABSOLUTELY sure? ALL data will be deleted!"
                    )
                  ) {
                    clearAllData();
                  }
                }}
              >
                {da ? "Nulstil alt" : "Reset everything"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
