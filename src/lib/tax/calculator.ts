import { TAX_2026 } from "@/config/tax-2026";
import { PersonTaxInput, TaxProjection, TaxOptimization } from "@/types";

const tc = TAX_2026;

export function calculateTax(input: PersonTaxInput): TaxProjection {
  const grossIncome = input.annualGrossSalary + input.selfEmploymentIncome;

  // 1. AM-bidrag (8% of gross income)
  const amBidrag = grossIncome * tc.amBidragRate;
  const incomeAfterAM = grossIncome - amBidrag;

  // 2. Pension deductions
  const pensionsfradrag = Math.min(
    input.ratepensionContributions,
    tc.ratepensionMaxSelf
  );

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

  // 6. Rentefradrag (interest deduction)
  const rentefradrag = input.mortgageInterest; // The actual deduction value is calculated in tax

  // 7. Total deductions from personal income
  const personalDeductions = beskaeftigelsesfradrag + fagforeningsfradrag + befordringsfradrag;

  // Taxable personal income (before personfradrag)
  const taxablePersonalIncome = incomeAfterAM - pensionsfradrag - personalDeductions;

  // Capital income (negative = mortgage interest)
  const capitalIncome = -rentefradrag;

  // Taxable income for bundskat
  const taxableIncome = Math.max(0, taxablePersonalIncome + capitalIncome);

  // Personfradrag
  const personfradrag = tc.personfradrag;

  // 8. Kommuneskat + kirkeskat
  const kommuneskatRate = tc.kommuneskatRates[input.kommune] || tc.kommuneskatRates["Aarhus"];
  const kirkeskatRate = input.kirkeskat ? (tc.kirkeskatRates[input.kommune] || tc.kirkeskatRates["Aarhus"]) : 0;

  const kommuneskat = Math.max(0, taxableIncome - personfradrag) * kommuneskatRate;
  const kirkeskat = Math.max(0, taxableIncome - personfradrag) * kirkeskatRate;

  // 9. Bundskat
  const bundskat = Math.max(0, taxableIncome - personfradrag) * tc.bundsskatRate;

  // 10. Mellemskat (on personal income above threshold, not capital)
  const mellemskat = Math.max(0, taxablePersonalIncome - tc.mellenskatThreshold) * tc.mellenskatRate;

  // 11. Topskat (personal income + employer pension above threshold)
  const topskat = Math.max(0, taxablePersonalIncome - tc.topskatThreshold) * tc.topskatRate;

  // 12. Toptopskat
  const toptopskat = Math.max(0, taxablePersonalIncome - tc.toptopskatThreshold) * tc.toptopskatRate;

  // Total tax
  const totalTax = amBidrag + bundskat + mellemskat + topskat + toptopskat + kommuneskat + kirkeskat;
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

  // 2. Aldersopsparing
  if (input.aldersopsparingContributions < tc.aldersopsparingMax) {
    const gap = tc.aldersopsparingMax - input.aldersopsparingContributions;
    opts.push({
      id: "pension-aldersopsparing",
      title: "Consider Aldersopsparing",
      titleDA: "Overvej Aldersopsparing",
      description: `You can contribute up to ${tc.aldersopsparingMax.toLocaleString("da-DK")} DKK to Aldersopsparing with favorable 15.3% PAL-tax on returns.`,
      descriptionDA: `Du kan indbetale op til ${tc.aldersopsparingMax.toLocaleString("da-DK")} kr. til Aldersopsparing med fordelagtig 15,3% PAL-skat på afkast.`,
      potentialSaving: Math.round(gap * 0.15),
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

  // 5. Union dues cap warning
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
