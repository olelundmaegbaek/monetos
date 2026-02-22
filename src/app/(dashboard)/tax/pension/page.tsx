"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TAX_2026 } from "@/config/tax-2026";
import { calculateTax, formatDKK } from "@/lib/tax/calculator";
import { PersonTaxInput } from "@/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function PensionPage() {
  const { config, locale } = useApp();
  const da = locale === "da";

  const member = config?.members?.[0];
  const [ratepension, setRatepension] = useState(
    config?.budgetEntries?.find((b) => b.categoryId === "pension")
      ? Math.abs(config.budgetEntries.find((b) => b.categoryId === "pension")!.monthlyAmount) * 12
      : 0
  );
  const [aldersopsparing, setAldersopsparing] = useState(0);

  const baseInput: PersonTaxInput = useMemo(() => ({
    name: member?.name || "",
    annualGrossSalary: (member?.monthlyNetSalary || 0) * 12 * 1.6,
    selfEmploymentIncome: (member?.selfEmploymentMonthlyIncome || 0) * 12,
    pensionContributions: 0,
    ratepensionContributions: 0,
    aldersopsparingContributions: 0,
    mortgageInterest: 100000,
    unionDues: 5662 * 12,
    commutingDistanceKm: 0,
    workDaysPerYear: 220,
    haandvaerkerExpenses: 0,
    serviceExpenses: 910,
    kommune: member?.kommune || "Aarhus",
    kirkeskat: true,
  }), [member]);

  // Without pension
  const withoutPension = useMemo(() => calculateTax(baseInput), [baseInput]);

  // With current pension
  const withPension = useMemo(
    () => calculateTax({
      ...baseInput,
      ratepensionContributions: ratepension,
      aldersopsparingContributions: aldersopsparing,
    }),
    [baseInput, ratepension, aldersopsparing]
  );

  const taxSaving = withoutPension.totalTax - withPension.totalTax;

  // Comparison data for chart
  const chartData = useMemo(() => {
    const steps = [0, 20000, 40000, 60000, TAX_2026.ratepensionMaxSelf];
    return steps.map((rp) => {
      const proj = calculateTax({ ...baseInput, ratepensionContributions: rp });
      return {
        ratepension: `${(rp / 1000).toFixed(0)}k`,
        tax: Math.round(proj.totalTax),
        net: Math.round(proj.netIncome),
      };
    });
  }, [baseInput]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{da ? "Pensionsoptimering" : "Pension Optimization"}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{da ? "Ratepension" : "Ratepension"}</CardTitle>
            <CardDescription>
              {da ? `Max ${formatDKK(TAX_2026.ratepensionMaxSelf)}/år for selvstændige` : `Max ${formatDKK(TAX_2026.ratepensionMaxSelf)}/year for self-employed`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <Label>{da ? "Årlig indbetaling" : "Annual contribution"}</Label>
                <span className="text-sm font-medium">{formatDKK(ratepension)}</span>
              </div>
              <Slider
                value={[ratepension]}
                onValueChange={([v]) => setRatepension(v)}
                max={TAX_2026.ratepensionMaxSelf}
                step={1000}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0 kr.</span>
                <span>{formatDKK(TAX_2026.ratepensionMaxSelf)}</span>
              </div>
            </div>

            <div>
              <Label>{da ? "Eller indtast beløb" : "Or enter amount"}</Label>
              <Input
                type="number"
                value={ratepension}
                onChange={(e) => setRatepension(Math.min(Number(e.target.value), TAX_2026.ratepensionMaxSelf))}
                className="mt-1"
              />
            </div>

            <div className="border-t pt-4">
              <Label>{da ? "Aldersopsparing" : "Aldersopsparing"}</Label>
              <p className="text-xs text-muted-foreground mb-2">
                {da ? `Max ${formatDKK(TAX_2026.aldersopsparingMax)}/år, 15,3% PAL-skat` : `Max ${formatDKK(TAX_2026.aldersopsparingMax)}/year, 15.3% PAL-tax`}
              </p>
              <Input
                type="number"
                value={aldersopsparing}
                onChange={(e) => setAldersopsparing(Math.min(Number(e.target.value), TAX_2026.aldersopsparingMax))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{da ? "Skattebesparelse" : "Tax Savings"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">{da ? "Skat uden pension" : "Tax without pension"}</p>
                <p className="text-lg font-bold text-red-600">{formatDKK(withoutPension.totalTax)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">{da ? "Skat med pension" : "Tax with pension"}</p>
                <p className="text-lg font-bold text-red-600">{formatDKK(withPension.totalTax)}</p>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">{da ? "Årlig skattebesparelse" : "Annual tax saving"}</p>
              <p className="text-3xl font-bold text-green-600">{formatDKK(taxSaving)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                = {formatDKK(taxSaving / 12)} / {da ? "md." : "mo."}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{da ? "Effektiv skat (uden pension)" : "Effective rate (w/o pension)"}</span>
                <span>{(withoutPension.effectiveRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>{da ? "Effektiv skat (med pension)" : "Effective rate (w/ pension)"}</span>
                <span>{(withPension.effectiveRate * 100).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{da ? "Skat ved forskellige pensionsniveauer" : "Tax at Different Pension Levels"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="ratepension" label={{ value: da ? "Ratepension" : "Ratepension", position: "bottom" }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number | undefined, name: string | undefined) => [
                  value != null ? formatDKK(value) : "",
                  name === "tax" ? (da ? "Skat" : "Tax") : (da ? "Netto" : "Net"),
                ]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="tax" name={da ? "Skat" : "Tax"} fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
