"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CategoryManager } from "@/components/budget/category-manager";
import { saveOpenAIKey, loadOpenAIKey, clearOpenAIKey } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { ChangePinDialog } from "@/components/vault/change-pin-dialog";

export default function SettingsPage() {
  const { config, transactions, setTransactions, locale, setLocale } = useApp();
  const da = locale === "da";

  const [showDanger, setShowDanger] = useState(false);
  const [openaiKey, setOpenaiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    const key = loadOpenAIKey();
    if (key) setOpenaiKey(key);
  }, []);

  const clearAllData = () => {
    if (typeof window !== "undefined") {
      // Auto-download backup before clearing
      const data = JSON.stringify({ config, transactions }, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `monetos-backup-before-reset-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      localStorage.clear();
      window.location.href = "/";
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold">{da ? "Indstillinger" : "Settings"}</h2>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{da ? "Sprog" : "Language"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={locale === "da" ? "default" : "outline"}
              size="sm"
              onClick={() => setLocale("da")}
            >
              Dansk
            </Button>
            <Button
              variant={locale === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => setLocale("en")}
            >
              English
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security (PIN management) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {da ? "Sikkerhed" : "Security"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              {da
                ? "Dine data er krypteret lokalt i browseren med din 6-cifrede PIN-kode (AES-256). PIN-koden ligger aldrig på disken — den bruges kun til at udlede en nøgle i hukommelsen. Glemmer du koden, er dataen tabt."
                : "Your data is encrypted locally in the browser with your 6-digit PIN (AES-256). The PIN itself is never stored on disk — it's only used to derive an in-memory key. If you forget it, your data is lost."}
            </p>
            <ChangePinDialog />
          </div>
        </CardContent>
      </Card>

      {/* Category management */}
      <CategoryManager />

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{da ? "AI Kategorisering" : "AI Categorization"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 p-3 rounded-lg border border-warning/40 bg-warning/10">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-foreground">
                {da ? "Advarsel: Data sendes til tredjepart" : "Warning: Data sent to a third party"}
              </p>
              <p className="text-muted-foreground">
                {da
                  ? "Indtaster du en OpenAI API-nøgle, vil dine transaktioner blive sendt til OpenAI ved automatisk kategorisering. Dataen forlader din enhed og eksponeres for tredjepart. Slet nøglen for at deaktivere funktionen."
                  : "If you enter an OpenAI API key, your transactions will be sent to OpenAI when auto-categorizing. The data leaves your device and is exposed to a third party. Delete the key to disable the feature."}
              </p>
            </div>
          </div>
          <div>
            <Label>{da ? "OpenAI API-nøgle" : "OpenAI API Key"}</Label>
            <p className="text-xs text-muted-foreground mb-2">
              {da
                ? "Nøglen gemmes lokalt i din browser i klartekst (ikke krypteret med PIN — den skal bruges til at sende data til OpenAI, så kryptering ville være virkningsløst)."
                : "The key is stored locally in your browser in plaintext (not PIN-encrypted — it needs to be used to send data to OpenAI, so encryption wouldn't help)."}
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                value={openaiKey}
                onChange={(e) => {
                  setOpenaiKey(e.target.value);
                  setKeySaved(false);
                }}
                placeholder="sk-..."
                className="font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  saveOpenAIKey(openaiKey);
                  setKeySaved(true);
                }}
              >
                {da ? "Gem" : "Save"}
              </Button>
            </div>
            {keySaved && (
              <Badge variant="outline" className="mt-2 text-positive border-positive">
                {da ? "Gemt" : "Saved"}
              </Badge>
            )}
          </div>
          {openaiKey && (
            <Button
              variant="ghost"
              size="sm"
              className="text-negative"
              onClick={() => {
                clearOpenAIKey();
                setOpenaiKey("");
                setKeySaved(false);
              }}
            >
              {da ? "Fjern nøgle" : "Remove key"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Data summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{da ? "Data" : "Data"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>{da ? "Transaktioner" : "Transactions"}</span>
            <span className="font-medium">{transactions.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{da ? "Kategoriseringsregler" : "Categorization rules"}</span>
            <span className="font-medium">{config?.categorizationRules?.length || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{da ? "Budgetposter" : "Budget entries"}</span>
            <span className="font-medium">{config?.budgetEntries?.length || 0}</span>
          </div>

          <Separator />

          {/* Export */}
          <div>
            <h4 className="font-medium text-sm mb-2">{da ? "Eksporter" : "Export"}</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const data = JSON.stringify({ config, transactions }, null, 2);
                const blob = new Blob([data], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `monetos-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              {da ? "Download backup (JSON)" : "Download backup (JSON)"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-negative/30">
        <CardHeader>
          <CardTitle
            className="text-base text-negative cursor-pointer"
            onClick={() => setShowDanger(!showDanger)}
          >
            {da ? "Farezone" : "Danger Zone"} {showDanger ? "▴" : "▾"}
          </CardTitle>
        </CardHeader>
        {showDanger && (
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {da
                  ? "Slet alle transaktioner (beholder konfigurationen)."
                  : "Delete all transactions (keeps configuration)."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-negative border-negative/30 hover:bg-negative/10"
                onClick={() => {
                  if (
                    window.confirm(
                      da
                        ? "Er du sikker? Alle transaktioner slettes."
                        : "Are you sure? All transactions will be deleted."
                    )
                  ) {
                    setTransactions([]);
                  }
                }}
              >
                {da ? "Slet transaktioner" : "Delete transactions"}
              </Button>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {da
                  ? "Nulstil alt. Alle data slettes og du starter forfra. En backup downloades automatisk."
                  : "Reset everything. All data will be deleted and you start fresh. A backup is downloaded automatically."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-negative border-negative/30 hover:bg-negative/10"
                onClick={() => {
                  if (
                    window.confirm(
                      da
                        ? "Er du HELT sikker? ALT data slettes!"
                        : "Are you ABSOLUTELY sure? ALL data will be deleted!"
                    )
                  ) {
                    clearAllData();
                  }
                }}
              >
                {da ? "Nulstil alt" : "Reset everything"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
