import Papa from "papaparse";
import { v4 as uuid } from "uuid";
import { Transaction, ParseResult } from "@/types";

// === DATE FORMATS ===

type DateFormat = "YYYY/MM/DD" | "DD.MM.YYYY" | "DD-MM-YYYY" | "YYYY-MM-DD";

// === BANK PROFILES ===

interface BankProfile {
  id: string;
  displayName: string;
  /** Headers that uniquely identify this bank (checked case-insensitively). */
  signatureHeaders: string[];
  dateColumn: string;
  amountColumn: string;
  balanceColumn: string;
  /** Column names to try (in order) for name and description fields. */
  textColumns: { name: string[]; description: string[] };
  reconciledColumn?: string;
  dateFormat: DateFormat;
  /** Whether amounts use Danish format (1.234,56) vs international (1234.56). */
  danishNumbers: boolean;
}

/**
 * Bank profiles ordered most-specific-first.
 * Detection picks the first profile whose signatureHeaders ALL appear in the CSV headers.
 */
const BANK_PROFILES: BankProfile[] = [
  // Nordea — most columns, unique "Afsender"/"Modtager" headers
  {
    id: "nordea",
    displayName: "Nordea",
    signatureHeaders: ["Bogføringsdato", "Afsender", "Modtager"],
    dateColumn: "Bogføringsdato",
    amountColumn: "Beløb",
    balanceColumn: "Saldo",
    textColumns: { name: ["Navn"], description: ["Beskrivelse", "Navn"] },
    reconciledColumn: "Afstemt",
    dateFormat: "YYYY/MM/DD",
    danishNumbers: true,
  },
  // Danske Bank variant A — has "Status" column
  {
    id: "danske_a",
    displayName: "Danske Bank",
    signatureHeaders: ["Dato", "Tekst", "Beløb", "Saldo", "Status"],
    dateColumn: "Dato",
    amountColumn: "Beløb",
    balanceColumn: "Saldo",
    textColumns: { name: ["Tekst"], description: ["Tekst"] },
    reconciledColumn: "Afstemt",
    dateFormat: "DD.MM.YYYY",
    danishNumbers: true,
  },
  // Danske Bank variant B / Sydbank — uses "Bogført"
  {
    id: "danske_b",
    displayName: "Danske Bank",
    signatureHeaders: ["Bogført", "Tekst", "Beløb", "Saldo"],
    dateColumn: "Bogført",
    amountColumn: "Beløb",
    balanceColumn: "Saldo",
    textColumns: { name: ["Tekst"], description: ["Tekst"] },
    dateFormat: "DD.MM.YYYY",
    danishNumbers: true,
  },
  // Jyske Bank — distinguished by "Valør" column
  {
    id: "jyske",
    displayName: "Jyske Bank",
    signatureHeaders: ["Dato", "Valør", "Tekst"],
    dateColumn: "Dato",
    amountColumn: "Beløb",
    balanceColumn: "Saldo",
    textColumns: { name: ["Tekst"], description: ["Tekst"] },
    dateFormat: "DD.MM.YYYY",
    danishNumbers: true,
  },
  // Lunar — English headers, international numbers
  {
    id: "lunar",
    displayName: "Lunar",
    signatureHeaders: ["Date", "Text", "Amount", "Balance"],
    dateColumn: "Date",
    amountColumn: "Amount",
    balanceColumn: "Balance",
    textColumns: { name: ["Text"], description: ["Text"] },
    dateFormat: "YYYY-MM-DD",
    danishNumbers: false,
  },
  // Generic Danish — catches Spar Nord, Nykredit, Arbejdernes LB, Sydbank, etc.
  {
    id: "generic_dk",
    displayName: "Dansk bank",
    signatureHeaders: ["Dato", "Tekst", "Beløb", "Saldo"],
    dateColumn: "Dato",
    amountColumn: "Beløb",
    balanceColumn: "Saldo",
    textColumns: { name: ["Tekst"], description: ["Tekst"] },
    dateFormat: "DD.MM.YYYY",
    danishNumbers: true,
  },
];

// === COLUMN ALIASES FOR GENERIC FALLBACK ===

const COLUMN_ALIASES: Record<string, string[]> = {
  date: ["dato", "bogføringsdato", "bogført", "date", "valørdato", "valuedato"],
  amount: ["beløb", "amount", "sum"],
  balance: ["saldo", "balance"],
  text: ["tekst", "text", "beskrivelse", "navn", "description", "name"],
  reconciled: ["afstemt", "reconciled"],
};

// === HELPERS ===

function parseDanishNumber(value: string): number {
  if (!value || value.trim() === "") return 0;
  // Danish format: "1.234,56" -> 1234.56
  return parseFloat(value.replace(/\./g, "").replace(",", "."));
}

function parseNumber(value: string, danish: boolean): number {
  if (!value || value.trim() === "") return 0;
  return danish ? parseDanishNumber(value) : parseFloat(value);
}

/**
 * Normalize a date string to ISO YYYY-MM-DD based on the known bank format.
 * Returns null if the result is invalid.
 */
function normalizeDateToISO(dateStr: string, format: DateFormat): string | null {
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  let iso: string;
  switch (format) {
    case "YYYY/MM/DD":
      iso = trimmed.replace(/\//g, "-");
      break;
    case "DD.MM.YYYY": {
      const parts = trimmed.split(".");
      if (parts.length !== 3) return null;
      iso = `${parts[2]}-${parts[1]}-${parts[0]}`;
      break;
    }
    case "DD-MM-YYYY": {
      const parts = trimmed.split("-");
      if (parts.length !== 3) return null;
      iso = `${parts[2]}-${parts[1]}-${parts[0]}`;
      break;
    }
    case "YYYY-MM-DD":
      iso = trimmed;
      break;
  }

  // Validate format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  return iso;
}

// === DETECTION ===

/**
 * Detect which bank profile matches the CSV headers.
 * Returns the first profile whose signatureHeaders all appear in the CSV (case-insensitive).
 */
function detectBank(headers: string[]): BankProfile | null {
  const lowerHeaders = new Set(headers.map((h) => h.trim().toLowerCase()));

  for (const profile of BANK_PROFILES) {
    const allMatch = profile.signatureHeaders.every((sig) =>
      lowerHeaders.has(sig.toLowerCase()),
    );
    if (allMatch) return profile;
  }
  return null;
}

/**
 * Try to build an ad-hoc profile from common column aliases when no known bank matches.
 * Auto-detects date format and number format from the first data row.
 */
function genericFallback(
  headers: string[],
  firstRow: Record<string, string> | undefined,
): BankProfile | null {
  const lowerHeaders = headers.map((h) => h.trim().toLowerCase());

  // Find columns by alias
  function findColumn(role: string): string | null {
    const aliases = COLUMN_ALIASES[role];
    if (!aliases) return null;
    for (const alias of aliases) {
      const idx = lowerHeaders.indexOf(alias);
      if (idx !== -1) return headers[idx]; // Return original-cased header
    }
    return null;
  }

  const dateCol = findColumn("date");
  const amountCol = findColumn("amount");
  if (!dateCol || !amountCol) return null; // Minimum required columns

  const balanceCol = findColumn("balance") || amountCol; // Fallback to amount if no balance
  const textCol = findColumn("text");
  const reconciledCol = findColumn("reconciled");

  // Auto-detect date format from first row
  let dateFormat: DateFormat = "DD.MM.YYYY"; // Default for Danish banks
  if (firstRow) {
    const sample = firstRow[dateCol]?.trim() || "";
    if (/^\d{4}[/-]\d{2}[/-]\d{2}$/.test(sample)) {
      dateFormat = sample.includes("/") ? "YYYY/MM/DD" : "YYYY-MM-DD";
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(sample)) {
      dateFormat = "DD-MM-YYYY";
    }
    // else keep DD.MM.YYYY default
  }

  // Auto-detect number format from first row
  let danishNumbers = true; // Default for Danish banks
  if (firstRow) {
    const sample = firstRow[amountCol]?.trim() || "";
    // If it has a comma, it's Danish format; if only dots/digits, international
    if (sample && !sample.includes(",")) {
      danishNumbers = false;
    }
  }

  return {
    id: "fallback",
    displayName: "Ukendt bank",
    signatureHeaders: [],
    dateColumn: dateCol,
    amountColumn: amountCol,
    balanceColumn: balanceCol,
    textColumns: {
      name: textCol ? [textCol] : [dateCol],
      description: textCol ? [textCol] : [dateCol],
    },
    reconciledColumn: reconciledCol || undefined,
    dateFormat,
    danishNumbers,
  };
}

/**
 * Resolve a profile's column names to match the actual CSV header casing.
 * Detection is case-insensitive, but row lookups must use the exact header key.
 */
function resolveProfileColumns(profile: BankProfile, headers: string[]): BankProfile {
  const lowerToActual = new Map<string, string>();
  for (const h of headers) {
    lowerToActual.set(h.toLowerCase(), h);
  }
  function resolve(col: string): string {
    return lowerToActual.get(col.toLowerCase()) || col;
  }
  return {
    ...profile,
    dateColumn: resolve(profile.dateColumn),
    amountColumn: resolve(profile.amountColumn),
    balanceColumn: resolve(profile.balanceColumn),
    textColumns: {
      name: profile.textColumns.name.map(resolve),
      description: profile.textColumns.description.map(resolve),
    },
    reconciledColumn: profile.reconciledColumn ? resolve(profile.reconciledColumn) : undefined,
  };
}

// === ROW MAPPING ===

function mapRowToTransaction(
  row: Record<string, string>,
  profile: BankProfile,
  now: string,
): Transaction | null {
  const dateRaw = row[profile.dateColumn]?.trim();
  const amountRaw = row[profile.amountColumn]?.trim();
  if (!dateRaw || !amountRaw) return null;

  const date = normalizeDateToISO(dateRaw, profile.dateFormat);
  if (!date) return null;

  const amount = parseNumber(amountRaw, profile.danishNumbers);
  if (isNaN(amount)) return null;

  const name = profile.textColumns.name
    .map((col) => row[col]?.trim())
    .find((v) => v && v.length > 0) || "";

  const description = profile.textColumns.description
    .map((col) => row[col]?.trim())
    .find((v) => v && v.length > 0) || "";

  const balanceRaw = row[profile.balanceColumn]?.trim() || "0";
  const balance = parseNumber(balanceRaw, profile.danishNumbers);

  const reconciled = profile.reconciledColumn
    ? row[profile.reconciledColumn]?.trim() === "X"
    : false;

  return {
    id: uuid(),
    date,
    amount,
    name: name || description,
    description: description || name,
    balance: isNaN(balance) ? 0 : balance,
    currency: "DKK",
    reconciled,
    categoryId: "uncategorized",
    isIncome: amount > 0,
    importedAt: now,
  };
}

// === MAIN PARSER ===

export function parseCSV(csvText: string): ParseResult {
  // Strip BOM (Byte Order Mark) that some bank CSV files include
  const cleanText = csvText.replace(/^\uFEFF/, "");

  const result = Papa.parse<Record<string, string>>(cleanText, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  // If semicolon produced no data, try comma as fallback
  if (result.data.length === 0) {
    const retryResult = Papa.parse<Record<string, string>>(cleanText, {
      header: true,
      delimiter: ",",
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });
    if (retryResult.data.length > 0) {
      return parseWithResult(retryResult);
    }
  }

  if (result.errors.length > 0 && process.env.NODE_ENV === "development") {
    console.warn("CSV parse warnings:", result.errors);
  }

  return parseWithResult(result);
}

function parseWithResult(result: Papa.ParseResult<Record<string, string>>): ParseResult {
  const headers = result.meta.fields || [];

  // Detect bank from headers
  let profile = detectBank(headers);
  if (!profile) {
    profile = genericFallback(headers, result.data[0]);
  }
  if (!profile) {
    return { transactions: [], detectedBank: null };
  }

  // Resolve profile column names to match actual CSV header casing
  profile = resolveProfileColumns(profile, headers);

  const now = new Date().toISOString();
  const transactions: Transaction[] = [];

  for (const row of result.data) {
    const txn = mapRowToTransaction(row, profile, now);
    if (txn) transactions.push(txn);
  }

  return {
    transactions,
    detectedBank: profile.displayName,
  };
}
