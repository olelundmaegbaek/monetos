"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, Hash, X, Plus } from "lucide-react";

type SortField = "date" | "amount" | "description";
type SortDir = "asc" | "desc";

export default function TransactionsPage() {
  const { monthTransactions, locale, selectedMonth, allCategories, setTransactions, transactions } = useApp();
  const da = locale === "da";

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");

  const filtered = useMemo(() => {
    let txns = [...monthTransactions];

    // Filter by type
    if (filterType === "income") txns = txns.filter((t) => t.isIncome);
    if (filterType === "expense") txns = txns.filter((t) => !t.isIncome);

    // Filter by category
    if (filterCategory !== "all") {
      txns = txns.filter((t) => t.categoryId === filterCategory);
    }

    // Filter by tag
    if (filterTag !== "all") {
      txns = txns.filter((t) => t.tags?.includes(filterTag));
    }

    // Filter by search (includes tags)
    if (search) {
      const s = search.toLowerCase();
      txns = txns.filter(
        (t) =>
          t.description.toLowerCase().includes(s) ||
          t.name.toLowerCase().includes(s) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(s))
      );
    }

    // Sort
    txns.sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = a.date.localeCompare(b.date);
      else if (sortField === "amount") cmp = a.amount - b.amount;
      else cmp = a.description.localeCompare(b.description);
      return sortDir === "desc" ? -cmp : cmp;
    });

    return txns;
  }, [monthTransactions, search, filterType, filterCategory, filterTag, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Get unique categories in this month
  const usedCategories = useMemo(() => {
    const ids = new Set(monthTransactions.map((t) => t.categoryId));
    return allCategories.filter((c) => ids.has(c.id));
  }, [monthTransactions, allCategories]);

  // Get all unique tags across all transactions
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    transactions.forEach((t) => t.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [transactions]);

  const addTag = (transactionId: string, tag: string) => {
    const cleaned = tag.replace(/^#/, "").trim().toLowerCase();
    if (!cleaned) return;
    const txn = transactions.find((t) => t.id === transactionId);
    if (!txn) return;
    const currentTags = txn.tags || [];
    if (currentTags.includes(cleaned)) return;
    const updatedTags = [...currentTags, cleaned];
    setTransactions(transactions.map((t) =>
      t.id === transactionId ? { ...t, tags: updatedTags } : t
    ));
    setNewTag("");
  };

  const removeTag = (transactionId: string, tag: string) => {
    const txn = transactions.find((t) => t.id === transactionId);
    if (!txn) return;
    const updatedTags = (txn.tags || []).filter((t) => t !== tag);
    setTransactions(transactions.map((t) =>
      t.id === transactionId ? { ...t, tags: updatedTags.length > 0 ? updatedTags : undefined } : t
    ));
  };

  const totalFiltered = filtered.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-serif tracking-tight">{da ? "Transaktioner" : "Transactions"}</h2>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={da ? "Søg i transaktioner..." : "Search transactions..."}
                className="pl-9"
              />
            </div>

            <div className="flex gap-1">
              {(["all", "income", "expense"] as const).map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                >
                  {type === "all"
                    ? (da ? "Alle" : "All")
                    : type === "income"
                    ? (da ? "Indkomst" : "Income")
                    : (da ? "Udgifter" : "Expenses")}
                </Button>
              ))}
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border rounded-md px-3 py-2 bg-background text-sm"
            >
              <option value="all">{da ? "Alle kategorier" : "All categories"}</option>
              {usedCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {da ? c.nameDA : c.name}
                </option>
              ))}
            </select>

            {allTags.length > 0 && (
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="border rounded-md px-3 py-2 bg-background text-sm"
              >
                <option value="all">{da ? "Alle tags" : "All tags"}</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {filtered.length} {da ? "transaktioner" : "transactions"}
            </span>
            <span className={totalFiltered >= 0 ? "text-positive" : "text-negative"}>
              {da ? "Sum" : "Total"}: {totalFiltered.toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-3">
                    <button onClick={() => toggleSort("date")} className="flex items-center gap-1 font-medium">
                      {da ? "Dato" : "Date"}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-3">
                    <button onClick={() => toggleSort("description")} className="flex items-center gap-1 font-medium">
                      {da ? "Beskrivelse" : "Description"}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-3 font-medium">{da ? "Kategori" : "Category"}</th>
                  <th className="text-left py-3 px-3 font-medium">{da ? "Tags" : "Tags"}</th>
                  <th className="text-right py-3 px-3">
                    <button onClick={() => toggleSort("amount")} className="flex items-center gap-1 font-medium ml-auto">
                      {da ? "Beløb" : "Amount"}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const cat = allCategories.find((c) => c.id === t.categoryId);
                  return (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 px-3 whitespace-nowrap">{t.date}</td>
                      <td className="py-2 px-3 max-w-[300px] truncate">{t.description}</td>
                      <td className="py-2 px-3">
                        {cat && (
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: cat.color, color: cat.color }}
                          >
                            {da ? cat.nameDA : cat.name}
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {t.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs gap-0.5 group">
                              <Hash className="h-2.5 w-2.5" />
                              {tag}
                              <button
                                onClick={(e) => { e.stopPropagation(); removeTag(t.id, tag); }}
                                className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </Badge>
                          ))}
                          {editingTagsId === t.id ? (
                            <form
                              onSubmit={(e) => { e.preventDefault(); addTag(t.id, newTag); }}
                              className="flex items-center gap-1"
                            >
                              <input
                                autoFocus
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onBlur={() => { setEditingTagsId(null); setNewTag(""); }}
                                placeholder={da ? "#tag" : "#tag"}
                                className="w-20 text-xs border rounded px-1.5 py-0.5 bg-background"
                              />
                            </form>
                          ) : (
                            <button
                              onClick={() => { setEditingTagsId(t.id); setNewTag(""); }}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className={`py-2 px-3 text-right font-medium ${t.amount >= 0 ? "text-positive" : "text-negative"}`}>
                        {t.amount.toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr.
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                {da ? "Ingen transaktioner fundet" : "No transactions found"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
