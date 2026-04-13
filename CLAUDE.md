# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Monetos is a free, open-source personal finance app for Danish households. Users import bank CSV transactions, categorize them (rule-based or via AI), budget, forecast, and project Danish taxes — all with data stored locally in the browser (AES-256 encrypted localStorage with PIN).

- **Stack**: Next.js 16 (App Router, static export), React 19, TypeScript (strict), Tailwind CSS 4, shadcn/ui, Recharts, PapaParse, React Hook Form + Zod
- **Deployment**: Static site (`output: "export"`, `trailingSlash: true`, no server routes). Hosted on Hostinger.
- **Locale**: Danish primary (`lang="da"`), English secondary. All user-facing text supports both.
- **Currency**: DKK only.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Build static export (uses webpack) + postbuild verification
npm run lint         # ESLint
npx tsc --noEmit     # Type-check
```

## Architecture

### Directory layout

```
src/
  app/                  # Next.js App Router pages
    (dashboard)/        # Main app pages (sidebar + month selector layout)
    setup/              # Onboarding wizard
  components/
    ui/                 # shadcn/ui primitives
    charts/             # Recharts wrappers (all React.memo'd)
    layout/             # Sidebar, MonthSelector
    budget/             # Budget row components, category dialog
    vault/              # PIN entry, unlock, change-PIN
    providers/          # AppProvider (React Context)
  lib/
    csv/                # CSV parsing and AI categorization pipeline
      parser.ts         # Multi-bank CSV parser (auto-detects Nordea, Danske Bank, Jyske Bank, Lunar, etc.)
      categorizer.ts    # Rule-based categorizer with ReDoS protection
      ai-categorizer.ts # Multi-provider AI categorization (dedup, schema, abort)
      ai-providers.ts   # Provider definitions (OpenAI, OpenRouter, Gemini)
    tax/                # Danish tax calculator (2026 rates)
    store.ts            # Encrypted localStorage with write queue
    crypto.ts           # Web Crypto API (AES-256-GCM, PBKDF2)
    forecast.ts         # Budget forecasting and projections
    recurring-detection.ts  # Recurring transaction pattern detection
    variance.ts         # Budget vs actual variance analysis
  config/
    categories.ts       # 50+ default categories with DA/EN names, icons, colors
    category-groups.ts  # Grouped categories for UI
    tax-2026.ts         # Danish tax constants (kommuneskat, kirkeskat, etc.)
  types/
    index.ts            # All TypeScript types (~300 lines)
```

### State management

Single React Context (`AppProvider`) with `useMemo`'d context value. All state persists to encrypted localStorage via a fire-and-forget write queue. No Redux/Zustand — the app was migrated away from Zustand back to Context.

### CSV + AI pipeline

1. **Parse**: `parser.ts` auto-detects the bank from CSV headers (Nordea, Danske Bank, Jyske Bank, Lunar, generic Danish), normalizes dates and amounts, returns `ParseResult` with transactions + detected bank name
2. **Rule categorize**: `categorizer.ts` applies user-defined regex rules with priority sorting
3. **AI categorize**: `ai-categorizer.ts` deduplicates transactions by name+description, sends to selected AI provider with strict JSON schema, maps results back
4. **Providers**: `ai-providers.ts` defines OpenAI (Chat Completions), OpenRouter, and Gemini — each with their own URL, headers, body format, and response extractor

The AI categorizer sends all patterns in a single API call (no batching).

### Vault / encryption

- PIN-based encryption using Web Crypto API (PBKDF2 key derivation, AES-256-GCM)
- Vault key held in memory only — cleared on page reload or explicit lock
- PIN is never stored; a verifier hash validates it

## Design system — Nordic Precision

Defined in `globals.css`. All pages (including setup/onboarding) must use this system consistently.

- **Color model**: OKLCH throughout. Light theme uses warm cream base (`oklch(0.98 0.004 75)`), dark theme uses deep indigo (`oklch(0.14 0.012 265)`)
- **Primary**: Deep indigo (`oklch(0.42 0.14 265)`)
- **Semantic colors**: `positive` (green), `negative` (red), `info` (blue), `warning` (amber) — used for icon backgrounds (`bg-positive/8`), text (`text-negative`), and borders
- **Fonts** (loaded in `layout.tsx`):
  - **Plus Jakarta Sans** (`font-sans`) — body text, labels, UI
  - **Instrument Serif** (`font-serif`) — page titles, monetary values, card titles, branding
  - **Geist Mono** (`font-mono`) — code/numeric displays
- **Typography patterns**:
  - Page headings: `text-3xl font-serif tracking-tight`
  - Card section titles: `text-sm font-medium uppercase tracking-wider text-muted-foreground`
  - Monetary values: `font-serif` with semantic color (`text-positive` / `text-negative`)
- **Icon containers**: `h-10 w-10 rounded-xl bg-{color}/8` with `text-{color}` icon inside
- **Noise texture**: SVG fractal noise overlay on `body::before` (0.018 opacity light, 0.035 dark)
- **Border radius**: `--radius: 0.875rem` (14px) — larger than typical, use `rounded-xl` for emphasis
- **Sidebar**: Dedicated CSS variables (`--sidebar`, `--sidebar-border`, etc.) with warm cream (light) / dark indigo (dark)

## Key conventions

- All amounts: negative = expense, positive = income
- Dates: ISO format `"YYYY-MM-DD"` strings throughout
- Month keys: `"YYYY-MM"` format for filtering and selection
- Category IDs: lowercase snake_case (`"groceries"`, `"sub_tech"`, `"other_income"`)
- Danish number format: `1.234,56` (dot = thousands, comma = decimal)
- Budget entries: `monthlyAmount` stores the actual payment amount for the frequency (monthly amount for monthly, quarterly amount for quarterly, yearly amount for yearly)

## Known limitations

- AI categorization has no batching — large imports (500+ unique patterns) may hit token limits
- No progress feedback during AI categorization (lost during architecture migration)
- The `openai` npm package is installed but unused (AI calls use raw `fetch`)
- Some banks (older exports) may use Latin-1 encoding — the app reads as UTF-8 only

## Things to preserve

- Nordic Precision design system — OKLCH palette, serif headings, semantic icon containers, noise overlay. Apply consistently across all pages including setup
- Multi-provider AI support (OpenAI, OpenRouter, Gemini) — fully integrated in settings UI and import flow
- Strict JSON schema output for AI responses
- AbortSignal cancellation for AI requests
- Key sanitization (`sanitizeKeyPart`) preventing separator injection
- Static site architecture — no server routes
- Chart components wrapped in `React.memo` with module-level `formatDKK`
- `useMemo` on derived state in AppProvider (`availableMonths`, `monthTransactions`, `monthlyStats`, `contextValue`)
