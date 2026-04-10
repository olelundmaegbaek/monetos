"use client";

import { useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { CategoryDialog } from "./category-dialog";
import { Category } from "@/types";
import { Pencil, Trash2, Plus } from "lucide-react";

export function CategoryManager() {
  const {
    config,
    allCategories,
    addCustomCategory,
    updateCustomCategory,
    removeCustomCategory,
    transactions,
    locale,
  } = useApp();
  const da = locale === "da";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  const customCategoryIds = new Set((config?.customCategories || []).map((c) => c.id));

  const handleAdd = () => {
    setEditingCategory(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setDialogOpen(true);
  };

  const handleSave = (cat: Category) => {
    if (editingCategory) {
      updateCustomCategory(cat.id, cat);
    } else {
      addCustomCategory(cat);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirm || !reassignTo) return;
    removeCustomCategory(deleteConfirm.id, reassignTo);
    setDeleteConfirm(null);
    setReassignTo("");
  };

  // Count references for deletion warning
  const getReferenceCounts = (catId: string) => {
    const txnCount = transactions.filter((t) => t.categoryId === catId).length;
    const budgetCount = (config?.budgetEntries || []).filter((b) => b.categoryId === catId).length;
    const ruleCount = (config?.categorizationRules || []).filter((r) => r.categoryId === catId).length;
    return { txnCount, budgetCount, ruleCount, total: txnCount + budgetCount + ruleCount };
  };

  const renderCategoryList = (type: "income" | "expense") => {
    const categories = allCategories.filter((c) => c.type === type);

    return (
      <div className="space-y-1">
        {categories.map((cat) => {
          const isCustom = customCategoryIds.has(cat.id);
          return (
            <div
              key={cat.id}
              className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm">{da ? cat.nameDA : cat.name}</span>
                {isCustom ? (
                  <Badge variant="outline" className="text-xs">
                    {da ? "Brugerdefineret" : "Custom"}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {da ? "Standard" : "Default"}
                  </Badge>
                )}
              </div>
              {isCustom && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(cat)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-600"
                    onClick={() => {
                      setDeleteConfirm(cat);
                      // Pre-select a default reassignment target
                      const fallback = type === "expense" ? "uncategorized" : "other_income";
                      setReassignTo(fallback);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{da ? "Kategorier" : "Categories"}</CardTitle>
            <Button variant="outline" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" />
              {da ? "Tilføj" : "Add"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="expense">
            <TabsList className="mb-3">
              <TabsTrigger value="expense">{da ? "Udgifter" : "Expenses"}</TabsTrigger>
              <TabsTrigger value="income">{da ? "Indkomst" : "Income"}</TabsTrigger>
            </TabsList>
            <TabsContent value="expense">
              {renderCategoryList("expense")}
            </TabsContent>
            <TabsContent value="income">
              {renderCategoryList("income")}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        onSave={handleSave}
        existingIds={allCategories.map((c) => c.id)}
        locale={locale}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{da ? "Slet kategori" : "Delete Category"}</DialogTitle>
            <DialogDescription>
              {da
                ? `Er du sikker på, at du vil slette "${deleteConfirm?.nameDA}"?`
                : `Are you sure you want to delete "${deleteConfirm?.name}"?`}
            </DialogDescription>
          </DialogHeader>

          {deleteConfirm && (() => {
            const refs = getReferenceCounts(deleteConfirm.id);
            return refs.total > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-amber-600">
                  {da
                    ? `Denne kategori bruges af ${refs.txnCount} transaktioner, ${refs.budgetCount} budgetposter og ${refs.ruleCount} regler. De vil blive omtildelt til:`
                    : `This category is used by ${refs.txnCount} transactions, ${refs.budgetCount} budget entries, and ${refs.ruleCount} rules. They will be reassigned to:`}
                </p>
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-background text-sm"
                >
                  {allCategories
                    .filter((c) => c.id !== deleteConfirm.id && c.type === deleteConfirm.type)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {da ? c.nameDA : c.name}
                      </option>
                    ))}
                </select>
              </div>
            ) : null;
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              {da ? "Annullér" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={!reassignTo}
            >
              {da ? "Slet" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
