"use client";

import { useApp } from "@/components/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const APP_VERSION = "0.1.0";

export default function AboutPage() {
  const { locale } = useApp();
  const da = locale === "da";

  const techInfo: { labelDA: string; labelEN: string; value: string }[] = [
    { labelDA: "Version", labelEN: "Version", value: APP_VERSION },
    { labelDA: "Ramme", labelEN: "Framework", value: "Next.js 16" },
    { labelDA: "Brugergrænseflade", labelEN: "UI", value: "React 19 + Tailwind CSS 4 + shadcn/ui" },
    { labelDA: "Ikoner", labelEN: "Icons", value: "lucide-react" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-3xl font-serif tracking-tight">{da ? "Om Monetos" : "About Monetos"}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{da ? "Hvad er Monetos?" : "What is Monetos?"}</CardTitle>
          <CardDescription>
            {da ? "Et personligt økonomistyringsværktøj" : "A personal finance tool"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            {da
              ? "Monetos er et personligt økonomistyringsværktøj til danske husstande. Det hjælper med budget, indkomst, udgifter, skatteberegning for 2026 og giver et samlet overblik over husstandens økonomi."
              : "Monetos is a personal finance tool for Danish households. It helps with budgeting, income, expenses, Danish tax calculations for 2026, and provides a unified overview of your household finances."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {da ? "Version & teknisk info" : "Version & technical info"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border">
            {techInfo.map((item) => (
              <div
                key={item.labelEN}
                className="grid grid-cols-[140px_1fr] gap-3 py-2 first:pt-0 last:pb-0 text-sm"
              >
                <dt className="font-medium">{da ? item.labelDA : item.labelEN}</dt>
                <dd className="text-muted-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
