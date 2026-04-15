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
import { AlertTriangle, ShieldCheck, Upload } from "lucide-react";
import { pickBackupFile } from "@/lib/backup";
import { ChangePinDialog } from "@/components/vault/change-pin-dialog";

export default function SettingsPage() {
  const { config, transactions, setTransactions, setConfig, locale, setLocale } = useApp();
  const da = locale === "da";

  const [showDanger, setShowDanger] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [savedConfig] = useState(() => loadAiConfig());
  const [provider, setProvider] = useState<AIProvider>(savedConfig?.provider ?? "openai");
  const [localApiKey, setLocalApiKey] = useState(savedConfig?.apiKey ?? "");
  const [localModel, setLocalModel] = useState(savedConfig?.model ?? "");
  const [localBaseUrl, setLocalBaseUrl] = useState(savedConfig?.baseUrl ?? "");
  const [keySaved, setKeySaved] = useState(false);
  const providerDef = AI_PROVIDERS[provider];
  const isLocal = providerDef.local ?? false;

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
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      // Verify the user actually got the backup before wiping data
      setTimeout(() => {
        if (
          window.confirm(
            da
              ? "Blev backup-filen downloadet korrekt? Klik OK for at slette alle data, eller Annuller for at afbryde."
              : "Was the backup file downloaded successfully? Click OK to delete all data, or Cancel to abort."
          )
        ) {
          localStorage.clear();
          window.location.href = "/";
        }
      }, 500);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-3xl font-serif tracking-tight">{da ? "Indstillinger" : "Settings"}</h2>

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
          {isLocal ? (
            <div className="flex gap-3 p-3 rounded-lg border border-positive/40 bg-positive/10">
              <ShieldCheck className="h-5 w-5 text-positive shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium text-foreground">
                  {da ? "Lokal AI — data forbliver på din enhed" : "Local AI — data stays on your device"}
                </p>
                <p className="text-muted-foreground">
                  {da
                    ? "Transaktioner sendes kun til din lokale LLM-server. Intet forlader din enhed."
                    : "Transactions are only sent to your local LLM server. Nothing leaves your device."}
                </p>
              </div>
            </div>
          ) : (
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
          )}

          {/* Provider selector */}
          <div>
            <Label>{da ? "AI-udbyder" : "AI Provider"}</Label>
            <Select
              value={provider}
              onValueChange={(v) => {
                setProvider(v as AIProvider);
                setLocalApiKey("");
                setLocalModel("");
                setLocalBaseUrl("");
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

          {/* Server URL (local providers) */}
          {isLocal && (
            <div>
              <Label>{da ? "Server-URL" : "Server URL"}</Label>
              <Input
                value={localBaseUrl}
                onChange={(e) => {
                  setLocalBaseUrl(e.target.value);
                  setKeySaved(false);
                }}
                placeholder={providerDef.defaultBaseUrl}
                className="font-mono mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {da
                  ? `Standard: ${providerDef.defaultBaseUrl}`
                  : `Default: ${providerDef.defaultBaseUrl}`}
              </p>
            </div>
          )}

          {/* API key (cloud providers only) */}
          {!isLocal && (
            <div>
              <Label>{da ? "API-nøgle" : "API Key"}</Label>
              <p className="text-xs text-muted-foreground mb-2">
                {da
                  ? "Nøglen gemmes lokalt i din browser i klartekst."
                  : "The key is stored locally in your browser in plaintext."}
              </p>
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
            </div>
          )}

          {/* Model */}
          <div>
            <Label>{da ? (isLocal ? "Model" : "Model (valgfrit)") : (isLocal ? "Model" : "Model (optional)")}</Label>
            <Input
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              placeholder={providerDef.defaultModel || (da ? "f.eks. llama3.2" : "e.g. llama3.2")}
              className="font-mono mt-1"
            />
            {providerDef.defaultModel && (
              <p className="text-xs text-muted-foreground mt-1">
                {da
                  ? `Standard: ${providerDef.defaultModel}`
                  : `Default: ${providerDef.defaultModel}`}
              </p>
            )}
          </div>

          {/* Save / clear */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                saveAiConfig({
                  provider,
                  apiKey: isLocal ? "local" : localApiKey,
                  model: localModel.trim() || undefined,
                  baseUrl: localBaseUrl.trim() || undefined,
                });
                setKeySaved(true);
              }}
              disabled={!isLocal && !localApiKey}
            >
              {da ? "Gem" : "Save"}
            </Button>
            {(localApiKey || isLocal) && keySaved && (
              <Badge variant="outline" className="text-positive border-positive self-center">
                {da ? "Gemt" : "Saved"}
              </Badge>
            )}
          </div>

          {(localApiKey || keySaved) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-negative"
              onClick={() => {
                clearAiConfig();
                setLocalApiKey("");
                setLocalModel("");
                setLocalBaseUrl("");
                setKeySaved(false);
              }}
            >
              {da ? (isLocal ? "Fjern konfiguration" : "Fjern nøgle") : (isLocal ? "Remove configuration" : "Remove key")}
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
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              {da ? "Download backup (JSON, ukrypteret)" : "Download backup (JSON, unencrypted)"}
            </Button>

            <Separator className="my-4" />

            <h4 className="font-medium text-sm mb-2">{da ? "Gendan fra backup" : "Restore from backup"}</h4>
            <p className="text-sm text-muted-foreground mb-2">
              {da
                ? "Indlæs en tidligere eksporteret JSON-backup. Dette erstatter dine nuværende data."
                : "Load a previously exported JSON backup. This replaces your current data."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={async () => {
                const backup = await pickBackupFile();
                if (!backup) {
                  setRestoreStatus(
                    da ? "Ugyldig eller tom backup-fil." : "Invalid or empty backup file."
                  );
                  return;
                }
                const { txCount, budgetCount, ruleCount } = backup;
                const summary = da
                  ? `Gendannelse vil erstatte dine data med:\n• ${txCount} transaktioner\n• ${budgetCount} budgetposter\n• ${ruleCount} kategoriseringsregler\n\nFortsæt?`
                  : `Restore will replace your data with:\n• ${txCount} transactions\n• ${budgetCount} budget entries\n• ${ruleCount} categorization rules\n\nContinue?`;
                if (!window.confirm(summary)) return;
                if (backup.config) setConfig(backup.config);
                if (backup.transactions) setTransactions(backup.transactions);
                setRestoreStatus(
                  da
                    ? `Gendannet: ${txCount} transaktioner, ${budgetCount} budgetposter, ${ruleCount} regler.`
                    : `Restored: ${txCount} transactions, ${budgetCount} budget entries, ${ruleCount} rules.`
                );
              }}
            >
              <Upload className="h-4 w-4" />
              {da ? "Gendan fra backup" : "Restore from backup"}
            </Button>
            {restoreStatus && (
              <p className="text-sm mt-2 text-muted-foreground whitespace-pre-line">{restoreStatus}</p>
            )}
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
