"use client";

import { useState, useCallback } from "react";
import { useApp } from "@/components/providers/app-provider";
import { isDataEncrypted, enableEncryption, disableEncryption } from "@/lib/stores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CategoryManager } from "@/components/budget/category-manager";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, LockOpen, Upload } from "lucide-react";
import { getAllProviders, getProvider } from "@/lib/ai/provider-registry";
import type { AIProviderType } from "@/lib/ai/types";

export default function SettingsPage() {
  const { config, transactions, setTransactions, locale, setLocale, exportData, importData, aiProviderConfig, setAiProviderConfig, clearAiProviderConfig } = useApp();
  const da = locale === "da";

  const [showDanger, setShowDanger] = useState(false);

  const clearAllData = () => {
    if (typeof window !== "undefined") {
      // Auto-download backup before clearing
      exportData();

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

      {/* Category management */}
      <CategoryManager />

      {/* AI Configuration */}
      <AIProviderSettings
        da={da}
        aiProviderConfig={aiProviderConfig}
        setAiProviderConfig={setAiProviderConfig}
        clearAiProviderConfig={clearAiProviderConfig}
      />

      {/* PIN / Encryption */}
      <PinSettings da={da} />

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
            <Button variant="outline" size="sm" onClick={exportData}>
              {da ? "Download backup (JSON)" : "Download backup (JSON)"}
            </Button>
          </div>

          <Separator />

          {/* Import / Restore */}
          <div>
            <h4 className="font-medium text-sm mb-2">{da ? "Importér backup" : "Import backup"}</h4>
            <RestoreSection da={da} importData={importData} />
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle
            className="text-base text-red-600 cursor-pointer"
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
                className="text-red-600 border-red-200 hover:bg-red-50"
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
                className="text-red-600 border-red-200 hover:bg-red-50"
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

// ── AI Provider Settings ──────────────────────────────────────────

function AIProviderSettings({
  da,
  aiProviderConfig,
  setAiProviderConfig,
  clearAiProviderConfig,
}: {
  da: boolean;
  aiProviderConfig: import("@/lib/ai/types").AIProviderConfig | null;
  setAiProviderConfig: (config: import("@/lib/ai/types").AIProviderConfig) => void;
  clearAiProviderConfig: () => void;
}) {
  const allProviders = getAllProviders();
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType>(
    aiProviderConfig?.provider ?? "openai"
  );
  const provider = getProvider(selectedProvider);
  const [apiKey, setApiKey] = useState(
    aiProviderConfig?.provider === selectedProvider ? (aiProviderConfig?.apiKey ?? "") : ""
  );
  const [selectedModel, setSelectedModel] = useState(
    aiProviderConfig?.provider === selectedProvider ? (aiProviderConfig?.model ?? provider.defaultModel) : provider.defaultModel
  );
  const [keySaved, setKeySaved] = useState(false);

  const handleProviderChange = (value: string) => {
    const newProvider = value as AIProviderType;
    setSelectedProvider(newProvider);
    const p = getProvider(newProvider);
    setSelectedModel(aiProviderConfig?.provider === newProvider ? (aiProviderConfig?.model ?? p.defaultModel) : p.defaultModel);
    setApiKey(aiProviderConfig?.provider === newProvider ? (aiProviderConfig?.apiKey ?? "") : "");
    setKeySaved(false);
  };

  const handleSave = () => {
    setAiProviderConfig({ provider: selectedProvider, apiKey, model: selectedModel });
    setKeySaved(true);
  };

  const handleClear = () => {
    clearAiProviderConfig();
    setApiKey("");
    setKeySaved(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{da ? "AI Kategorisering" : "AI Categorization"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          {da
            ? "Bruges til AI-kategorisering af transaktioner. API-nøglen gemmes kun lokalt i din browser."
            : "Used for AI transaction categorization. API key is stored locally in your browser only."}
        </p>

        {/* Provider selector */}
        <div>
          <Label>{da ? "AI-udbyder" : "AI Provider"}</Label>
          <Select value={selectedProvider} onValueChange={handleProviderChange}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allProviders.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model selector */}
        <div>
          <Label>{da ? "Model" : "Model"}</Label>
          <Select value={selectedModel} onValueChange={(v) => { setSelectedModel(v); setKeySaved(false); }}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {provider.models.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* API key input */}
        <div>
          <Label>{provider.name} API {da ? "nøgle" : "Key"}</Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setKeySaved(false); }}
              placeholder={provider.apiKeyPlaceholder}
              className="font-mono"
            />
            <Button variant="outline" size="sm" onClick={handleSave}>
              {da ? "Gem" : "Save"}
            </Button>
          </div>
          {keySaved && (
            <Badge variant="outline" className="mt-2 text-green-600 border-green-500">
              {da ? "Gemt" : "Saved"}
            </Badge>
          )}
        </div>

        {aiProviderConfig?.apiKey && (
          <Button variant="ghost" size="sm" className="text-red-600" onClick={handleClear}>
            {da ? "Fjern konfiguration" : "Remove configuration"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── PIN Settings ───────────────────────────────────────────────────

function PinSettings({ da }: { da: boolean }) {
  const [encrypted] = useState(() => isDataEncrypted());
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEnable = useCallback(async () => {
    setError(null);
    if (pin.length < 4) {
      setError(da ? "PIN-koden skal være mindst 4 tegn." : "PIN must be at least 4 characters.");
      return;
    }
    if (pin !== pinConfirm) {
      setError(da ? "PIN-koderne matcher ikke." : "PINs don't match.");
      return;
    }
    setIsProcessing(true);
    try {
      await enableEncryption(pin);
      window.location.reload();
    } catch {
      setError(da ? "Kunne ikke aktivere kryptering." : "Failed to enable encryption.");
      setIsProcessing(false);
    }
  }, [pin, pinConfirm, da]);

  const handleDisable = useCallback(async () => {
    setIsProcessing(true);
    try {
      await disableEncryption();
      window.location.reload();
    } catch {
      setError(da ? "Kunne ikke deaktivere kryptering." : "Failed to disable encryption.");
      setIsProcessing(false);
    }
  }, [da]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {encrypted ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
          {da ? "PIN-beskyttelse" : "PIN Protection"}
          {encrypted && (
            <Badge variant="outline" className="text-green-600 border-green-500">
              {da ? "Aktiv" : "Active"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {encrypted ? (
          <>
            <p className="text-sm text-muted-foreground">
              {da
                ? "Dine data er krypteret med AES-256-GCM. Du bliver bedt om PIN ved hver session."
                : "Your data is encrypted with AES-256-GCM. You'll be asked for your PIN each session."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600"
              onClick={handleDisable}
              disabled={isProcessing}
            >
              {da ? "Deaktiver PIN-beskyttelse" : "Disable PIN protection"}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {da
                ? "Aktivér PIN-kode for at kryptere dine data lokalt."
                : "Enable a PIN to encrypt your data locally."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{da ? "PIN-kode" : "PIN"}</Label>
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder={da ? "Mindst 4 tegn" : "Min 4 chars"}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{da ? "Bekræft PIN" : "Confirm PIN"}</Label>
                <Input
                  type="password"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value)}
                  placeholder={da ? "Bekræft" : "Confirm"}
                  className="mt-1"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnable}
              disabled={isProcessing}
              className="gap-2"
            >
              <Lock className="h-4 w-4" />
              {da ? "Aktivér kryptering" : "Enable encryption"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Restore Section ────────────────────────────────────────────────

function RestoreSection({
  da,
  importData,
}: {
  da: boolean;
  importData: (json: string) => boolean;
}) {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleRestore = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImportError(null);
      setImportSuccess(false);

      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result;
        if (typeof text !== "string") {
          setImportError(da ? "Kunne ikke læse filen." : "Could not read file.");
          return;
        }
        const ok = importData(text);
        if (ok) {
          setImportSuccess(true);
        } else {
          setImportError(
            da
              ? "Ugyldig backup-fil. Filen skal indeholde config og transactions."
              : "Invalid backup file. Must contain config and transactions."
          );
        }
      };
      reader.onerror = () => {
        setImportError(da ? "Fejl ved læsning af filen." : "Error reading file.");
      };
      reader.readAsText(file, "utf-8");
    },
    [da, importData]
  );

  return (
    <div className="space-y-2">
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <span className="inline-flex items-center gap-1.5 border rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
          <Upload className="h-4 w-4" />
          {da ? "Vælg backup-fil" : "Choose backup file"}
        </span>
        <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
      </label>
      {importError && <p className="text-sm text-red-600">{importError}</p>}
      {importSuccess && (
        <Badge variant="outline" className="text-green-600 border-green-500">
          {da ? "Backup indlæst!" : "Backup restored!"}
        </Badge>
      )}
    </div>
  );
}
