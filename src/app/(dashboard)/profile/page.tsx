"use client";

import { useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HouseholdConfig, HouseholdMember, Child } from "@/types";
import { KOMMUNER, TAX_2026 } from "@/config/tax-2026";
import { formatDKK } from "@/lib/tax/calculator";

export default function ProfilePage() {
  const { config, setConfig, locale } = useApp();
  const da = locale === "da";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<HouseholdConfig | null>(config);

  if (!config || !draft) {
    return (
      <p className="text-muted-foreground">
        {da ? "Ingen konfiguration fundet." : "No configuration found."}
      </p>
    );
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

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{da ? "Profil" : "Profile"}</h2>
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

      {/* Household name */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{da ? "Husstand" : "Household"}</CardTitle>
        </CardHeader>
        <CardContent>
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
      {draft.members.map((member, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-base">
              {member.name || `${da ? "Voksen" : "Adult"} ${i + 1}`}
            </CardTitle>
            <CardDescription>
              {da ? "Personlige og økonomiske oplysninger" : "Personal and financial information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic info */}
            <div>
              <h4 className="text-sm font-medium mb-3">{da ? "Grundoplysninger" : "Basic Info"}</h4>
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
                  <Label>{da ? "Kommune" : "Municipality"}</Label>
                  {editing ? (
                    <select
                      value={member.kommune}
                      onChange={(e) => updateMember(i, { kommune: e.target.value })}
                      className="mt-1 w-full border rounded-md px-3 py-2 bg-background text-sm"
                    >
                      {KOMMUNER.map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  ) : (
                    <Input value={member.kommune} disabled className="mt-1" />
                  )}
                </div>
              </div>
              <Label className="flex items-center gap-2 cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={member.selfEmployed}
                  disabled={!editing}
                  onChange={(e) => updateMember(i, { selfEmployed: e.target.checked })}
                  className="rounded"
                />
                {da ? "Selvstændig" : "Self-employed"}
              </Label>
            </div>

            <Separator />

            {/* Income */}
            <div>
              <h4 className="text-sm font-medium mb-3">{da ? "Indkomst" : "Income"}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{da ? "Månedsløn (netto)" : "Monthly salary (net)"}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={member.monthlyNetSalary || ""}
                    disabled={!editing}
                    onChange={(e) => updateMember(i, { monthlyNetSalary: Math.max(0, Number(e.target.value)) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{da ? "Årlig bruttoløn" : "Annual gross salary"}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={member.annualGrossSalary || ""}
                    disabled={!editing}
                    onChange={(e) => updateMember(i, { annualGrossSalary: Math.max(0, Number(e.target.value)) })}
                    placeholder={da ? "Vigtigt for skatteberegning" : "Important for tax calculations"}
                    className="mt-1"
                  />
                </div>
                {member.selfEmployed && (
                  <div>
                    <Label>{da ? "Selvstændig indkomst (måned)" : "Self-employment income (monthly)"}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={member.selfEmploymentMonthlyIncome || ""}
                      disabled={!editing}
                      onChange={(e) => updateMember(i, { selfEmploymentMonthlyIncome: Math.max(0, Number(e.target.value)) })}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Tax profile */}
            <div>
              <h4 className="text-sm font-medium mb-1">{da ? "Skatteoplysninger" : "Tax Information"}</h4>
              <p className="text-xs text-muted-foreground mb-3">
                {da
                  ? "Bruges automatisk i skatteberegning og optimeringsforslag."
                  : "Used automatically in tax calculations and optimization suggestions."}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{da ? "Boligrenter (årlig)" : "Mortgage interest (annual)"}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={member.mortgageInterest ?? ""}
                    disabled={!editing}
                    onChange={(e) => updateMember(i, { mortgageInterest: Math.max(0, Number(e.target.value)) })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{da ? "Fagforeningskontingent (årlig)" : "Union dues (annual)"}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={member.unionDues ?? ""}
                    disabled={!editing}
                    onChange={(e) => updateMember(i, { unionDues: Math.max(0, Number(e.target.value)) })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{da ? "Pendlingsafstand (én vej, km)" : "Commuting distance (one-way, km)"}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={member.commutingDistanceKm ?? ""}
                    disabled={!editing}
                    onChange={(e) => updateMember(i, { commutingDistanceKm: Math.max(0, Number(e.target.value)) })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{da ? "Arbejdsdage pr. år" : "Work days per year"}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={member.workDaysPerYear ?? ""}
                    disabled={!editing}
                    onChange={(e) => updateMember(i, { workDaysPerYear: Math.min(365, Math.max(1, Number(e.target.value))) })}
                    placeholder="220"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{da ? "Håndværkerudgifter (årlig)" : "Craftsman expenses (annual)"}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={member.haandvaerkerExpenses ?? ""}
                    disabled={!editing}
                    onChange={(e) => updateMember(i, { haandvaerkerExpenses: Math.max(0, Number(e.target.value)) })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{da ? "Serviceudgifter (årlig)" : "Service expenses (annual)"}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={member.serviceExpenses ?? ""}
                    disabled={!editing}
                    onChange={(e) => updateMember(i, { serviceExpenses: Math.max(0, Number(e.target.value)) })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{da ? "Ratepension (årlig)" : "Ratepension (annual)"}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={TAX_2026.ratepensionMaxSelf}
                    value={member.ratepensionContributions ?? ""}
                    disabled={!editing}
                    onChange={(e) => updateMember(i, { ratepensionContributions: Math.min(TAX_2026.ratepensionMaxSelf, Math.max(0, Number(e.target.value))) })}
                    placeholder="0"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Max {formatDKK(TAX_2026.ratepensionMaxSelf)}/{da ? "år" : "year"}
                  </p>
                </div>
                <div>
                  <Label>{da ? "Aldersopsparing (årlig)" : "Aldersopsparing (annual)"}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={TAX_2026.aldersopsparingMax}
                    value={member.aldersopsparingContributions ?? ""}
                    disabled={!editing}
                    onChange={(e) => updateMember(i, { aldersopsparingContributions: Math.min(TAX_2026.aldersopsparingMax, Math.max(0, Number(e.target.value))) })}
                    placeholder="0"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Max {formatDKK(TAX_2026.aldersopsparingMax)}/{da ? "år" : "year"}
                  </p>
                </div>
              </div>
              <Label className="flex items-center gap-2 cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={member.kirkeskat ?? true}
                  disabled={!editing}
                  onChange={(e) => updateMember(i, { kirkeskat: e.target.checked })}
                  className="rounded"
                />
                {da ? "Betaler kirkeskat" : "Pays church tax"}
              </Label>
            </div>
          </CardContent>
        </Card>
      ))}

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
                        updateChild(i, { schoolType: e.target.value as Child["schoolType"] })
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
                    min={0}
                    value={child.monthlyEducationCost || ""}
                    disabled={!editing}
                    onChange={(e) => updateChild(i, { monthlyEducationCost: Math.max(0, Number(e.target.value)) })}
                    className="mt-1"
                  />
                </div>
              </div>
              <Label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={child.hasBoerneopsparing}
                  disabled={!editing}
                  onChange={(e) => updateChild(i, { hasBoerneopsparing: e.target.checked })}
                  className="rounded"
                />
                {da ? "Børneopsparing" : "Children savings"}
              </Label>
              {child.hasBoerneopsparing && (
                <div>
                  <Label>{da ? "Børneopsparing (årlig)" : "Children savings (annual)"}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={child.boerneopsparingAnnual || ""}
                    disabled={!editing}
                    onChange={(e) => updateChild(i, { boerneopsparingAnnual: Math.max(0, Number(e.target.value)) })}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
