# CLAUDE.md — Monetos

## Project overview

Monetos is a free, open-source personal finance app for Danish households. Users import bank CSV transactions, categorize them (rule-based or via AI), budget, forecast, and project Danish taxes — all with data stored locally in the browser (AES-256 encrypted localStorage with PIN).

- **Stack**: Next.js 16 (App Router, static export), React 19, TypeScript (strict), Tailwind CSS 4, shadcn/ui, Recharts, PapaParse
- **Deployment**: Static site (`output: "export"`, no server routes). Hosted on Hostinger.
- **Locale**: Danish primary (`lang="da"`), English secondary. All user-facing text supports both.
- **Currency**: DKK only.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Build static export (uses webpack)
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

- Multi-provider AI support (OpenAI, OpenRouter, Gemini) — fully integrated in settings UI and import flow
- Strict JSON schema output for AI responses
- AbortSignal cancellation for AI requests
- Key sanitization (`sanitizeKeyPart`) preventing separator injection
- Static site architecture — no server routes
- Chart components wrapped in `React.memo` with module-level `formatDKK`
- `useMemo` on derived state in AppProvider (`availableMonths`, `monthTransactions`, `monthlyStats`, `contextValue`)
