import type { Metadata } from "next";
import Link from "next/link";
import {
  Upload,
  Sparkles,
  Wallet,
  Calculator,
  ShieldCheck,
  Github,
  ArrowRight,
  Check,
  X,
} from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://monetos.dk";

export const metadata: Metadata = {
  title: "Spiir alternativ — gratis erstatning når Spiir.dk lukker",
  description:
    "Spiir.dk lukker. Monetos er et gratis, open source alternativ til danske husstande: CSV-import fra Nordea, Danske Bank, Jyske Bank og Lunar, AI-kategorisering, budget, prognose og dansk skatteberegning for 2026. Alt data gemt krypteret lokalt i din browser.",
  alternates: {
    canonical: "/spiir-alternativ",
    languages: {
      "da-DK": "/spiir-alternativ",
      "x-default": "/spiir-alternativ",
    },
  },
  openGraph: {
    type: "website",
    locale: "da_DK",
    url: `${siteUrl}/spiir-alternativ`,
    siteName: "Monetos",
    title: "Spiir alternativ — gratis erstatning når Spiir.dk lukker",
    description:
      "Monetos er et gratis, open source Spiir-alternativ til danske husstande. CSV-import, AI-kategorisering, budget og dansk skatteberegning.",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "Monetos — Spiir-alternativ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spiir alternativ — Monetos",
    description:
      "Spiir.dk lukker — skift til Monetos, et gratis, open source alternativ til danske husstande.",
    images: ["/icon.svg"],
  },
};

const features = [
  {
    icon: Upload,
    color: "info",
    title: "CSV-import fra din bank",
    body: "Indlæs transaktioner direkte fra Nordea, Danske Bank, Jyske Bank, Lunar og andre danske banker. Monetos genkender automatisk formatet.",
  },
  {
    icon: Sparkles,
    color: "primary",
    title: "AI-kategorisering",
    body: "Lad en AI kategorisere dine transaktioner på få sekunder. Vælg mellem OpenAI, OpenRouter eller Gemini — eller brug dine egne regler.",
  },
  {
    icon: Wallet,
    color: "positive",
    title: "Budget & prognose",
    body: "Månedlige, kvartalsvise og årlige budgetposter. Fremskrivninger, afvigelsesanalyse og automatisk detektering af tilbagevendende betalinger.",
  },
  {
    icon: Calculator,
    color: "warning",
    title: "Dansk skatteberegning 2026",
    body: "Bundskat, topskat, kommuneskat, kirkeskat, AM-bidrag, pension, håndværker- og befordringsfradrag — alt baseret på 2026-satserne.",
  },
  {
    icon: ShieldCheck,
    color: "positive",
    title: "100% privat og lokal",
    body: "Al data krypteres med AES-256-GCM og gemmes kun i din browser. Ingen server, ingen tredjepart, ingen tracking.",
  },
  {
    icon: Github,
    color: "info",
    title: "Gratis & open source",
    body: "MIT-licens, fuldt åben kildekode på GitHub. Ingen abonnement, ingen reklamer, ingen skjulte gebyrer — nu og for altid.",
  },
] as const;

const comparison = [
  { feature: "Pris", monetos: "Gratis", spiir: "Lukker" },
  { feature: "Open source", monetos: true, spiir: false },
  { feature: "CSV-import", monetos: true, spiir: true },
  { feature: "AI-kategorisering", monetos: true, spiir: false },
  { feature: "Dansk skat 2026", monetos: true, spiir: false },
  { feature: "Data gemmes lokalt", monetos: true, spiir: false },
  { feature: "Kræver konto", monetos: false, spiir: true },
] as const;

const faqs = [
  {
    q: "Hvorfor lukker Spiir?",
    a: "Spiir.dk har meddelt, at tjenesten lukker. Det efterlader mange danske husstande uden værktøj til at holde styr på privatøkonomien. Monetos er bygget som et gratis, open source alternativ.",
  },
  {
    q: "Er Monetos virkelig gratis?",
    a: "Ja. Monetos er 100% gratis og open source under MIT-licensen. Der er ingen abonnement, ingen reklamer og ingen skjulte gebyrer. Hvis du bruger AI-kategorisering, betaler du kun for dit eget forbrug hos OpenAI, OpenRouter eller Google.",
  },
  {
    q: "Hvor gemmes mine data?",
    a: "Al data gemmes udelukkende i din browser og krypteres med AES-256-GCM via en PIN-kode. Ingen data forlader din enhed — Monetos har ikke engang en server at sende dem til.",
  },
  {
    q: "Hvilke banker understøttes?",
    a: "Monetos understøtter CSV-eksport fra Nordea, Danske Bank, Jyske Bank og Lunar ud af boksen, plus en generisk dansk CSV-parser til andre banker. Kan din bank eksportere CSV, kan Monetos læse den.",
  },
  {
    q: "Kan jeg eksportere mine data igen?",
    a: "Ja. Du kan eksportere en krypteret sikkerhedskopi af dine data når som helst og gendanne den på en anden enhed.",
  },
  {
    q: "Hvordan kommer jeg i gang?",
    a: "Klik på 'Kom i gang', opret en PIN-kode, tilføj din husstand, og importér din første CSV-fil fra banken. Det tager under fem minutter.",
  },
] as const;

const colorClasses: Record<string, string> = {
  info: "bg-info/8 text-info",
  primary: "bg-primary/10 text-primary",
  positive: "bg-positive/8 text-positive",
  warning: "bg-warning/10 text-warning",
};

export default function SpiirAlternativPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-serif text-xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              className="h-8 w-8"
              aria-hidden
            >
              <circle cx="32" cy="32" r="30" fill="currentColor" className="text-primary" />
              <text
                x="32"
                y="42"
                textAnchor="middle"
                fontSize="32"
                fill="white"
                fontFamily="serif"
              >
                M
              </text>
            </svg>
            Monetos
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <a
              href="https://github.com/olelundmaegbaek/monetos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Kom i gang
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-muted/40 text-xs font-medium text-muted-foreground mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-negative animate-pulse" />
            Spiir.dk lukker ned
          </div>
          <h1 className="text-4xl sm:text-6xl font-serif tracking-tight mb-6 leading-tight">
            Spiir lukker — <br className="hidden sm:inline" />
            skift til Monetos
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Gratis, open source privatøkonomi-app til danske husstande.
            CSV-import, AI-kategorisering, budget og dansk skatteberegning —
            alt gemt krypteret i din browser.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-base font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow"
            >
              Kom i gang gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://github.com/olelundmaegbaek/monetos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-border/70 px-6 py-3 rounded-xl text-base font-medium hover:bg-accent transition-colors"
            >
              <Github className="h-4 w-4" />
              Se på GitHub
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            Ingen konto · Ingen tracking · MIT-licens
          </p>
        </section>

        <section className="py-12 border-t border-border/40">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Hvad skete der med Spiir?
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif tracking-tight mb-6">
              Spiir.dk er på vej til at lukke
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Spiir har i mange år hjulpet danske husstande med at få overblik
              over privatøkonomien. Nu lukker tjenesten — og mange står tilbage
              uden et godt dansk alternativ. Monetos er bygget til præcis det:
              fuld kontrol over din økonomi, på dansk, uden abonnement og uden
              at dine data forlader din browser.
            </p>
          </div>
        </section>

        <section className="py-16 border-t border-border/40">
          <div className="text-center mb-12">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Funktioner
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif tracking-tight">
              Alt du havde i Spiir — og mere
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, color, title, body }) => (
              <div
                key={title}
                className="p-6 rounded-xl border border-border/60 bg-card hover:shadow-sm transition-shadow"
              >
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${colorClasses[color]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-medium mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 border-t border-border/40">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Sammenligning
              </p>
              <h2 className="text-3xl sm:text-4xl font-serif tracking-tight">
                Monetos vs. Spiir
              </h2>
            </div>
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left py-3 px-5 text-sm font-medium">Funktion</th>
                    <th className="text-center py-3 px-5 text-sm font-medium text-primary">
                      Monetos
                    </th>
                    <th className="text-center py-3 px-5 text-sm font-medium text-muted-foreground">
                      Spiir
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={i > 0 ? "border-t border-border/40" : ""}
                    >
                      <td className="py-3 px-5 text-sm">{row.feature}</td>
                      <td className="py-3 px-5 text-center">
                        {typeof row.monetos === "boolean" ? (
                          row.monetos ? (
                            <Check className="h-4 w-4 text-positive inline" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground inline" />
                          )
                        ) : (
                          <span className="text-sm font-medium text-positive">
                            {row.monetos}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-center">
                        {typeof row.spiir === "boolean" ? (
                          row.spiir ? (
                            <Check className="h-4 w-4 text-muted-foreground inline" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground inline" />
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {row.spiir}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-border/40">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3">
                FAQ
              </p>
              <h2 className="text-3xl sm:text-4xl font-serif tracking-tight">
                Ofte stillede spørgsmål
              </h2>
            </div>
            <div className="space-y-3">
              {faqs.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-xl border border-border/60 bg-card"
                >
                  <summary className="flex items-center justify-between py-4 px-5 cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">
                    {q}
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-border/40 text-center">
          <h2 className="text-3xl sm:text-5xl font-serif tracking-tight mb-5">
            Start med Monetos i dag
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Ingen konto, ingen betaling, ingen ventetid. Opret en PIN, importér
            din første CSV og få overblik på under fem minutter.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-base font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow"
          >
            Kom i gang gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-border/40 py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Monetos · MIT-licens</p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/olelundmaegbaek/monetos"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <Link href="/" className="hover:text-foreground transition-colors">
              Til appen
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
