import { TAX_2026 } from "@/config/tax-2026";
import { PersonTaxInput, TaxProjection, TaxOptimization, HouseholdMember } from "@/types";

const tc = TAX_2026;

/**
 * Build a PersonTaxInput from a HouseholdMember's profile.
 * Uses member's stored tax info with sensible defaults for missing fields.
 */
export function buildTaxInputFromMember(m: HouseholdMember): PersonTaxInput {
  return {
    name: m.name,
    annualGrossSalary: m.annualGrossSalary || m.monthlyNetSalary * 12 * 1.6,
    selfEmploymentIncome: m.selfEmploymentMonthlyIncome * 12,
    pensionContributions: 0,
    ratepensionContributions: m.ratepensionContributions ?? 0,
    aldersopsparingContributions: m.aldersopsparingContributions ?? 0,
    mortgageInterest: m.mortgageInterest ?? 0,
    unionDues: m.unionDues ?? 0,
    commutingDistanceKm: m.commutingDistanceKm ?? 0,
    workDaysPerYear: m.workDaysPerYear ?? 220,
    haandvaerkerExpenses: m.haandvaerkerExpenses ?? 0,
    serviceExpenses: m.serviceExpenses ?? 0,
    kommune: m.kommune,
    kirkeskat: m.kirkeskat ?? true,
  };
}

export function calculateTax(input: PersonTaxInput): TaxProjection {
  const grossIncome = input.annualGrossSalary + input.selfEmploymentIncome;

  // 1. AM-bidrag (8% of gross income)
  const amBidrag = grossIncome * tc.amBidragRate;
  const incomeAfterAM = grossIncome - amBidrag;

  // 2. Pension deductions (ratepension + employer pension)
  const ratepensionFradrag = Math.min(
    input.ratepensionContributions,
    tc.ratepensionMaxSelf
  );
  const pensionsfradrag = ratepensionFradrag + input.pensionContributions;

  // 3. Beskæftigelsesfradrag (employment deduction)
  const employmentIncome = input.annualGrossSalary - (input.annualGrossSalary * tc.amBidragRate);
  const beskaeftigelsesfradrag = Math.min(
    employmentIncome * tc.beskaeftigelsesfradragRate,
    tc.beskaeftigelsesfradragMax
  );

  // 4. Fagforeningsfradrag (union dues, capped)
  const fagforeningsfradrag = Math.min(input.unionDues, tc.fagforeningsfradragMax);

  // 5. Befordringsfradrag (commute deduction)
  let befordringsfradrag = 0;
  if (input.commutingDistanceKm > 12) { // One-way > 12km means round trip > 24km
    const roundTripKm = input.commutingDistanceKm * 2;
    if (roundTripKm > 24) {
      const kmLow = Math.min(roundTripKm, tc.befordringsfradragLowMax) - 24;
      const kmHigh = Math.max(0, roundTripKm - tc.befordringsfradragLowMax);
      befordringsfradrag = (kmLow * tc.befordringsfradragKmLow + kmHigh * tc.befordringsfradragKmHigh) * input.workDaysPerYear;
    }
  }

  // 6. Rentefradrag (interest deduction — tax value at rentefradragVaerdi rate)
  const rentefradrag = input.mortgageInterest;
  const rentefradragTaxValue = rentefradrag * tc.rentefradragVaerdi;

  // 8. Total deductions from personal income
  const personalDeductions = beskaeftigelsesfradrag + fagforeningsfradrag + befordringsfradrag;

  // Taxable personal income (before personfradrag)
  const taxablePersonalIncome = Math.max(0, incomeAfterAM - pensionsfradrag - personalDeductions);

  // Taxable income (personal income is the base for bundskat/kommuneskat)
  const taxableIncome = taxablePersonalIncome;

  // Personfradrag
  const personfradrag = tc.personfradrag;

  // 9. Kommuneskat + kirkeskat (on taxable income minus personfradrag)
  const kommuneKnown = input.kommune in tc.kommuneskatRates;
  if (!kommuneKnown && typeof console !== "undefined") {
    console.warn(`[tax] Unknown kommune "${input.kommune}", falling back to Aarhus rates`);
  }
  const kommuneskatRate = tc.kommuneskatRates[input.kommune] ?? tc.kommuneskatRates["Aarhus"];
  const kirkeskatRate = input.kirkeskat ? (tc.kirkeskatRates[input.kommune] ?? tc.kirkeskatRates["Aarhus"]) : 0;

  const kommuneskat = Math.max(0, taxableIncome - personfradrag) * kommuneskatRate;
  const kirkeskat = Math.max(0, taxableIncome - personfradrag) * kirkeskatRate;

  // 10. Bundskat
  const bundskat = Math.max(0, taxableIncome - personfradrag) * tc.bundsskatRate;

  // 11. Mellemskat (on personal income above threshold)
  const mellemskat = Math.max(0, taxablePersonalIncome - tc.mellenskatThreshold) * tc.mellenskatRate;

  // 12. Topskat (on personal income above threshold)
  const topskat = Math.max(0, taxablePersonalIncome - tc.topskatThreshold) * tc.topskatRate;

  // 13. Toptopskat (on personal income above threshold)
  const toptopskat = Math.max(0, taxablePersonalIncome - tc.toptopskatThreshold) * tc.toptopskatRate;

  // Total tax (rentefradrag reduces tax directly as a tax credit)
  const totalTax = Math.max(0, amBidrag + bundskat + mellemskat + topskat + toptopskat + kommuneskat + kirkeskat - rentefradragTaxValue);
  const netIncome = grossIncome - totalTax - pensionsfradrag;
  const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;

  // Generate optimizations
  const optimizations = generateOptimizations(input, {
    grossIncome,
    taxablePersonalIncome,
    pensionsfradrag,
    beskaeftigelsesfradrag,
    fagforeningsfradrag,
    befordringsfradrag,
    mellemskat,
    topskat,
  });

  return {
    grossIncome,
    amBidrag,
    taxableIncome,
    bundskat,
    mellemskat,
    topskat,
    toptopskat,
    kommuneskat,
    kirkeskat,
    totalTax,
    effectiveRate,
    netIncome,
    deductions: {
      personfradrag,
      beskaeftigelsesfradrag,
      fagforeningsfradrag,
      befordringsfradrag,
      rentefradrag,
      pensionsfradrag,
    },
    optimizations,
  };
}

interface OptContext {
  grossIncome: number;
  taxablePersonalIncome: number;
  pensionsfradrag: number;
  beskaeftigelsesfradrag: number;
  fagforeningsfradrag: number;
  befordringsfradrag: number;
  mellemskat: number;
  topskat: number;
}

function generateOptimizations(
  input: PersonTaxInput,
  ctx: OptContext
): TaxOptimization[] {
  const opts: TaxOptimization[] = [];

  // 1. Ratepension optimization
  if (input.ratepensionContributions < tc.ratepensionMaxSelf) {
    const gap = tc.ratepensionMaxSelf - input.ratepensionContributions;
    const marginalRate = ctx.topskat > 0 ? 0.52 : ctx.mellemskat > 0 ? 0.45 : 0.38;
    const saving = gap * marginalRate;
    opts.push({
      id: "pension-ratepension",
      title: "Increase ratepension contributions",
      titleDA: "Forøg ratepension indbetalinger",
      description: `You can contribute ${gap.toLocaleString("da-DK")} DKK more to ratepension (max ${tc.ratepensionMaxSelf.toLocaleString("da-DK")} DKK/year). Estimated tax saving: ${Math.round(saving).toLocaleString("da-DK")} DKK.`,
      descriptionDA: `Du kan indbetale ${gap.toLocaleString("da-DK")} kr. mere til ratepension (max ${tc.ratepensionMaxSelf.toLocaleString("da-DK")} kr./år). Estimeret skattebesparelse: ${Math.round(saving).toLocaleString("da-DK")} kr.`,
      potentialSaving: Math.round(saving),
      category: "pension",
      priority: saving > 10000 ? "high" : "medium",
    });
  }

  // 2. Aldersopsparing (no tax deduction — benefit is lower PAL-tax on returns vs. normal capital gains tax)
  if (input.aldersopsparingContributions < tc.aldersopsparingMax) {
    const gap = tc.aldersopsparingMax - input.aldersopsparingContributions;
    // Estimated benefit: difference between normal capital gains tax (~42%) and PAL-tax (15.3%) on assumed 7% return
    const estimatedReturnRate = 0.07;
    const taxDiff = 0.42 - 0.153;
    const annualBenefit = Math.round(gap * estimatedReturnRate * taxDiff);
    opts.push({
      id: "pension-aldersopsparing",
      title: "Consider Aldersopsparing",
      titleDA: "Overvej Aldersopsparing",
      description: `You can contribute up to ${tc.aldersopsparingMax.toLocaleString("da-DK")} DKK to Aldersopsparing. Benefit: 15.3% PAL-tax on returns vs. ~42% capital gains tax. Est. annual tax advantage: ${annualBenefit.toLocaleString("da-DK")} DKK (assumes 7% return).`,
      descriptionDA: `Du kan indbetale op til ${tc.aldersopsparingMax.toLocaleString("da-DK")} kr. til Aldersopsparing. Fordel: 15,3% PAL-skat på afkast vs. ~42% aktiebeskatning. Est. årlig skattefordel: ${annualBenefit.toLocaleString("da-DK")} kr. (antager 7% afkast).`,
      potentialSaving: annualBenefit,
      category: "pension",
      priority: "medium",
    });
  }

  // 3. Servicefradrag
  if (input.serviceExpenses > 0 && input.serviceExpenses < tc.servicefradragMax) {
    opts.push({
      id: "deduction-service",
      title: "Maximize Servicefradrag",
      titleDA: "Maksimer Servicefradrag",
      description: `You're using ${input.serviceExpenses.toLocaleString("da-DK")} DKK of the ${tc.servicefradragMax.toLocaleString("da-DK")} DKK service deduction limit.`,
      descriptionDA: `Du bruger ${input.serviceExpenses.toLocaleString("da-DK")} kr. af servicefradragets grænse på ${tc.servicefradragMax.toLocaleString("da-DK")} kr.`,
      potentialSaving: Math.round((tc.servicefradragMax - input.serviceExpenses) * 0.26),
      category: "deduction",
      priority: "low",
    });
  }

  // 4. Håndværkerfradrag
  if (input.haandvaerkerExpenses > 0) {
    const claimed = Math.min(input.haandvaerkerExpenses, tc.haandvaerkerfradragMax);
    opts.push({
      id: "deduction-haandvaerker",
      title: "Claim Håndværkerfradrag",
      titleDA: "Benyt Håndværkerfradrag",
      description: `${claimed.toLocaleString("da-DK")} DKK of craftsman work is deductible (max ${tc.haandvaerkerfradragMax.toLocaleString("da-DK")} DKK per person). Tax value: ~${Math.round(claimed * 0.26).toLocaleString("da-DK")} DKK.`,
      descriptionDA: `${claimed.toLocaleString("da-DK")} kr. håndværkerarbejde er fradragsberettiget (max ${tc.haandvaerkerfradragMax.toLocaleString("da-DK")} kr. pr. person). Skatteværdi: ~${Math.round(claimed * 0.26).toLocaleString("da-DK")} kr.`,
      potentialSaving: Math.round(claimed * 0.26),
      category: "deduction",
      priority: "medium",
    });
  }

  // 5. Aktiesparekonto optimization
  {
    const askReturn = 0.07;
    const taxSaved = tc.aktiesparekontoloft * askReturn * (tc.aktieindkomstLavSats - tc.aktiesparekontoBeskatning);
    opts.push({
      id: "investment-ask",
      title: "Maximize Aktiesparekonto (ASK)",
      titleDA: "Maksimer Aktiesparekonto (ASK)",
      description: `ASK is taxed at only ${(tc.aktiesparekontoBeskatning * 100).toFixed(0)}% on gains vs ${(tc.aktieindkomstLavSats * 100).toFixed(0)}%/${(tc.aktieindkomstHoejSats * 100).toFixed(0)}% in regular depot. Ceiling: ${tc.aktiesparekontoloft.toLocaleString("da-DK")} DKK. Est. annual tax advantage: ${Math.round(taxSaved).toLocaleString("da-DK")} DKK (assumes ${(askReturn * 100).toFixed(0)}% return).`,
      descriptionDA: `ASK beskattes med kun ${(tc.aktiesparekontoBeskatning * 100).toFixed(0)}% af afkast mod ${(tc.aktieindkomstLavSats * 100).toFixed(0)}%/${(tc.aktieindkomstHoejSats * 100).toFixed(0)}% i frit depot. Loft: ${tc.aktiesparekontoloft.toLocaleString("da-DK")} kr. Est. årlig skattefordel: ${Math.round(taxSaved).toLocaleString("da-DK")} kr. (antager ${(askReturn * 100).toFixed(0)}% afkast).`,
      potentialSaving: Math.round(taxSaved),
      category: "investment",
      priority: "medium",
    });
  }

  // 6. Union dues cap warning
  if (input.unionDues > tc.fagforeningsfradragMax) {
    opts.push({
      id: "info-union",
      title: "Union dues exceed deduction cap",
      titleDA: "Fagforeningskontingent overstiger fradragsgrænsen",
      description: `Your union dues of ${input.unionDues.toLocaleString("da-DK")} DKK exceed the deduction cap of ${tc.fagforeningsfradragMax.toLocaleString("da-DK")} DKK. Only ${tc.fagforeningsfradragMax.toLocaleString("da-DK")} DKK is deductible.`,
      descriptionDA: `Dit fagforeningskontingent på ${input.unionDues.toLocaleString("da-DK")} kr. overstiger fradragsgrænsen på ${tc.fagforeningsfradragMax.toLocaleString("da-DK")} kr. Kun ${tc.fagforeningsfradragMax.toLocaleString("da-DK")} kr. er fradragsberettiget.`,
      potentialSaving: 0,
      category: "deduction",
      priority: "low",
    });
  }

  return opts.sort((a, b) => {
    const p = { high: 3, medium: 2, low: 1 };
    return p[b.priority] - p[a.priority];
  });
}

export function formatDKK(amount: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(rate: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rate);
}
