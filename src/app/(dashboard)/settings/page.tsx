"use client";

import { useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CategoryManager } from "@/components/budget/category-manager";
import { saveAiConfig, loadAiConfig, clearAiConfig } from "@/lib/store";
import { AI_PROVIDERS } from "@/lib/csv/ai-providers";
import { AIProvider } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { ChangePinDialog } from "@/components/vault/change-pin-dialog";

export default function SettingsPage() {
  const { config, transactions, setTransactions, locale, setLocale } = useApp();
  const da = locale === "da";

  const [showDanger, setShowDanger] = useState(false);
  const [savedConfig] = useState(() => loadAiConfig());
  const [provider, setProvider] = useState<AIProvider>(savedConfig?.provider ?? "openai");
  const [localApiKey, setLocalApiKey] = useState(savedConfig?.apiKey ?? "");
  const [localModel, setLocalModel] = useState(savedConfig?.model ?? "");
  const [keySaved, setKeySaved] = useState(false);
  const providerDef = AI_PROVIDERS[provider];

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
                  ? "Indtaster du en API-nøgle, vil dine transaktioner blive sendt til den valgte AI-udbyder ved automatisk kategorisering. Dataen forlader din enhed. Slet nøglen for at deaktivere funktionen."
                  : "If you enter an API key, your transactions will be sent to the selected AI provider when auto-categorizing. The data leaves your device. Delete the key to disable the feature."}
              </p>
            </div>
          </div>

          {/* Provider selector */}
          <div>
            <Label>{da ? "AI-udbyder" : "AI Provider"}</Label>
            <Select
              value={provider}
              onValueChange={(v) => {
                setProvider(v as AIProvider);
                setLocalApiKey("");
                setLocalModel("");
                setKeySaved(false);
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(AI_PROVIDERS) as AIProvider[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {AI_PROVIDERS[key].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API key */}
          <div>
            <Label>{da ? "API-nøgle" : "API Key"}</Label>
            <p className="text-xs text-muted-foreground mb-2">
              {da
                ? "Nøglen gemmes lokalt i din browser i klartekst."
                : "The key is stored locally in your browser in plaintext."}
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                value={localApiKey}
                onChange={(e) => {
                  setLocalApiKey(e.target.value);
                  setKeySaved(false);
                }}
                placeholder={providerDef.placeholder}
                className="font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  saveAiConfig({
                    provider,
                    apiKey: localApiKey,
                    model: localModel.trim() || undefined,
                  });
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

          {/* Model override */}
          <div>
            <Label>{da ? "Model (valgfrit)" : "Model (optional)"}</Label>
            <Input
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              placeholder={providerDef.defaultModel}
              className="font-mono mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {da
                ? `Standard: ${providerDef.defaultModel}`
                : `Default: ${providerDef.defaultModel}`}
            </p>
          </div>

          {localApiKey && (
            <Button
              variant="ghost"
              size="sm"
              className="text-negative"
              onClick={() => {
                clearAiConfig();
                setLocalApiKey("");
                setLocalModel("");
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
            <div className="flex gap-3 p-3 mb-3 rounded-lg border border-warning/40 bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium text-foreground">
                  {da
                    ? "Backup-filen er IKKE krypteret"
                    : "Backup file is NOT encrypted"}
                </p>
                <p className="text-muted-foreground">
                  {da
                    ? "JSON-filen indeholder alle dine husstands- og transaktionsdata i klartekst — din PIN-kode beskytter den ikke. Opbevar filen et sikkert sted (krypteret disk, password-manager vault, eller læg den i et krypteret arkiv inden den lægges i cloud-storage)."
                    : "The JSON file contains all your household and transaction data in plaintext — your PIN does not protect it. Keep the file in a safe place (encrypted disk, password manager vault, or put it in an encrypted archive before uploading to cloud storage)."}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (
                  !window.confirm(
                    da
                      ? "Den downloadede JSON-fil er ikke krypteret og kan læses af alle der har adgang til filen. Fortsæt?"
                      : "The downloaded JSON file is not encrypted and can be read by anyone with access to it. Continue?",
                  )
                ) {
                  return;
                }
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
              {da ? "Download backup (JSON, ukrypteret)" : "Download backup (JSON, unencrypted)"}
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
                  ? "Nulstil alt. Alle data slettes og du starter forfra. En UKRYPTERET JSON-backup downloades automatisk inden sletningen — den indeholder alle dine data i klartekst."
                  : "Reset everything. All data will be deleted and you start fresh. An UNENCRYPTED JSON backup is automatically downloaded before deletion — it contains all your data in plaintext."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-negative border-negative/30 hover:bg-negative/10"
                onClick={() => {
                  if (
                    window.confirm(
                      da
                        ? "Er du HELT sikker? ALT data slettes, og en UKRYPTERET backup downloades først. Opbevar filen sikkert."
                        : "Are you ABSOLUTELY sure? ALL data will be deleted, and an UNENCRYPTED backup will be downloaded first. Store the file securely."
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
