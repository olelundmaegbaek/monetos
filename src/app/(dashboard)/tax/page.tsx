"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { calculateTax, formatDKK, formatPercent } from "@/lib/tax/calculator";
import { TAX_2026 } from "@/config/tax-2026";
import { PersonTaxInput } from "@/types";
import { Calculator, Landmark, PiggyBank, Receipt, ArrowRight, Lightbulb } from "lucide-react";

export default function TaxPage() {
  const { config, locale } = useApp();
  const da = locale === "da";

  // Calculate tax projection from config
  const projection = useMemo(() => {
    if (!config?.members?.[0]) return null;

    const m = config.members[0]; // Primary earner (Ole)
    const input: PersonTaxInput = {
      name: m.name,
      annualGrossSalary: m.monthlyNetSalary * 12 * 1.6, // Rough gross estimate
      selfEmploymentIncome: m.selfEmploymentMonthlyIncome * 12,
      pensionContributions: 0,
      ratepensionContributions: 12500 * 12, // From budget
      aldersopsparingContributions: 0,
      mortgageInterest: 100000, // Estimated
      unionDues: 5662 * 12, // Lægeforeningen
      commutingDistanceKm: 0,
      workDaysPerYear: 220,
      haandvaerkerExpenses: 0,
      serviceExpenses: 910, // Serwiz cleaning annual
      kommune: m.kommune,
      kirkeskat: true,
    };

    return calculateTax(input);
  }, [config]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{da ? "Skatteoptimering" : "Tax Optimization"}</h2>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/tax/pension">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex items-start gap-3">
              <PiggyBank className="h-8 w-8 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold">{da ? "Pension" : "Pension"}</p>
                <p className="text-sm text-muted-foreground">
                  {da ? "Ratepension & Aldersopsparing" : "Retirement savings optimizer"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/tax/deductions">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex items-start gap-3">
              <Receipt className="h-8 w-8 text-blue-600 shrink-0" />
              <div>
                <p className="font-semibold">{da ? "Fradrag" : "Deductions"}</p>
                <p className="text-sm text-muted-foreground">
                  {da ? "Kørsel, håndværker, service m.m." : "Commute, craftsman, services etc."}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/tax/projection">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex items-start gap-3">
              <Calculator className="h-8 w-8 text-purple-600 shrink-0" />
              <div>
                <p className="font-semibold">{da ? "Skatteberegning" : "Tax Projection"}</p>
                <p className="text-sm text-muted-foreground">
                  {da ? "Fuld skatteberegning & scenarier" : "Full computation & what-if scenarios"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Tax projection summary */}
      {projection && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              {da ? "Årlig skatteberegning (estimat)" : "Annual Tax Projection (estimate)"}
            </CardTitle>
            <CardDescription>
              {da ? `Baseret på ${config?.members[0]?.name}'s indkomst` : `Based on ${config?.members[0]?.name}'s income`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-xs text-muted-foreground">{da ? "Bruttoindkomst" : "Gross Income"}</p>
                <p className="text-lg font-bold">{formatDKK(projection.grossIncome)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{da ? "Total skat" : "Total Tax"}</p>
                <p className="text-lg font-bold text-red-600">{formatDKK(projection.totalTax)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{da ? "Nettoindkomst" : "Net Income"}</p>
                <p className="text-lg font-bold text-green-600">{formatDKK(projection.netIncome)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{da ? "Effektiv skattesats" : "Effective Rate"}</p>
                <p className="text-lg font-bold">{formatPercent(projection.effectiveRate)}</p>
              </div>
            </div>

            {/* Tax breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>AM-bidrag (8%)</span>
                <span>{formatDKK(projection.amBidrag)}</span>
              </div>
              <div className="flex justify-between">
                <span>{da ? "Bundskat" : "Bottom bracket tax"} ({formatPercent(TAX_2026.bundsskatRate)})</span>
                <span>{formatDKK(projection.bundskat)}</span>
              </div>
              {projection.mellemskat > 0 && (
                <div className="flex justify-between">
                  <span>{da ? "Mellemskat" : "Middle bracket tax"} (7,5%)</span>
                  <span>{formatDKK(projection.mellemskat)}</span>
                </div>
              )}
              {projection.topskat > 0 && (
                <div className="flex justify-between">
                  <span>{da ? "Topskat" : "Top bracket tax"} (7,5%)</span>
                  <span>{formatDKK(projection.topskat)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{da ? "Kommuneskat" : "Municipal tax"}</span>
                <span>{formatDKK(projection.kommuneskat)}</span>
              </div>
              <div className="flex justify-between">
                <span>{da ? "Kirkeskat" : "Church tax"}</span>
                <span>{formatDKK(projection.kirkeskat)}</span>
              </div>
            </div>

            {/* Thresholds */}
            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium">{da ? "Skattetrin" : "Tax Brackets"}</p>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>{da ? "Mellemskat" : "Middle bracket"} ({formatDKK(TAX_2026.mellenskatThreshold)})</span>
                  <span>{formatPercent(Math.min(projection.taxableIncome / TAX_2026.mellenskatThreshold, 1))}</span>
                </div>
                <Progress
                  value={Math.min((projection.taxableIncome / TAX_2026.mellenskatThreshold) * 100, 100)}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>{da ? "Topskat" : "Top bracket"} ({formatDKK(TAX_2026.topskatThreshold)})</span>
                  <span>{formatPercent(Math.min(projection.taxableIncome / TAX_2026.topskatThreshold, 1))}</span>
                </div>
                <Progress
                  value={Math.min((projection.taxableIncome / TAX_2026.topskatThreshold) * 100, 100)}
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization suggestions */}
      {projection && projection.optimizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              {da ? "Optimeringsforslag" : "Optimization Suggestions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projection.optimizations.map((opt) => (
              <div key={opt.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Badge
                  variant={opt.priority === "high" ? "destructive" : opt.priority === "medium" ? "default" : "secondary"}
                  className="mt-0.5 shrink-0"
                >
                  {opt.priority === "high" ? (da ? "Høj" : "High") : opt.priority === "medium" ? (da ? "Medium" : "Medium") : (da ? "Lav" : "Low")}
                </Badge>
                <div className="flex-1">
                  <p className="font-medium text-sm">{da ? opt.titleDA : opt.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{da ? opt.descriptionDA : opt.description}</p>
                  {opt.potentialSaving > 0 && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      {da ? "Potentiel besparelse" : "Potential saving"}: {formatDKK(opt.potentialSaving)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Key 2026 rates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{da ? "Satser 2026" : "2026 Rates"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{da ? "Personfradrag" : "Personal Allowance"}</p>
              <p className="font-medium">{formatDKK(TAX_2026.personfradrag)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{da ? "Ratepension max" : "Ratepension Max"}</p>
              <p className="font-medium">{formatDKK(TAX_2026.ratepensionMaxSelf)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{da ? "Aldersopsparing max" : "Aldersopsparing Max"}</p>
              <p className="font-medium">{formatDKK(TAX_2026.aldersopsparingMax)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{da ? "Fagforeningsfradrag max" : "Union Deduction Max"}</p>
              <p className="font-medium">{formatDKK(TAX_2026.fagforeningsfradragMax)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{da ? "Håndværkerfradrag max" : "Craftsman Deduction Max"}</p>
              <p className="font-medium">{formatDKK(TAX_2026.haandvaerkerfradragMax)} / {da ? "person" : "person"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{da ? "Servicefradrag max" : "Service Deduction Max"}</p>
              <p className="font-medium">{formatDKK(TAX_2026.servicefradragMax)} / {da ? "person" : "person"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
