"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAppStore,
  hasExistingData,
  isDataEncrypted,
  setCachedPassword,
  clearCachedPassword,
  triggerRehydration,
} from "@/lib/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Lock, Loader2, Coins } from "lucide-react";

type GateMode = "loading" | "new-user" | "encrypted" | "unlocked";

export function PinGate({ children }: { children: React.ReactNode }) {
  const isLoading = useAppStore((s) => s.isLoading);
  const [mode, setMode] = useState<GateMode>("loading");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const locale = useAppStore((s) => s.locale);
  const da = locale === "da";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const exists = hasExistingData();
    if (!exists) {
      setMode("new-user");
      return;
    }

    const encrypted = isDataEncrypted();
    if (encrypted) {
      setMode("encrypted");
      return;
    }

    // Plaintext data — auto-rehydrate
    setMode("loading");
    triggerRehydration().catch(() => {
      // If rehydration fails, treat as new user
      useAppStore.setState({ isLoading: false });
    });
  }, []);

  const handleSkip = useCallback(() => {
    // New user skipping PIN — just unlock
    useAppStore.setState({ isLoading: false });
    setMode("unlocked");
  }, []);

  const handleCreatePin = useCallback(() => {
    setError(null);
    if (pin.length < 4) {
      setError("PIN-koden skal være mindst 4 tegn.");
      return;
    }
    if (pin !== pinConfirm) {
      setError("PIN-koderne matcher ikke.");
      return;
    }
    setCachedPassword(pin);
    useAppStore.setState({ isLoading: false });
    setMode("unlocked");
  }, [pin, pinConfirm]);

  const handleUnlock = useCallback(async () => {
    setError(null);
    if (!pin) {
      setError("Indtast din PIN-kode.");
      return;
    }

    setIsUnlocking(true);
    try {
      setCachedPassword(pin);
      await triggerRehydration();

      // Check if rehydration succeeded (isLoading should be false now)
      const state = useAppStore.getState();
      if (!state.isLoading) {
        setMode("unlocked");
      } else {
        // Rehydration didn't complete — wrong PIN
        clearCachedPassword();
        useAppStore.setState({ isLoading: true });
        setError("Forkert PIN-kode. Prøv igen.");
      }
    } catch {
      clearCachedPassword();
      setError("Forkert PIN-kode. Prøv igen.");
    } finally {
      setIsUnlocking(false);
      setPin("");
    }
  }, [pin]);

  // If store is no longer loading (rehydration complete), render children
  if (!isLoading) {
    return <>{children}</>;
  }

  // Loading state (auto-rehydrating plaintext)
  if (mode === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Indlæser...</span>
        </div>
      </div>
    );
  }

  // Encrypted data — PIN entry
  if (mode === "encrypted") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-sm mx-4">
          <CardHeader className="text-center">
            <Coins className="h-10 w-10 mx-auto text-emerald-600 mb-2" />
            <CardTitle>monetos.me</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Dine data er krypteret. Indtast PIN for at låse op.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pin-unlock">PIN-kode</Label>
              <Input
                id="pin-unlock"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                placeholder="Indtast PIN"
                autoFocus
                className="mt-1"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              onClick={handleUnlock}
              disabled={isUnlocking}
              className="w-full gap-2"
            >
              {isUnlocking && <Loader2 className="h-4 w-4 animate-spin" />}
              {isUnlocking ? "Låser op..." : "Lås op"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // New user — welcome screen
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <Coins className="h-10 w-10 mx-auto text-emerald-600 mb-2" />
          <CardTitle>{da ? "Velkommen til monetos.me" : "Welcome to monetos.me"}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {da
              ? "monetos.me er 100% gratis. Al data gemmes lokalt i din browser — trygt og privat."
              : "monetos.me is 100% free. All data is stored locally in your browser — safe and private."}
          </p>
          <div className="mt-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs text-muted-foreground">
              {da
                ? "Open source og fællesskabsdrevet. Du kan bidrage eller hoste din egen server."
                : "Open source and community-driven. You can contribute or self-host your own server."}
            </p>
            <a
              href="https://github.com/olelundmaegbaek/monetos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium mt-1"
            >
              GitHub
            </a>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPinSetup ? (
            <>
              <Button onClick={handleSkip} className="w-full">
                Kom i gang
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPinSetup(true)}
                className="w-full gap-2"
              >
                <Lock className="h-4 w-4" />
                Opret PIN-kode først
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Du kan altid aktivere PIN-kode senere under Indstillinger.
              </p>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="pin-new">PIN-kode (mindst 4 tegn)</Label>
                <Input
                  id="pin-new"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Vælg PIN"
                  autoFocus
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pin-confirm">Bekræft PIN-kode</Label>
                <Input
                  id="pin-confirm"
                  type="password"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreatePin()}
                  placeholder="Bekræft PIN"
                  className="mt-1"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button onClick={handleCreatePin} className="w-full">
                Opret PIN og kom i gang
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowPinSetup(false);
                  setPin("");
                  setPinConfirm("");
                  setError(null);
                }}
                className="w-full"
              >
                Annuller
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
