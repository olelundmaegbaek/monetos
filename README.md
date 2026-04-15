# Monetos

**Privatøkonomisk overblik til danske husstande**

[![MIT License](https://img.shields.io/badge/licens-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![Sprog](https://img.shields.io/badge/sprog-dansk-red.svg)](#)

Monetos er en gratis, open source privatøkonomi-app designet til danske husstande. Importer transaktioner fra din bank, kategoriser dem automatisk med AI, og få overblik over dit budget, din skat og dine prognoser — alt sammen krypteret og gemt lokalt i din browser.

## Funktioner

- **CSV-import** fra danske banker (Nordea, Danske Bank, Jyske Bank, Lunar m.fl.)
- **AI-kategorisering** af transaktioner via OpenAI, OpenRouter eller Gemini
- **Regelbaseret kategorisering** med brugerdefinerede regler og prioritering
- **Dansk skatteberegning** — AM-bidrag, bundskat, topskat, kommuneskat, kirkeskat
- **Skatteoptimering** — pension, fradrag, håndværkerfradrag, befordringsfradrag
- **Budgettering** med månedlig, kvartalsvis og årlig frekvens
- **Prognose og fremskrivning** af din økonomi
- **Afvigelsesanalyse** — budget vs. faktisk forbrug
- **Genkendelse af faste udgifter** — automatisk detektering af tilbagevendende transaktioner
- **Husstandsprofil** med voksne og børn
- **Krypteret** — AES-256-GCM kryptering med PIN-kode, alt data gemmes lokalt i browseren

## Teknologi

| Kategori | Teknologi |
|----------|-----------|
| Framework | Next.js 16, React 19 |
| Sprog | TypeScript (strict) |
| Styling | Tailwind CSS 4, shadcn/ui |
| Grafer | Recharts |
| Formularer | React Hook Form, Zod |
| CSV-parsing | PapaParse |
| AI | OpenAI, OpenRouter, Gemini (valgfrit) |
| Kryptering | Web Crypto API (AES-256-GCM, PBKDF2) |
| Datoer | date-fns |

## Kom i gang

### Forudsætninger

- [Node.js](https://nodejs.org) 18 eller nyere
- npm (følger med Node.js)

### Installation

```bash
git clone https://github.com/olelundmaegbaek/monetos.git
cd monetos
npm install
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000) i din browser. Ved første besøg vises en opsætningsguide til din husstand.

### AI-kategorisering (valgfrit)

For automatisk kategorisering af transaktioner med AI kan du tilføje din API-nøgle under **Indstillinger** i appen. Monetos understøtter OpenAI, OpenRouter og Gemini. Nøglen gemmes kun lokalt i din browser.

## Projektstruktur

```
src/
├── app/              # Next.js App Router (sider og layout)
│   ├── (dashboard)/  # Dashboard-sider (budget, skat, transaktioner m.m.)
│   └── setup/        # Opsætningsguide
├── components/       # React-komponenter
│   ├── ui/           # shadcn/ui basiskomponenter
│   ├── charts/       # Grafer og visualiseringer
│   ├── layout/       # Sidebar, navigation
│   ├── budget/       # Budget-komponenter
│   └── vault/        # PIN-kode og kryptering
├── lib/              # Forretningslogik
│   ├── csv/          # CSV-parsing, regel- og AI-kategorisering
│   └── tax/          # Dansk skatteberegning
├── config/           # Kategori- og skattekonfiguration
└── types/            # TypeScript-typer
```

## Bidrag

Vi tager gerne imod bidrag! Læs [CONTRIBUTING.md](CONTRIBUTING.md) for at komme i gang.

## Licens

MIT — se [LICENSE](LICENSE) for detaljer.
