import { TaxConstants } from "@/types";

export const TAX_2026: TaxConstants = {
  year: 2026,

  // Income taxes
  amBidragRate: 0.08,
  bundsskatRate: 0.1201,
  mellenskatRate: 0.075,
  mellenskatThreshold: 696956,
  topskatRate: 0.075,
  topskatThreshold: 845543,
  toptopskatRate: 0.05,
  toptopskatThreshold: 2818152,

  // Municipal tax rates (selected Danish municipalities)
  kommuneskatRates: {
    "Aarhus": 0.2542,
    "København": 0.2332,
    "Odense": 0.2478,
    "Aalborg": 0.2579,
    "Frederiksberg": 0.2300,
    "Randers": 0.2596,
    "Horsens": 0.2530,
    "Vejle": 0.2374,
    "Silkeborg": 0.2560,
    "Herning": 0.2490,
  },
  kirkeskatRates: {
    "Aarhus": 0.0076,
    "København": 0.0054,
    "Odense": 0.0074,
    "Aalborg": 0.0083,
    "Frederiksberg": 0.0044,
    "Randers": 0.0085,
    "Horsens": 0.0069,
    "Vejle": 0.0070,
    "Silkeborg": 0.0077,
    "Herning": 0.0074,
  },

  // Personal allowance
  personfradrag: 54100,

  // Employment deduction
  beskaeftigelsesfradragRate: 0.1265,
  beskaeftigelsesfradragMax: 63300,

  // Deduction caps
  fagforeningsfradragMax: 7000,
  haandvaerkerfradragMax: 9000,    // Per person
  servicefradragMax: 18300,        // Per person

  // Pension limits
  ratepensionMaxSelf: 68700,
  aldersopsparingMax: 9200,

  // Investment
  aktiesparekontoloft: 174200,
  aktieindkomstLavSats: 0.27,
  aktieindkomstHoejSats: 0.42,
  aktieindkomstGraense: 79400,

  // Children savings
  boerneopsparingMaxYearly: 6000,
  boerneopsparingMaxTotal: 72000,

  // Commute deduction (befordringsfradrag)
  befordringsfradragKmLow: 2.23,   // 25-120 km per day round trip
  befordringsfradragKmHigh: 1.12,  // Above 120 km per day round trip
  befordringsfradragLowMax: 120,   // km threshold

  // Interest deduction
  rentefradragVaerdi: 0.33,
  rentefradragReducedRate: 0.21,
  rentefradragThreshold: 50000,

  // Tax ceiling
  skatteloft: 0.5207,
};

export const KOMMUNER = Object.keys(TAX_2026.kommuneskatRates).sort();
