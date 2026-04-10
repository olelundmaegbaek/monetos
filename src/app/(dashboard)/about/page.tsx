"use client";

import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitHubIcon } from "@/components/icons/github";
import { ShieldCheck, Coins, ExternalLink } from "lucide-react";

export default function AboutPage() {
  const { locale } = useApp();
  const da = locale === "da";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">
        {da ? "Om Monetos" : "About Monetos"}
      </h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Coins className="h-8 w-8 text-emerald-600" />
            <CardTitle className="text-xl">monetos.me</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {da
              ? "monetos.me er en 100% gratis, open source privatøkonomi-app designet til danske husstande. Importer transaktioner fra din bank, kategoriser dem automatisk med AI, og få overblik over dit budget, din skat og dine prognoser."
              : "monetos.me is a 100% free, open source personal finance app designed for Danish households. Import transactions from your bank, categorize them automatically with AI, and get an overview of your budget, taxes, and forecasts."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <CardTitle>{da ? "Privatliv & sikkerhed" : "Privacy & security"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            {da
              ? "Al data gemmes udelukkende i din browsers localStorage — intet sendes til en server, og dine oplysninger forlader aldrig din enhed."
              : "All data is stored exclusively in your browser's localStorage — nothing is sent to a server, and your information never leaves your device."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{da ? "Funktioner" : "Features"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              {da
                ? "CSV-import fra danske banker"
                : "CSV import from Danish banks"}
            </li>
            <li>
              {da
                ? "AI-kategorisering af transaktioner"
                : "AI categorization of transactions"}
            </li>
            <li>
              {da
                ? "Dansk skatteberegning — AM-bidrag, bundskat, topskat, kommuneskat, kirkeskat"
                : "Danish tax calculation — AM-bidrag, bundskat, topskat, kommuneskat, kirkeskat"}
            </li>
            <li>
              {da
                ? "Skatteoptimering — pension, fradrag, håndværkerfradrag"
                : "Tax optimization — pension, deductions, handyman deductions"}
            </li>
            <li>
              {da
                ? "Budgettering med månedlig, kvartalsvis og årlig frekvens"
                : "Budgeting with monthly, quarterly, and annual frequency"}
            </li>
            <li>
              {da
                ? "Prognose og fremskrivning af din økonomi"
                : "Forecasting and financial projections"}
            </li>
            <li>
              {da
                ? "Afvigelsesanalyse — budget vs. faktisk forbrug"
                : "Variance analysis — budget vs. actual spending"}
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{da ? "Teknologi" : "Technology"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-muted-foreground">Framework</div>
            <div>Next.js 16, React 19</div>
            <div className="text-muted-foreground">{da ? "Sprog" : "Language"}</div>
            <div>TypeScript</div>
            <div className="text-muted-foreground">Styling</div>
            <div>Tailwind CSS 4, shadcn/ui</div>
            <div className="text-muted-foreground">{da ? "Grafer" : "Charts"}</div>
            <div>Recharts</div>
            <div className="text-muted-foreground">AI</div>
            <div>OpenAI, Gemini, OpenRouter</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitHubIcon className="h-5 w-5" />
            <CardTitle>{da ? "Open source" : "Open source"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            {da
              ? "monetos.me er open source under MIT-licensen. Du kan bidrage, rapportere fejl eller hoste din egen server."
              : "monetos.me is open source under the MIT license. You can contribute, report bugs, or self-host your own server."}
          </p>
          <a
            href="https://github.com/olelundmaegbaek/monetos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
          >
            <GitHubIcon className="h-4 w-4" />
            github.com/olelundmaegbaek/monetos
            <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center pb-4">
        {da ? "Licens: MIT" : "License: MIT"}
      </p>
    </div>
  );
}
