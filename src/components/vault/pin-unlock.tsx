"use client";

import { useState, useRef, FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, ShieldAlert, Lock } from "lucide-react";

interface PinUnlockProps {
  locale: "da" | "en";
  onUnlock: (pin: string) => Promise<boolean>;
  onForget: () => void;
}

const PIN_LENGTH = 6;

// Escalating delays on wrong attempts: 0s, 1s, 2s, 4s, 8s, cap at 8s
const WRONG_ATTEMPT_DELAYS_MS = [0, 1000, 2000, 4000, 8000, 8000];

export function PinUnlock({ locale, onUnlock, onForget }: PinUnlockProps) {
  const da = locale === "da";
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingForget, setConfirmingForget] = useState(false);
  const wrongAttemptsRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pin.length !== PIN_LENGTH) {
      setError(
        da
          ? `Indtast ${PIN_LENGTH} cifre`
          : `Enter ${PIN_LENGTH} digits`,
      );
      return;
    }
    setError(null);
    setSubmitting(true);

    // Apply escalating delay
    const attemptIdx = Math.min(wrongAttemptsRef.current, WRONG_ATTEMPT_DELAYS_MS.length - 1);
    const delay = WRONG_ATTEMPT_DELAYS_MS[attemptIdx];
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const ok = await onUnlock(pin);
      if (!ok) {
        wrongAttemptsRef.current += 1;
        setError(da ? "Forkert PIN-kode" : "Wrong PIN");
        setPin("");
        inputRef.current?.focus();
        setSubmitting(false);
        return;
      }
      // Success: component will unmount when vaultState flips to "unlocked"
      wrongAttemptsRef.current = 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif tracking-tight text-foreground">Monetos</h1>
          <p className="text-lg text-muted-foreground mt-2">
            {da ? "Lås op for at fortsætte" : "Unlock to continue"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              {da ? "Lås Monetos op" : "Unlock Monetos"}
            </CardTitle>
            <CardDescription>
              {da
                ? "Indtast din 6-cifrede PIN-kode for at dekryptere dine data."
                : "Enter your 6-digit PIN to decrypt your data."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="unlock-pin">{da ? "PIN-kode" : "PIN code"}</Label>
                <Input
                  id="unlock-pin"
                  ref={inputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="current-password"
                  maxLength={PIN_LENGTH}
                  value={pin}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
                    setPin(digits);
                    setError(null);
                  }}
                  disabled={submitting}
                  className="mt-1 tracking-[0.5em] text-center text-lg"
                  placeholder="••••••"
                />
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
                disabled={submitting || pin.length !== PIN_LENGTH}
              >
                <KeyRound className="h-4 w-4" />
                {submitting
                  ? da
                    ? "Låser op…"
                    : "Unlocking…"
                  : da
                    ? "Lås op"
                    : "Unlock"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              {!confirmingForget ? (
                <button
                  type="button"
                  onClick={() => setConfirmingForget(true)}
                  className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  {da ? "Glemt PIN? Nulstil alle data" : "Forgot PIN? Reset all data"}
                </button>
              ) : (
                <div className="space-y-3 p-3 rounded-lg border border-destructive/40 bg-destructive/10">
                  <div className="flex gap-2 items-start">
                    <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm">
                      {da
                        ? "Dette sletter alle dine data permanent. Handlingen kan ikke fortrydes."
                        : "This permanently deletes all your data. This action cannot be undone."}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={onForget}
                      className="flex-1"
                    >
                      {da ? "Ja, slet alt" : "Yes, delete everything"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmingForget(false)}
                      className="flex-1"
                    >
                      {da ? "Annuller" : "Cancel"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
