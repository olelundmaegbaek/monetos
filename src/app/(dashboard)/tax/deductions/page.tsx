"use client";

import { useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TAX_2026 } from "@/config/tax-2026";
import { formatDKK } from "@/lib/tax/calculator";
import { Car, Hammer, SprayCan, Home, Users, MapPin, Heart } from "lucide-react";

export default function DeductionsPage() {
  const { config, locale } = useApp();
  const da = locale === "da";
  const numAdults = config?.members?.length || 1;
  const member = config?.members?.[0];

  // Initialize from member profile
  const [commuteDist, setCommuteDist] = useState(member?.commutingDistanceKm ?? 0);
  const [workDays, setWorkDays] = useState(member?.workDaysPerYear ?? 220);
  const [haandvaerker, setHaandvaerker] = useState(member?.haandvaerkerExpenses ?? 0);
  const [service, setService] = useState(member?.serviceExpenses ?? 0);
  const [mortgageInterest, setMortgageInterest] = useState(member?.mortgageInterest ?? 0);

  // Fagforeningsfradrag — from profile or budget
  const unionDues = member?.unionDues ?? (
    config?.budgetEntries?.find((b) => b.categoryId === "union_dues")
      ? Math.abs(config.budgetEntries.find((b) => b.categoryId === "union_dues")!.monthlyAmount) * 12
      : 0
  );

  // Gavefradrag — from budget donations entry
  const donationsFromBudget = config?.budgetEntries?.find((b) => b.categoryId === "donations")
    ? Math.abs(config.budgetEntries.find((b) => b.categoryId === "donations")!.monthlyAmount) * 12
    : 0;
  const [donations, setDonations] = useState(donationsFromBudget);

  // Calculations
  const roundTripKm = commuteDist * 2;
  let befordring = 0;
  if (roundTripKm > 24) {
    const kmLow = Math.min(roundTripKm, TAX_2026.befordringsfradragLowMax) - 24;
    const kmHigh = Math.max(0, roundTripKm - TAX_2026.befordringsfradragLowMax);
    befordring = (kmLow * TAX_2026.befordringsfradragKmLow + kmHigh * TAX_2026.befordringsfradragKmHigh) * workDays;
  }

  const haandvaerkerMax = TAX_2026.haandvaerkerfradragMax * numAdults;
  const haandvaerkerDeduction = Math.min(haandvaerker, haandvaerkerMax);

  const serviceMax = TAX_2026.servicefradragMax * numAdults;
  const serviceDeduction = Math.min(service, serviceMax);

  const fagforeningDeduction = Math.min(unionDues, TAX_2026.fagforeningsfradragMax);

  const rentefradragValue = mortgageInterest * TAX_2026.rentefradragVaerdi;

  const gavefradragDeduction = Math.min(donations, TAX_2026.gavefradragMax);

  const totalDeductions = befordring + haandvaerkerDeduction + serviceDeduction + fagforeningDeduction + gavefradragDeduction;
  const totalTaxValue = totalDeductions * 0.26 + rentefradragValue; // Approximate combined tax value

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{da ? "Fradrag" : "Deductions"}</h2>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{da ? "Samlede fradrag" : "Total Deductions"}</p>
            <p className="text-2xl font-bold">{formatDKK(totalDeductions)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{da ? "Estimeret skatteværdi" : "Estimated Tax Value"}</p>
            <p className="text-2xl font-bold text-positive">{formatDKK(totalTaxValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Befordringsfradrag */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {da ? "Befordringsfradrag (Kørselsfradrag)" : "Commute Deduction"}
          </CardTitle>
          <CardDescription>
            {da
              ? "Fradrag for kørsel mellem hjem og arbejde over 24 km dagligt"
              : "Deduction for commuting over 24 km daily round trip"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{da ? "Afstand (én vej, km)" : "Distance (one-way, km)"}</Label>
              <Input
                type="number"
                min={0}
                value={commuteDist || ""}
                onChange={(e) => setCommuteDist(Math.max(0, Number(e.target.value)))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{da ? "Arbejdsdage pr. år" : "Work days per year"}</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={workDays}
                onChange={(e) => setWorkDays(Math.min(365, Math.max(1, Number(e.target.value))))}
                className="mt-1"
              />
            </div>
          </div>
          <div className="text-sm space-y-1">
            <p>{da ? "Daglig tur/retur" : "Daily round trip"}: {roundTripKm} km</p>
            <p>{da ? "Sats 25-120 km" : "Rate 25-120 km"}: {TAX_2026.befordringsfradragKmLow} kr./km</p>
            <p>{da ? "Sats over 120 km" : "Rate above 120 km"}: {TAX_2026.befordringsfradragKmHigh} kr./km</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              {da ? "Årligt fradrag" : "Annual deduction"}: <span className="text-primary">{formatDKK(befordring)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {da ? "Skatteværdi" : "Tax value"}: ~{formatDKK(befordring * 0.26)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Håndværkerfradrag */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Hammer className="h-5 w-5" />
            {da ? "Håndværkerfradrag" : "Craftsman Deduction"}
          </CardTitle>
          <CardDescription>
            {da
              ? `Max ${formatDKK(TAX_2026.haandvaerkerfradragMax)} pr. person (${formatDKK(haandvaerkerMax)} for ${numAdults} voksne)`
              : `Max ${formatDKK(TAX_2026.haandvaerkerfradragMax)} per person (${formatDKK(haandvaerkerMax)} for ${numAdults} adults)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{da ? "Håndværkerudgifter (kun arbejdsløn)" : "Craftsman expenses (labor only)"}</Label>
            <Input
              type="number"
              min={0}
              value={haandvaerker || ""}
              onChange={(e) => setHaandvaerker(Math.max(0, Number(e.target.value)))}
              className="mt-1"
            />
          </div>
          <Progress value={(haandvaerkerDeduction / haandvaerkerMax) * 100} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatDKK(haandvaerkerDeduction)} {da ? "brugt" : "used"}</span>
            <span>{formatDKK(haandvaerkerMax - haandvaerkerDeduction)} {da ? "tilbage" : "remaining"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Servicefradrag */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <SprayCan className="h-5 w-5" />
            {da ? "Servicefradrag" : "Service Deduction"}
          </CardTitle>
          <CardDescription>
            {da
              ? `Rengøring, havearbejde m.m. Max ${formatDKK(TAX_2026.servicefradragMax)} pr. person`
              : `Cleaning, gardening etc. Max ${formatDKK(TAX_2026.servicefradragMax)} per person`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{da ? "Serviceudgifter" : "Service expenses"}</Label>
            <Input
              type="number"
              min={0}
              value={service || ""}
              onChange={(e) => setService(Math.max(0, Number(e.target.value)))}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {da ? "" : ""}
            </p>
          </div>
          <Progress value={(serviceDeduction / serviceMax) * 100} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatDKK(serviceDeduction)} {da ? "brugt" : "used"}</span>
            <span>{formatDKK(serviceMax - serviceDeduction)} {da ? "tilbage" : "remaining"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Rentefradrag */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="h-5 w-5" />
            {da ? "Rentefradrag" : "Interest Deduction"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{da ? "Årlige renteudgifter (boliglån)" : "Annual mortgage interest"}</Label>
            <Input
              type="number"
              min={0}
              value={mortgageInterest}
              onChange={(e) => setMortgageInterest(Math.max(0, Number(e.target.value)))}
              className="mt-1"
            />
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              {da ? "Fradragsværdi" : "Deduction value"} ({(TAX_2026.rentefradragVaerdi * 100).toFixed(0)}%): <span className="font-medium text-positive">{formatDKK(rentefradragValue)}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Fagforeningsfradrag */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5" />
            {da ? "Fagforeningsfradrag" : "Union Deduction"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{da ? "Faktisk kontingent" : "Actual dues"}</span>
              <span>{formatDKK(unionDues)}</span>
            </div>
            <div className="flex justify-between">
              <span>{da ? "Max fradrag" : "Max deduction"}</span>
              <span>{formatDKK(TAX_2026.fagforeningsfradragMax)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>{da ? "Fradragsberettiget" : "Deductible"}</span>
              <span className="text-primary">{formatDKK(fagforeningDeduction)}</span>
            </div>
            {unionDues > TAX_2026.fagforeningsfradragMax && (
              <Badge variant="secondary" className="mt-2">
                {formatDKK(unionDues - TAX_2026.fagforeningsfradragMax)} {da ? "over grænsen" : "above limit"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gavefradrag */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-5 w-5" />
            {da ? "Gavefradrag (Donationer)" : "Donation Deduction"}
          </CardTitle>
          <CardDescription>
            {da
              ? `Gaver til godkendte organisationer. Max ${formatDKK(TAX_2026.gavefradragMax)} pr. år`
              : `Donations to approved organizations. Max ${formatDKK(TAX_2026.gavefradragMax)} per year`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{da ? "Årlige donationer" : "Annual donations"}</Label>
            <Input
              type="number"
              min={0}
              value={donations || ""}
              onChange={(e) => setDonations(Math.max(0, Number(e.target.value)))}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {da ? "Kun gaver til SKAT-godkendte organisationer tæller" : "Only donations to tax-approved organizations count"}
            </p>
          </div>
          <Progress value={(gavefradragDeduction / TAX_2026.gavefradragMax) * 100} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatDKK(gavefradragDeduction)} {da ? "brugt" : "used"}</span>
            <span>{formatDKK(TAX_2026.gavefradragMax - gavefradragDeduction)} {da ? "tilbage" : "remaining"}</span>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              {da ? "Skatteværdi" : "Tax value"}: <span className="text-positive">~{formatDKK(gavefradragDeduction * 0.26)}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
