"use client";

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BudgetEntry, BudgetFrequency, BudgetVsActual, CategoryGroup } from "@/types";
import { getAmountForMonth, getMonthlyEquivalent, getDefaultPaymentMonths } from "@/lib/forecast";
import { Trash2, Pencil, Check, X, ChevronDown, ChevronRight } from "lucide-react";

// === HELPER FUNCTIONS ===

export function getAmountLabel(frequency: BudgetFrequency, da: boolean): string {
  switch (frequency) {
    case "quarterly": return da ? "Kvartalsbeløb" : "Quarterly amount";
    case "yearly": return da ? "Årligt beløb" : "Yearly amount";
    default: return da ? "Beløb" : "Amount";
  }
}

export function getFrequencyLabel(frequency: BudgetFrequency, da: boolean): string {
  switch (frequency) {
    case "quarterly": return da ? "Kvartalsvis" : "Quarterly";
    case "yearly": return da ? "Årlig" : "Yearly";
    case "irregular": return da ? "Uregelmæssig" : "Irregular";
    default: return da ? "Månedlig" : "Monthly";
  }
}

// === CONFIDENCE BADGE ===

export function ConfidenceBadge({ confidence, da }: { confidence: "high" | "medium" | "low"; da: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        confidence === "high"
          ? "border-green-500 text-green-600"
          : confidence === "medium"
          ? "border-yellow-500 text-yellow-600"
          : "border-red-500 text-red-600"
      }
    >
      {confidence === "high"
        ? (da ? "Høj" : "High")
        : confidence === "medium"
        ? (da ? "Middel" : "Medium")
        : (da ? "Lav" : "Low")}
    </Badge>
  );
}

// === PAYMENT MONTH SELECTOR ===

const QUARTER_PRESETS = [
  { label: "Jan/Apr/Jul/Okt", months: [1, 4, 7, 10] },
  { label: "Feb/Maj/Aug/Nov", months: [2, 5, 8, 11] },
  { label: "Mar/Jun/Sep/Dec", months: [3, 6, 9, 12] },
];

const MONTH_NAMES_DA = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function PaymentMonthSelector({
  frequency,
  selectedMonths,
  onChange,
  da,
}: {
  frequency: BudgetFrequency;
  selectedMonths: number[];
  onChange: (months: number[]) => void;
  da: boolean;
}) {
  const monthNames = da ? MONTH_NAMES_DA : MONTH_NAMES_EN;

  if (frequency === "quarterly") {
    const currentPresetIdx = QUARTER_PRESETS.findIndex(
      (p) => JSON.stringify(p.months) === JSON.stringify([...selectedMonths].sort((a, b) => a - b))
    );
    return (
      <select
        value={currentPresetIdx >= 0 ? currentPresetIdx : 0}
        onChange={(e) => onChange(QUARTER_PRESETS[Number(e.target.value)].months)}
        className="border rounded-md px-2 py-1.5 bg-background text-xs w-36"
      >
        {QUARTER_PRESETS.map((p, i) => (
          <option key={i} value={i}>{p.label}</option>
        ))}
      </select>
    );
  }

  if (frequency === "yearly") {
    return (
      <select
        value={selectedMonths[0] || 1}
        onChange={(e) => onChange([Number(e.target.value)])}
        className="border rounded-md px-2 py-1.5 bg-background text-xs w-28"
      >
        {monthNames.map((name, i) => (
          <option key={i} value={i + 1}>{name}</option>
        ))}
      </select>
    );
  }

  return null;
}

// === GROUPED FORECAST ROWS ===

export function GroupedForecastRows({
  group,
  budgetAmount,
  historicalAverage,
  forecastedAmount,
  confidence,
  childEntries,
  isExpanded,
  onToggle,
  da,
  allCategories,
}: {
  group: CategoryGroup;
  budgetAmount: number;
  historicalAverage: number;
  forecastedAmount: number;
  confidence: "high" | "medium" | "low";
  childEntries: { categoryId: string; budgetAmount: number; historicalAverage: number; forecastedAmount: number; confidence: "high" | "medium" | "low" }[];
  isExpanded: boolean;
  onToggle: () => void;
  da: boolean;
  allCategories: { id: string; name: string; nameDA: string }[];
}) {
  return (
    <>
      <tr className="border-b cursor-pointer hover:bg-muted/50" onClick={onToggle}>
        <td className="py-2 pr-4">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
            <span className="font-medium">{da ? group.nameDA : group.name}</span>
          </div>
        </td>
        <td className="py-2 pr-4 text-right">
          {budgetAmount !== 0 ? `${Math.round(budgetAmount).toLocaleString("da-DK")} kr.` : "—"}
        </td>
        <td className="py-2 pr-4 text-right">
          {historicalAverage !== 0 ? `${Math.round(historicalAverage).toLocaleString("da-DK")} kr.` : "—"}
        </td>
        <td className="py-2 pr-4 text-right font-medium text-red-600">
          {Math.round(forecastedAmount).toLocaleString("da-DK")} kr.
        </td>
        <td className="py-2">
          <ConfidenceBadge confidence={confidence} da={da} />
        </td>
      </tr>
      {isExpanded &&
        childEntries
          .filter((e) => e.forecastedAmount !== 0)
          .sort((a, b) => a.forecastedAmount - b.forecastedAmount)
          .map((entry) => {
            const cat = allCategories.find((c) => c.id === entry.categoryId);
            const catName = cat ? (da ? cat.nameDA : cat.name) : entry.categoryId;
            return (
              <tr key={entry.categoryId} className="border-b last:border-0 bg-muted/30">
                <td className="py-1.5 pr-4 pl-8 text-muted-foreground">{catName}</td>
                <td className="py-1.5 pr-4 text-right text-muted-foreground">
                  {entry.budgetAmount !== 0 ? `${Math.round(entry.budgetAmount).toLocaleString("da-DK")} kr.` : "—"}
                </td>
                <td className="py-1.5 pr-4 text-right text-muted-foreground">
                  {entry.historicalAverage !== 0 ? `${Math.round(entry.historicalAverage).toLocaleString("da-DK")} kr.` : "—"}
                </td>
                <td className={`py-1.5 pr-4 text-right ${entry.forecastedAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {Math.round(entry.forecastedAmount).toLocaleString("da-DK")} kr.
                </td>
                <td className="py-1.5">
                  <ConfidenceBadge confidence={entry.confidence} da={da} />
                </td>
              </tr>
            );
          })}
    </>
  );
}

// === READ-ONLY ROW ===

export function ReadOnlyRow({
  item,
  entry,
  type,
  da,
  allCategories,
  onSave,
  onDelete,
  isGlobalEditing,
}: {
  item: BudgetVsActual;
  entry: BudgetEntry;
  type: "income" | "expense";
  da: boolean;
  allCategories: { id: string; color?: string }[];
  onSave: (categoryId: string, updates: Partial<BudgetEntry>) => void;
  onDelete: (categoryId: string) => void;
  isGlobalEditing: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftAmount, setDraftAmount] = useState(Math.abs(entry.monthlyAmount));
  const [draftFrequency, setDraftFrequency] = useState(entry.frequency);
  const [draftPaymentMonths, setDraftPaymentMonths] = useState(
    entry.paymentMonths || getDefaultPaymentMonths(entry.frequency)
  );
  const [draftNotes, setDraftNotes] = useState(entry.notes || "");

  const cat = allCategories.find((c) => c.id === item.categoryId);
  const isOver = item.percentUsed > 100;
  const isIncome = type === "income";
  const isExpense = type === "expense";
  const isNonMonthly = entry.frequency === "quarterly" || entry.frequency === "yearly";
  const isNoPaymentThisMonth = isNonMonthly && item.budgeted === 0;

  const startInlineEdit = () => {
    setDraftAmount(Math.abs(entry.monthlyAmount));
    setDraftFrequency(entry.frequency);
    setDraftPaymentMonths(entry.paymentMonths || getDefaultPaymentMonths(entry.frequency));
    setDraftNotes(entry.notes || "");
    setIsEditing(true);
  };

  const saveInlineEdit = () => {
    const showPM = draftFrequency === "quarterly" || draftFrequency === "yearly";
    onSave(entry.categoryId, {
      monthlyAmount: isExpense ? -Math.abs(draftAmount) : Math.abs(draftAmount),
      frequency: draftFrequency,
      paymentMonths: showPM ? draftPaymentMonths : undefined,
      notes: draftNotes || undefined,
    });
    setIsEditing(false);
  };

  const cancelInlineEdit = () => {
    setIsEditing(false);
  };

  const showDraftPaymentMonths = draftFrequency === "quarterly" || draftFrequency === "yearly";

  if (isEditing) {
    return (
      <div className="space-y-1 py-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium min-w-[120px] truncate">{item.categoryName}</span>
          <Input
            type="number"
            value={draftAmount || ""}
            onChange={(e) => setDraftAmount(Number(e.target.value))}
            placeholder={getAmountLabel(draftFrequency, da)}
            className="w-28"
          />
          <select
            value={draftFrequency}
            onChange={(e) => {
              const newFreq = e.target.value as BudgetFrequency;
              setDraftFrequency(newFreq);
              setDraftPaymentMonths(getDefaultPaymentMonths(newFreq));
            }}
            className="border rounded-md px-2 py-1.5 bg-background text-xs w-28"
          >
            <option value="monthly">{da ? "Månedlig" : "Monthly"}</option>
            <option value="quarterly">{da ? "Kvartalsvis" : "Quarterly"}</option>
            <option value="yearly">{da ? "Årlig" : "Yearly"}</option>
            <option value="irregular">{da ? "Uregelmæssig" : "Irregular"}</option>
          </select>
          {showDraftPaymentMonths && (
            <PaymentMonthSelector
              frequency={draftFrequency}
              selectedMonths={draftPaymentMonths}
              onChange={setDraftPaymentMonths}
              da={da}
            />
          )}
          <Input
            value={draftNotes}
            onChange={(e) => setDraftNotes(e.target.value)}
            placeholder={da ? "Noter" : "Notes"}
            className="w-32 text-xs"
          />
          <Button variant="ghost" size="icon" onClick={saveInlineEdit} className="shrink-0">
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={cancelInlineEdit} className="shrink-0">
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(entry.categoryId)} className="shrink-0">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  if (isNoPaymentThisMonth) {
    return (
      <div className="space-y-1 opacity-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {!isIncome && (
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: (cat as { color?: string })?.color }}
              />
            )}
            <span>{item.categoryName}</span>
            <Badge variant="outline" className="text-[10px] py-0">
              {getFrequencyLabel(entry.frequency, da)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {da ? "Ingen betaling denne måned" : "No payment this month"}
            </span>
            <span className="text-xs text-muted-foreground">
              ({da ? "gns." : "avg."} {Math.round(Math.abs(getMonthlyEquivalent(entry))).toLocaleString("da-DK")} kr./md.)
            </span>
            {!isGlobalEditing && (
              <Button variant="ghost" size="icon" onClick={startInlineEdit} className="h-6 w-6 shrink-0">
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {!isIncome && (
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: (cat as { color?: string })?.color }}
            />
          )}
          <span>{item.categoryName}</span>
          {isNonMonthly && (
            <Badge variant="outline" className="text-[10px] py-0">
              {getFrequencyLabel(entry.frequency, da)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isIncome ? "text-green-600" : isOver ? "text-red-600" : ""}`}>
            {Math.round(item.actual).toLocaleString("da-DK")}
          </span>
          <span className="text-muted-foreground">
            / {Math.round(item.budgeted).toLocaleString("da-DK")} kr.
          </span>
          <Badge
            variant={isOver && !isIncome ? "destructive" : item.percentUsed >= 100 && isIncome ? "default" : "outline"}
            className="text-xs"
          >
            {item.percentUsed.toFixed(0)}%
          </Badge>
          {!isGlobalEditing && (
            <Button variant="ghost" size="icon" onClick={startInlineEdit} className="h-6 w-6 shrink-0">
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
      <Progress
        value={Math.min(item.percentUsed, 100)}
        className={`h-2 ${isOver && !isIncome ? "[&>div]:bg-red-500" : ""}`}
      />
    </div>
  );
}

// === EDITABLE ROW ===

export function EditableRow({
  entry,
  index,
  allCategories,
  usedCategoryIds,
  da,
  onUpdate,
  onRemove,
  isExpense,
}: {
  entry: BudgetEntry;
  index: number;
  allCategories: { id: string; name: string; nameDA: string }[];
  usedCategoryIds: Set<string>;
  da: boolean;
  onUpdate: (index: number, updates: Partial<BudgetEntry>) => void;
  onRemove: (index: number) => void;
  isExpense?: boolean;
}) {
  const availableCategories = allCategories.filter(
    (c) => c.id === entry.categoryId || !usedCategoryIds.has(c.id)
  );

  const showPaymentMonths = entry.frequency === "quarterly" || entry.frequency === "yearly";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <select
          value={entry.categoryId}
          onChange={(e) => onUpdate(index, { categoryId: e.target.value })}
          className="border rounded-md px-2 py-1.5 bg-background text-sm flex-1 min-w-[140px]"
        >
          <option value="">{da ? "Vælg kategori..." : "Select category..."}</option>
          {availableCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {da ? c.nameDA : c.name}
            </option>
          ))}
        </select>
        <Input
          type="number"
          value={Math.abs(entry.monthlyAmount) || ""}
          onChange={(e) => {
            const val = Number(e.target.value);
            onUpdate(index, { monthlyAmount: isExpense ? -Math.abs(val) : Math.abs(val) });
          }}
          placeholder={getAmountLabel(entry.frequency, da)}
          className="w-28"
        />
        <select
          value={entry.frequency}
          onChange={(e) => {
            const newFreq = e.target.value as BudgetFrequency;
            onUpdate(index, {
              frequency: newFreq,
              paymentMonths: getDefaultPaymentMonths(newFreq),
            });
          }}
          className="border rounded-md px-2 py-1.5 bg-background text-xs w-28"
        >
          <option value="monthly">{da ? "Månedlig" : "Monthly"}</option>
          <option value="quarterly">{da ? "Kvartalsvis" : "Quarterly"}</option>
          <option value="yearly">{da ? "Årlig" : "Yearly"}</option>
          <option value="irregular">{da ? "Uregelmæssig" : "Irregular"}</option>
        </select>
        {showPaymentMonths && (
          <PaymentMonthSelector
            frequency={entry.frequency}
            selectedMonths={entry.paymentMonths || getDefaultPaymentMonths(entry.frequency)}
            onChange={(months) => onUpdate(index, { paymentMonths: months })}
            da={da}
          />
        )}
        <Button variant="ghost" size="icon" onClick={() => onRemove(index)} className="shrink-0">
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
