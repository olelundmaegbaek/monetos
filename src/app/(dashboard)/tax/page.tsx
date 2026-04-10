"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { calculateTax, buildTaxInputFromMember, formatDKK, formatPercent } from "@/lib/tax/calculator";
import { TAX_2026 } from "@/config/tax-2026";
import { Calculator, Landmark, PiggyBank, Receipt, Lightbulb, AlertTriangle, CheckCircle, Baby } from "lucide-react";

export default function TaxPage() {
  const { config, locale } = useApp();
  const da = locale === "da";

  // Calculate tax projection from member profile
  const projection = useMemo(() => {
    if (!config?.members?.[0]) return null;
    const input = buildTaxInputFromMember(config.members[0]);
    return calculateTax(input);
  }, [config]);

  // Restskat / overskydende skat calculation
  const bskatEntry = config?.budgetEntries?.find((b) => b.categoryId === "tax");
  const annualBskat = bskatEntry ? Math.abs(bskatEntry.monthlyAmount) * 12 : 0;
  const taxDifference = projection ? projection.totalTax - annualBskat : 0;
  const hasRestskat = taxDifference > 0;
  const procenttillaeg = hasRestskat ? taxDifference * TAX_2026.procenttillaegRestskat : 0;
  const rentegodtgoerelse = !hasRestskat ? Math.abs(taxDifference) * TAX_2026.rentegodtgoerelseSats : 0;

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
      {!projection && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {da
                ? "Tilføj mindst ét medlem under Profil for at se skatteberegning."
                : "Add at least one member in Profile to see tax calculations."}
            </p>
          </CardContent>
        </Card>
      )}
      {projection && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              {da ? "Årlig skatteberegning (estimat)" : "Annual Tax Projection (estimate)"}
            </CardTitle>
            <CardDescription>
              {da ? `Baseret på ${config?.members[0]?.name}'s indkomst` : `Based on ${config?.members[0]?.name}'s income`}
              {!config?.members[0]?.annualGrossSalary && (
                <span className="block text-yellow-600 mt-1">
                  {da
                    ? "Bruttoløn estimeret ud fra nettoløn. Udfyld din profil for et præcist resultat."
                    : "Gross salary estimated from net. Complete your profile for accurate results."}
                </span>
              )}
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

      {/* Restskat / Overskydende skat warning */}
      {projection && annualBskat > 0 && (
        <Card className={hasRestskat ? "border-red-300 bg-red-50/50 dark:bg-red-950/20" : "border-green-300 bg-green-50/50 dark:bg-green-950/20"}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {hasRestskat
                ? <AlertTriangle className="h-5 w-5 text-red-600" />
                : <CheckCircle className="h-5 w-5 text-green-600" />}
              {hasRestskat
                ? (da ? "Mulig restskat" : "Potential Additional Tax")
                : (da ? "Overskydende skat" : "Tax Overpayment")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{da ? "Projekteret skat" : "Projected tax"}</span>
                <span>{formatDKK(projection.totalTax)}</span>
              </div>
              <div className="flex justify-between">
                <span>{da ? "Betalt B-skat (budget)" : "B-skat paid (budget)"}</span>
                <span>{formatDKK(annualBskat)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>{hasRestskat ? (da ? "Restskat" : "Tax owed") : (da ? "Til udbetaling" : "Refund")}</span>
                <span className={hasRestskat ? "text-red-600" : "text-green-600"}>
                  {formatDKK(Math.abs(taxDifference))}
                </span>
              </div>
              {hasRestskat && procenttillaeg > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{da ? `Procenttillæg (${(TAX_2026.procenttillaegRestskat * 100).toFixed(1)}%)` : `Interest charge (${(TAX_2026.procenttillaegRestskat * 100).toFixed(1)}%)`}</span>
                  <span className="text-red-500">+{formatDKK(procenttillaeg)}</span>
                </div>
              )}
              {!hasRestskat && rentegodtgoerelse > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{da ? `Rentegodtgørelse (${(TAX_2026.rentegodtgoerelseSats * 100).toFixed(1)}%)` : `Interest credit (${(TAX_2026.rentegodtgoerelseSats * 100).toFixed(1)}%)`}</span>
                  <span className="text-green-500">+{formatDKK(rentegodtgoerelse)}</span>
                </div>
              )}
            </div>
            {hasRestskat && (
              <p className="text-xs text-muted-foreground mt-3">
                {da
                  ? "Overvej at forhøje din B-skat for at undgå restskat og procenttillæg."
                  : "Consider increasing your B-skat payments to avoid additional tax and interest."}
              </p>
            )}
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

      {/* Børneopsparing status */}
      {config?.children && config.children.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Baby className="h-5 w-5" />
              {da ? "Børneopsparing" : "Children's Savings"}
            </CardTitle>
            <CardDescription>
              {da
                ? `Max ${formatDKK(TAX_2026.boerneopsparingMaxYearly)}/år pr. barn, ${formatDKK(TAX_2026.boerneopsparingMaxTotal)} i alt`
                : `Max ${formatDKK(TAX_2026.boerneopsparingMaxYearly)}/year per child, ${formatDKK(TAX_2026.boerneopsparingMaxTotal)} total`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.children.map((child) => {
              const deposited = child.boerneopsparingTotalDeposited ?? 0;
              const remaining = TAX_2026.boerneopsparingMaxTotal - deposited;
              const pct = (deposited / TAX_2026.boerneopsparingMaxTotal) * 100;
              return (
                <div key={child.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{child.name}</span>
                    {!child.hasBoerneopsparing ? (
                      <Badge variant="destructive" className="text-xs">
                        {da ? "Ikke oprettet" : "Not set up"}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {formatDKK(child.boerneopsparingAnnual)}/{da ? "år" : "yr"}
                      </Badge>
                    )}
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatDKK(deposited)} {da ? "indsat" : "deposited"}</span>
                    <span>{formatDKK(remaining)} {da ? "tilbage" : "remaining"}</span>
                  </div>
                </div>
              );
            })}
            {config.children.some((c) => !c.hasBoerneopsparing) && (
              <p className="text-xs text-yellow-600 mt-2">
                {da
                  ? "Opret børneopsparing for alle børn — afkast er skattefrit op til loftet."
                  : "Set up children's savings for all children — returns are tax-free up to the ceiling."}
              </p>
            )}
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
