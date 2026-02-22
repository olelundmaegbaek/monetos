"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers/app-provider";
import { format, parse, addMonths, subMonths } from "date-fns";
import { da, enUS } from "date-fns/locale";

export function MonthSelector() {
  const { selectedMonth, setSelectedMonth, availableMonths, locale } = useApp();

  const currentDate = parse(selectedMonth + "-01", "yyyy-MM-dd", new Date());
  const dateLocale = locale === "da" ? da : enUS;

  const goToPrevMonth = () => {
    const prev = subMonths(currentDate, 1);
    setSelectedMonth(format(prev, "yyyy-MM"));
  };

  const goToNextMonth = () => {
    const next = addMonths(currentDate, 1);
    setSelectedMonth(format(next, "yyyy-MM"));
  };

  const displayMonth = format(currentDate, "MMMM yyyy", { locale: dateLocale });

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={goToPrevMonth} className="h-8 w-8">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium min-w-[140px] text-center capitalize">
        {displayMonth}
      </span>
      <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-8 w-8">
        <ChevronRight className="h-4 w-4" />
      </Button>
      {availableMonths.length > 0 && (
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="text-xs border rounded px-2 py-1 bg-background"
        >
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {format(parse(m + "-01", "yyyy-MM-dd", new Date()), "MMM yyyy", { locale: dateLocale })}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
