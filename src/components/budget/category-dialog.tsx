"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Category, CategoryType } from "@/types";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#14b8a6", "#3b82f6",
  "#6366f1", "#8b5cf6", "#d946ef", "#ec4899", "#78716c", "#475569",
];

const PRESET_ICONS = [
  "ShoppingCart", "Home", "Car", "Heart", "Star", "Briefcase",
  "Zap", "Shield", "Gift", "Coffee", "Plane", "Music",
  "Camera", "BookOpen", "Phone", "Wrench", "Award", "Dumbbell",
  "Dog", "Flower2",
];

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category; // if editing
  onSave: (category: Category) => void;
  existingIds: string[];
  locale: "da" | "en";
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSave,
  existingIds,
  locale,
}: CategoryDialogProps) {
  const da = locale === "da";
  const isEditing = !!category;

  const [name, setName] = useState(category?.name || "");
  const [nameDA, setNameDA] = useState(category?.nameDA || "");
  const [type, setType] = useState<CategoryType>(category?.type || "expense");
  const [icon, setIcon] = useState(category?.icon || "Star");
  const [color, setColor] = useState(category?.color || PRESET_COLORS[0]);
  const [sortOrder, setSortOrder] = useState(category?.sortOrder || 500);
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      setError(da ? "Navn (EN) er påkrævet" : "Name (EN) is required");
      return;
    }
    if (!nameDA.trim()) {
      setError(da ? "Navn (DA) er påkrævet" : "Name (DA) is required");
      return;
    }

    const id = isEditing
      ? category!.id
      : `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

    if (!isEditing && existingIds.includes(id)) {
      setError(da ? "En kategori med dette ID eksisterer allerede" : "A category with this ID already exists");
      return;
    }

    onSave({
      id,
      name: name.trim(),
      nameDA: nameDA.trim(),
      type,
      icon,
      color,
      sortOrder,
    });

    onOpenChange(false);
    // Reset form
    setName("");
    setNameDA("");
    setType("expense");
    setIcon("Star");
    setColor(PRESET_COLORS[0]);
    setSortOrder(500);
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? (da ? "Rediger kategori" : "Edit Category")
              : (da ? "Ny kategori" : "New Category")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && <p className="text-sm text-negative">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{da ? "Navn (engelsk)" : "Name (English)"}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>{da ? "Navn (dansk)" : "Name (Danish)"}</Label>
              <Input value={nameDA} onChange={(e) => setNameDA(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label>{da ? "Type" : "Type"}</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CategoryType)}
              className="mt-1 w-full border rounded-md px-3 py-2 bg-background text-sm"
            >
              <option value="expense">{da ? "Udgift" : "Expense"}</option>
              <option value="income">{da ? "Indkomst" : "Income"}</option>
            </select>
          </div>

          <div>
            <Label>{da ? "Farve" : "Color"}</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    color === c ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>{da ? "Ikon" : "Icon"}</Label>
            <div className="flex gap-1.5 mt-1 flex-wrap">
              {PRESET_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`px-2 py-1 rounded text-xs border transition-all ${
                    icon === ic
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-transparent hover:border-muted-foreground/30"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>{da ? "Sorteringsrækkefølge" : "Sort order"}</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="mt-1 w-32"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {da ? "Annullér" : "Cancel"}
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? (da ? "Gem" : "Save") : (da ? "Opret" : "Create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
