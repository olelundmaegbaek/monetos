"use client";

import { useState, useRef, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, ArrowRight, AlertTriangle } from "lucide-react";

interface PinStepProps {
  locale: "da" | "en";
  onComplete: (pin: string) => void | Promise<void>;
}

const PIN_LENGTH = 6;

export function PinStep({ locale, onComplete }: PinStepProps) {
  const da = locale === "da";
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const confirmRef = useRef<HTMLInputElement | null>(null);

  const validate = (): string | null => {
    if (!/^\d{6}$/.test(pin)) {
      return da
        ? `PIN-koden skal være præcis ${PIN_LENGTH} cifre`
        : `PIN must be exactly ${PIN_LENGTH} digits`;
    }
    if (pin !== confirmPin) {
      return da ? "PIN-koderne matcher ikke" : "PINs don't match";
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onComplete(pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          {da ? "Opret en PIN-kode" : "Create a PIN"}
        </CardTitle>
        <CardDescription className="text-base">
          {da
            ? "Vælg en 6-cifret PIN-kode. Den bruges til at kryptere alle dine data lokalt i browseren (AES-256 via Web Crypto), så ingen andre på denne enhed kan læse dem. Du skal indtaste PIN-koden hver gang du åbner Monetos."
            : "Choose a 6-digit PIN. It's used to encrypt all your data locally in the browser (AES-256 via Web Crypto) so no one else on this device can read it. You'll enter the PIN every time you open Monetos."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="pin">{da ? "PIN-kode (6 cifre)" : "PIN code (6 digits)"}</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="new-password"
              maxLength={PIN_LENGTH}
              value={pin}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
                setPin(digits);
                setError(null);
                if (digits.length === PIN_LENGTH) {
                  confirmRef.current?.focus();
                }
              }}
              className="mt-1 tracking-[0.5em] text-center text-lg"
              placeholder="••••••"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="confirm-pin">
              {da ? "Bekræft PIN-kode" : "Confirm PIN code"}
            </Label>
            <Input
              id="confirm-pin"
              ref={confirmRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="new-password"
              maxLength={PIN_LENGTH}
              value={confirmPin}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
                setConfirmPin(digits);
                setError(null);
              }}
              className="mt-1 tracking-[0.5em] text-center text-lg"
              placeholder="••••••"
            />
          </div>

          <div className="flex gap-3 p-3 rounded-lg border border-warning/40 bg-warning/10 text-warning-foreground">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">
                {da ? "Ingen gendannelse" : "No recovery"}
              </p>
              <p className="text-muted-foreground">
                {da
                  ? "Der er ingen måde at gendanne en glemt PIN-kode på. Skriv den ned et sikkert sted — hvis du mister den, er dine data tabt."
                  : "There is no way to recover a forgotten PIN. Write it down somewhere safe — if you lose it, your data is lost."}
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full gap-2"
            size="lg"
            disabled={submitting || pin.length !== PIN_LENGTH || confirmPin.length !== PIN_LENGTH}
          >
            {submitting
              ? da
                ? "Opretter…"
                : "Creating…"
              : da
                ? "Opret PIN og fortsæt"
                : "Create PIN and continue"}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
