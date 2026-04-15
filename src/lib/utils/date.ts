/**
 * Parse a "YYYY-MM" string and return the month number (1-12).
 * Throws if the format is invalid.
 */
export function parseMonthNumber(yearMonth: string): number {
  const parts = yearMonth.split("-");
  if (parts.length < 2) {
    throw new Error(`Invalid year-month format: "${yearMonth}"`);
  }
  const month = parseInt(parts[1], 10);
  if (isNaN(month) || month < 1 || month > 12) {
    throw new Error(`Invalid month number in "${yearMonth}"`);
  }
  return month;
}

/** Return current month as "YYYY-MM" */
export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
