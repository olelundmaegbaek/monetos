import Papa from "papaparse";
import { v4 as uuid } from "uuid";
import { RawCSVRow, Transaction } from "@/types";

function parseDanishNumber(value: string): number {
  if (!value || value.trim() === "") return 0;
  // Danish format: "1.234,56" → 1234.56
  return parseFloat(value.replace(/\./g, "").replace(",", "."));
}

function parseCSVDate(dateStr: string): string {
  // Input: "2026/02/20" → Output: "2026-02-20"
  return dateStr.replace(/\//g, "-");
}

export function parseCSV(csvText: string): Transaction[] {
  // Strip BOM (Byte Order Mark) that Nordea CSV files include
  const cleanText = csvText.replace(/^\uFEFF/, "");

  const result = Papa.parse<RawCSVRow>(cleanText, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (result.errors.length > 0 && process.env.NODE_ENV === "development") {
    console.warn("CSV parse warnings:", result.errors);
  }

  const now = new Date().toISOString();

  return result.data
    .filter((row) => row.Bogføringsdato && row.Beløb)
    .map((row): Transaction => {
      const amount = parseDanishNumber(row.Beløb);
      const description = (row.Beskrivelse || row.Navn || "").trim();
      const name = (row.Navn || "").trim();

      return {
        id: uuid(),
        date: parseCSVDate(row.Bogføringsdato.trim()),
        amount,
        name: name || description,
        description: description || name,
        balance: parseDanishNumber(row.Saldo),
        currency: "DKK",
        reconciled: row.Afstemt?.trim() === "X",
        categoryId: "uncategorized",
        isIncome: amount > 0,
        importedAt: now,
      };
    });
}
