"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { calculateTax, buildTaxInputFromMember, formatDKK, formatPercent } from "@/lib/tax/calculator";
import { TAX_2026 } from "@/config/tax-2026";
import { PersonTaxInput } from "@/types";

export default function ProjectionPage() {
  const { config, locale } = useApp();
  const da = locale === "da";
  const member = config?.members?.[0];

  const [inputs, setInputs] = useState<PersonTaxInput>(() =>
    member ? buildTaxInputFromMember(member) : {
      name: "",
      annualGrossSalary: 0,
      selfEmploymentIncome: 0,
      pensionContributions: 0,
      ratepensionContributions: 0,
      aldersopsparingContributions: 0,
      mortgageInterest: 0,
      unionDues: 0,
      commutingDistanceKm: 0,
      workDaysPerYear: 220,
      haandvaerkerExpenses: 0,
      serviceExpenses: 0,
      kommune: "Aarhus",
      kirkeskat: true,
    }
  );

  const projection = useMemo(() => calculateTax(inputs), [inputs]);

  const update = (field: keyof PersonTaxInput, value: number | string | boolean) => {
    if (typeof value === "number") {
      if (field === "ratepensionContributions") value = Math.min(Math.max(0, value), TAX_2026.ratepensionMaxSelf);
      else if (field === "aldersopsparingContributions") value = Math.min(Math.max(0, value), TAX_2026.aldersopsparingMax);
      else if (field !== "kirkeskat") value = Math.max(0, value);
    }
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{da ? "Skatteberegning" : "Tax Projection"}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{da ? "Indkomst & Fradrag" : "Income & Deductions"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{da ? "Årlig bruttoløn" : "Annual gross salary"}</Label>
              <Input
                type="number"
                value={inputs.annualGrossSalary}
                onChange={(e) => update("annualGrossSalary", Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{da ? "Selvstændig indkomst (årlig)" : "Self-employment income (annual)"}</Label>
              <Input
                type="number"
                value={inputs.selfEmploymentIncome}
                onChange={(e) => update("selfEmploymentIncome", Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <Separator />
            <div>
              <Label>{da ? "Ratepension (årlig)" : "Ratepension (annual)"}</Label>
              <Input
                type="number"
                value={inputs.ratepensionContributions}
                onChange={(e) => update("ratepensionContributions", Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{da ? "Renteudgifter (boliglån)" : "Mortgage interest"}</Label>
              <Input
                type="number"
                value={inputs.mortgageInterest}
                onChange={(e) => update("mortgageInterest", Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{da ? "Fagforeningskontingent" : "Union dues"}</Label>
              <Input
                type="number"
                value={inputs.unionDues}
                onChange={(e) => update("unionDues", Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{da ? "Pendlingsafstand (én vej, km)" : "Commuting distance (one-way, km)"}</Label>
              <Input
                type="number"
                value={inputs.commutingDistanceKm}
                onChange={(e) => update("commutingDistanceKm", Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{da ? "Kommune" : "Municipality"}</Label>
              <select
                value={inputs.kommune}
                onChange={(e) => update("kommune", e.target.value)}
                className="mt-1 w-full border rounded-md px-3 py-2 bg-background text-sm"
              >
                {Object.keys(TAX_2026.kommuneskatRates).sort().map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <Label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inputs.kirkeskat}
                onChange={(e) => update("kirkeskat", e.target.checked)}
                className="rounded"
              />
              {da ? "Kirkeskat" : "Church tax"}
            </Label>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{da ? "Skatteberegning" : "Tax Computation"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">{da ? "Bruttoindkomst" : "Gross"}</p>
                <p className="font-bold">{formatDKK(projection.grossIncome)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">{da ? "Total skat" : "Total tax"}</p>
                <p className="font-bold text-red-600">{formatDKK(projection.totalTax)}</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-xs text-muted-foreground">{da ? "Nettoindkomst" : "Net income"}</p>
                <p className="font-bold text-green-600">{formatDKK(projection.netIncome)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">{da ? "Effektiv sats" : "Effective rate"}</p>
                <p className="font-bold">{formatPercent(projection.effectiveRate)}</p>
              </div>
            </div>

            <Separator />

            {/* Breakdown */}
            <div className="space-y-2 text-sm">
              <h4 className="font-medium">{da ? "Skatteberegning" : "Tax Breakdown"}</h4>
              <div className="flex justify-between">
                <span>AM-bidrag (8%)</span>
                <span className="text-red-600">{formatDKK(projection.amBidrag)}</span>
              </div>
              <div className="flex justify-between">
                <span>{da ? "Bundskat" : "Bottom bracket"} (12,01%)</span>
                <span className="text-red-600">{formatDKK(projection.bundskat)}</span>
              </div>
              {projection.mellemskat > 0 && (
                <div className="flex justify-between">
                  <span>{da ? "Mellemskat" : "Middle bracket"} (7,5%)</span>
                  <span className="text-red-600">{formatDKK(projection.mellemskat)}</span>
                </div>
              )}
              {projection.topskat > 0 && (
                <div className="flex justify-between">
                  <span>{da ? "Topskat" : "Top bracket"} (7,5%)</span>
                  <span className="text-red-600">{formatDKK(projection.topskat)}</span>
                </div>
              )}
              {projection.toptopskat > 0 && (
                <div className="flex justify-between">
                  <span>{da ? "Toptopskat" : "Additional top"} (5%)</span>
                  <span className="text-red-600">{formatDKK(projection.toptopskat)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{da ? "Kommuneskat" : "Municipal tax"}</span>
                <span className="text-red-600">{formatDKK(projection.kommuneskat)}</span>
              </div>
              {projection.kirkeskat > 0 && (
                <div className="flex justify-between">
                  <span>{da ? "Kirkeskat" : "Church tax"}</span>
                  <span className="text-red-600">{formatDKK(projection.kirkeskat)}</span>
                </div>
              )}

              <Separator />

              <h4 className="font-medium">{da ? "Fradrag" : "Deductions"}</h4>
              <div className="flex justify-between">
                <span>{da ? "Personfradrag" : "Personal allowance"}</span>
                <span className="text-green-600">{formatDKK(projection.deductions.personfradrag)}</span>
              </div>
              <div className="flex justify-between">
                <span>{da ? "Beskæftigelsesfradrag" : "Employment deduction"}</span>
                <span className="text-green-600">{formatDKK(projection.deductions.beskaeftigelsesfradrag)}</span>
              </div>
              {projection.deductions.fagforeningsfradrag > 0 && (
                <div className="flex justify-between">
                  <span>{da ? "Fagforeningsfradrag" : "Union deduction"}</span>
                  <span className="text-green-600">{formatDKK(projection.deductions.fagforeningsfradrag)}</span>
                </div>
              )}
              {projection.deductions.befordringsfradrag > 0 && (
                <div className="flex justify-between">
                  <span>{da ? "Befordringsfradrag" : "Commute deduction"}</span>
                  <span className="text-green-600">{formatDKK(projection.deductions.befordringsfradrag)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{da ? "Pensionsfradrag" : "Pension deduction"}</span>
                <span className="text-green-600">{formatDKK(projection.deductions.pensionsfradrag)}</span>
              </div>
              {projection.deductions.rentefradrag > 0 && (
                <div className="flex justify-between">
                  <span>{da ? "Rentefradrag" : "Interest deduction"}</span>
                  <span className="text-green-600">{formatDKK(projection.deductions.rentefradrag)}</span>
                </div>
              )}
            </div>

            {/* Monthly summary */}
            <div className="mt-4 p-4 bg-primary/5 rounded-lg">
              <p className="text-sm font-medium">{da ? "Månedlig netto (efter skat)" : "Monthly net (after tax)"}</p>
              <p className="text-2xl font-bold text-green-600">{formatDKK(projection.netIncome / 12)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
