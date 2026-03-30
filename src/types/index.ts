// ===== TRANSACTION TYPES =====

export interface RawCSVRow {
  Bogføringsdato: string;
  Beløb: string;
  Afsender: string;
  Modtager: string;
  Navn: string;
  Beskrivelse: string;
  Saldo: string;
  Valuta: string;
  Afstemt: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO date
  amount: number; // Negative = expense, positive = income
  name: string;
  description: string;
  balance: number;
  currency: "DKK";
  reconciled: boolean;
  categoryId: string;
  isIncome: boolean;
  importedAt: string;
}

// ===== CATEGORY TYPES =====

export type CategoryType = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  nameDA: string;
  type: CategoryType;
  icon: string;
  color: string;
  sortOrder: number;
  parentId?: string;
}

export interface CategoryGroup {
  id: string;
  name: string;
  nameDA: string;
  icon: string;
  color: string;
  categoryIds: string[];
  sortOrder: number;
}

export interface CategorizationRule {
  pattern: string;
  field: "name" | "description";
  categoryId: string;
  priority: number;
}

// ===== BUDGET TYPES =====

export type BudgetFrequency = "monthly" | "quarterly" | "yearly" | "irregular";

export interface BudgetEntry {
  categoryId: string;
  monthlyAmount: number; // For monthly/irregular: monthly amount. For quarterly: quarterly payment amount. For yearly: yearly payment amount.
  frequency: BudgetFrequency;
  paymentMonths?: number[]; // 1-indexed months when payment occurs (e.g. [1,4,7,10] for quarterly)
  notes?: string;
}

export interface BudgetVsActual {
  categoryId: string;
  categoryName: string;
  budgeted: number;
  actual: number;
  difference: number;
  percentUsed: number;
}

// ===== FORECAST TYPES =====

export interface MonthlyForecast {
  month: string; // "YYYY-MM"
  forecastedIncome: number;
  forecastedExpenses: number;
  forecastedNet: number;
  byCategory: ForecastCategoryEntry[];
}

export interface ForecastCategoryEntry {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  historicalAverage: number;
  forecastedAmount: number;
  confidence: "high" | "medium" | "low";
}

// ===== HOUSEHOLD CONFIG TYPES =====

export interface HouseholdConfig {
  id: string;
  name: string;
  displayName: string;
  locale: "da" | "en";
  currency: "DKK";
  members: HouseholdMember[];
  children: Child[];
  budgetEntries: BudgetEntry[];
  categorizationRules: CategorizationRule[];
  customCategories?: Category[];
}

export interface HouseholdMember {
  name: string;
  role: "primary" | "secondary";
  employer: string | null;
  selfEmployed: boolean;
  monthlyNetSalary: number;
  annualGrossSalary?: number;
  selfEmploymentMonthlyIncome: number;
  kommune: string;
  // Tax profile (optional — falls back to defaults if not set)
  mortgageInterest?: number;
  unionDues?: number;
  commutingDistanceKm?: number;
  workDaysPerYear?: number;
  haandvaerkerExpenses?: number;
  serviceExpenses?: number;
  kirkeskat?: boolean;
  ratepensionContributions?: number;
  aldersopsparingContributions?: number;
}

export interface Child {
  name: string;
  birthYear: number;
  schoolType: "public" | "private" | "daycare" | "sfo";
  monthlyEducationCost: number;
  monthlyAllowance: number;
  hasBoerneopsparing: boolean;
  boerneopsparingAnnual: number;
  boerneopsparingTotalDeposited?: number;
  activities: { name: string; monthlyCost: number }[];
}

// ===== TAX TYPES =====

export interface TaxConstants {
  year: number;
  amBidragRate: number;
  bundsskatRate: number;
  mellenskatRate: number;
  mellenskatThreshold: number;
  topskatRate: number;
  topskatThreshold: number;
  toptopskatRate: number;
  toptopskatThreshold: number;
  kommuneskatRates: Record<string, number>;
  kirkeskatRates: Record<string, number>;
  personfradrag: number;
  beskaeftigelsesfradragRate: number;
  beskaeftigelsesfradragMax: number;
  fagforeningsfradragMax: number;
  haandvaerkerfradragMax: number;
  servicefradragMax: number;
  ratepensionMaxSelf: number;
  aldersopsparingMax: number;
  aktiesparekontoloft: number;
  boerneopsparingMaxYearly: number;
  boerneopsparingMaxTotal: number;
  befordringsfradragKmLow: number;
  befordringsfradragKmHigh: number;
  befordringsfradragLowMax: number;
  aktieindkomstLavSats: number;
  aktieindkomstHoejSats: number;
  aktieindkomstGraense: number;
  rentefradragVaerdi: number;
  rentefradragReducedRate: number;
  rentefradragThreshold: number;
  skatteloft: number;
  gavefradragMax: number;
  aktiesparekontoBeskatning: number;
  procenttillaegRestskat: number;
  rentegodtgoerelseSats: number;
}

export interface PersonTaxInput {
  name: string;
  annualGrossSalary: number;
  selfEmploymentIncome: number;
  pensionContributions: number;
  ratepensionContributions: number;
  aldersopsparingContributions: number;
  mortgageInterest: number;
  unionDues: number;
  commutingDistanceKm: number;
  workDaysPerYear: number;
  haandvaerkerExpenses: number;
  serviceExpenses: number;
  kommune: string;
  kirkeskat: boolean;
}

export interface TaxProjection {
  grossIncome: number;
  amBidrag: number;
  taxableIncome: number;
  bundskat: number;
  mellemskat: number;
  topskat: number;
  toptopskat: number;
  kommuneskat: number;
  kirkeskat: number;
  totalTax: number;
  effectiveRate: number;
  netIncome: number;
  deductions: {
    personfradrag: number;
    beskaeftigelsesfradrag: number;
    fagforeningsfradrag: number;
    befordringsfradrag: number;
    rentefradrag: number;
    pensionsfradrag: number;
  };
  optimizations: TaxOptimization[];
}

export interface TaxOptimization {
  id: string;
  title: string;
  titleDA: string;
  description: string;
  descriptionDA: string;
  potentialSaving: number;
  category: "pension" | "deduction" | "investment" | "restructuring";
  priority: "high" | "medium" | "low";
}

// ===== VARIANCE TYPES =====

export interface CategoryVariance {
  categoryId: string;
  categoryName: string;
  projected: number;
  actual: number;
  variance: number; // actual - projected (positive = under budget for expenses)
  percentDeviation: number; // percentage deviation from projection
}

export interface MonthVariance {
  month: string; // "YYYY-MM"
  monthLabel: string;
  projectedIncome: number;
  projectedExpenses: number;
  projectedNet: number;
  actualIncome: number;
  actualExpenses: number;
  actualNet: number;
  byCategory: CategoryVariance[];
  hasActualData: boolean;
  isCurrentMonth: boolean;
}

export interface Anomaly {
  type: "large_transaction" | "missing_expected" | "unexpected_category";
  severity: "high" | "medium" | "low";
  description: string;
  descriptionDA: string;
  amount?: number;
  categoryName?: string;
  transactionName?: string;
}

// ===== APP STATE =====

export interface AppState {
  currentConfigId: string | null;
  selectedMonth: string; // YYYY-MM
  locale: "da" | "en";
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpenses: number;
  net: number;
  savingsRate: number;
  byCategory: { categoryId: string; total: number }[];
}
