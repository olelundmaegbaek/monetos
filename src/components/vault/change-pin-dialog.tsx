"use client";

import { useState, FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { KeyRound } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";

const PIN_LENGTH = 6;

export function ChangePinDialog() {
  const { locale, changePin } = useApp();
  const da = locale === "da";

  const [open, setOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmNewPin("");
    setError(null);
    setSuccess(false);
    setSubmitting(false);
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(currentPin)) {
      setError(da ? "Nuværende PIN skal være 6 cifre" : "Current PIN must be 6 digits");
      return;
    }
    if (!/^\d{6}$/.test(newPin)) {
      setError(da ? "Ny PIN skal være 6 cifre" : "New PIN must be 6 digits");
      return;
    }
    if (newPin !== confirmNewPin) {
      setError(da ? "Nye PIN-koder matcher ikke" : "New PINs don't match");
      return;
    }
    if (newPin === currentPin) {
      setError(da ? "Ny PIN skal være forskellig" : "New PIN must be different");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const ok = await changePin(currentPin, newPin);
      if (!ok) {
        setError(da ? "Forkert nuværende PIN-kode" : "Wrong current PIN");
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      setSubmitting(false);
      // Auto-close after a moment so the user sees the success state
      setTimeout(() => onOpenChange(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  const onlyDigits = (value: string) => value.replace(/\D/g, "").slice(0, PIN_LENGTH);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <KeyRound className="h-4 w-4" />
          {da ? "Skift PIN" : "Change PIN"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{da ? "Skift PIN-kode" : "Change PIN code"}</DialogTitle>
          <DialogDescription>
            {da
              ? "Dine data re-krypteres med den nye PIN-kode. Husk at skrive den nye PIN ned et sikkert sted — der er stadig ingen gendannelse."
              : "Your data will be re-encrypted with the new PIN. Remember to write the new PIN down somewhere safe — there is still no recovery."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="current-pin">
              {da ? "Nuværende PIN-kode" : "Current PIN"}
            </Label>
            <Input
              id="current-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="current-password"
              maxLength={PIN_LENGTH}
              value={currentPin}
              onChange={(e) => {
                setCurrentPin(onlyDigits(e.target.value));
                setError(null);
              }}
              className="mt-1 tracking-[0.5em] text-center text-lg"
              placeholder="••••••"
              disabled={submitting || success}
            />
          </div>
          <div>
            <Label htmlFor="new-pin">{da ? "Ny PIN-kode" : "New PIN"}</Label>
            <Input
              id="new-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="new-password"
              maxLength={PIN_LENGTH}
              value={newPin}
              onChange={(e) => {
                setNewPin(onlyDigits(e.target.value));
                setError(null);
              }}
              className="mt-1 tracking-[0.5em] text-center text-lg"
              placeholder="••••••"
              disabled={submitting || success}
            />
          </div>
          <div>
            <Label htmlFor="confirm-new-pin">
              {da ? "Bekræft ny PIN-kode" : "Confirm new PIN"}
            </Label>
            <Input
              id="confirm-new-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="new-password"
              maxLength={PIN_LENGTH}
              value={confirmNewPin}
              onChange={(e) => {
                setConfirmNewPin(onlyDigits(e.target.value));
                setError(null);
              }}
              className="mt-1 tracking-[0.5em] text-center text-lg"
              placeholder="••••••"
              disabled={submitting || success}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium" role="alert">
              {error}
            </p>
          )}
          {success && (
            <Badge variant="outline" className="text-positive border-positive">
              {da ? "PIN-kode opdateret" : "PIN updated"}
            </Badge>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {da ? "Annuller" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                success ||
                currentPin.length !== PIN_LENGTH ||
                newPin.length !== PIN_LENGTH ||
                confirmNewPin.length !== PIN_LENGTH
              }
            >
              {submitting
                ? da
                  ? "Opdaterer…"
                  : "Updating…"
                : da
                  ? "Skift PIN"
                  : "Change PIN"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
