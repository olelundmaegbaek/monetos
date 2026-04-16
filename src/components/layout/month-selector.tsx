"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers/app-provider";
import { format, parse, addMonths, subMonths } from "date-fns";
import { da, enUS } from "date-fns/locale";

export function MonthSelector() {
  const { selectedMonth, setSelectedMonth, availableMonths, locale } = useApp();

  if (!selectedMonth) return null;

  const currentDate = parse(selectedMonth + "-01", "yyyy-MM-dd", new Date());
  if (isNaN(currentDate.getTime())) return null;

  const dateLocale = locale === "da" ? da : enUS;

  // Determine boundaries: earliest available month and current month
  const now = new Date();
  const currentYearMonth = format(now, "yyyy-MM");
  const earliestMonth = availableMonths.length > 0
    ? availableMonths[availableMonths.length - 1]
    : null;

  const canGoPrev = !earliestMonth || format(subMonths(currentDate, 1), "yyyy-MM") >= earliestMonth;
  const canGoNext = selectedMonth < currentYearMonth;

  const goToPrevMonth = () => {
    if (!canGoPrev) return;
    const prev = subMonths(currentDate, 1);
    setSelectedMonth(format(prev, "yyyy-MM"));
  };

  const goToNextMonth = () => {
    if (!canGoNext) return;
    const next = addMonths(currentDate, 1);
    setSelectedMonth(format(next, "yyyy-MM"));
  };

  const displayMonth = format(currentDate, "MMMM yyyy", { locale: dateLocale });

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={goToPrevMonth} disabled={!canGoPrev} className="h-8 w-8">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium min-w-[140px] text-center capitalize">
        {displayMonth}
      </span>
      <Button variant="outline" size="icon" onClick={goToNextMonth} disabled={!canGoNext} className="h-8 w-8">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
