<img src="public/brand/airsc-logo.svg" alt="Airsc" height="48">

The safety-checked library of AI agent resources (Claude skills, MCP servers, Claude Code
plugins, subagents, Cursor rules) for vibe coders. Search is free; downloads use credits
(10 free per week, packs of 100 / 1,000, or unlimited Full-time Access).

Production: https://airsc.vercel.app

## Stack

| Part | Tech |
| --- | --- |
| Web | Next.js 16 App Router, Tailwind 4, EN at `/`, VI at `/vi` (`src/proxy.ts`) |
| DB + auth | Supabase project `airsc` (Postgres + magic-link auth), see `supabase/README.md` |
| Crawler | GitHub search + tree + raw files → safety scan → install config → AI summary/translation (`src/lib/crawler`) |
| AI (internal only) | Vercel AI Gateway, `AIRSC_ENRICH_MODEL` (default `anthropic/claude-sonnet-5.5`) |
| Airsc MCP | `src/app/api/mcp/route.ts` (mcp-handler), key via `Authorization: Bearer airsc_…` or `?key=` |
| Payments | Ko-fi donations (`src/app/api/webhooks/kofi`) and Pro membership via Polar.sh: checkout and billing portal are server actions in `src/app/actions.ts`, webhook in `src/app/api/webhooks/polar` |
| Content Engine | Vercel Workflow `src/workflows/content-engine.ts`, daily 02:00 UTC via `/api/cron/pipeline` |

## Brand and UI

Logo kit, colours, typography and component rules are in [BRAND.md](BRAND.md). In short: use
`<Logo />` from `src/components/brand/logo.tsx` (never redraw the mark), Violet `#5A3DF0` /
Violet 400 `#8F7BFF` / Ink `#111113` / Paper `#FAFAF7` through the tokens in `src/app/globals.css`,
and Geist / Geist Mono for type.

## Content Engine (automated content)

Six agents run as one durable Vercel Workflow (each step is checkpointed and retried):

| Agent | File | Does |
| --- | --- | --- |
| Scout | `src/lib/engine/agents/scout.ts` | GitHub topics + code search, MCP Registry, npm, awesome-lists → new/updated repos (remembers rejected repos for 14 days) |
| Analyst | `src/lib/crawler/run.ts` (`analyse`) | Reads the repo tree and files, safety scan, one-click install config |
| Curator | `src/lib/engine/agents/curator.ts` | Relevance, category, tags, level, quality 0-100, EN/VI summary + use cases; auto-publish gate |
| Producer | `src/lib/engine/agents/producer.ts` | 6-scene animated explainer script + example prompts (played with Remotion Player) |
| Demo | `src/lib/engine/agents/demo.ts` | Starts npx MCP servers in Vercel Sandbox and records their real tool list |
| Editor | `src/lib/engine/agents/editor.ts` | Category guides `/guides/best-*` and weekly digest `/guides/new-YYYY-wNN` |

Publishing rule: relevant + quality ≥ 40 + not rated danger → published; otherwise review queue (`/admin`) or hidden.
Admin (`ADMIN_EMAILS`) can watch runs, approve/hide, and start a run at `/admin`.

```bash
# manual run (local dev server or production), e.g. content only with small limits
curl -X POST $SITE/api/admin/pipeline -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"skipScout":true,"maxCurate":20,"maxProduce":4,"maxDemo":2,"maxPages":1}'
npx workflow inspect runs --backend vercel --project airsc --team thanhmams-projects
```

## Local development

```bash
pnpm install
vercel env pull .env.local   # or copy the variables below
pnpm dev
```

Crawl locally (uses your GitHub CLI token):

```bash
GITHUB_TOKEN=$(gh auth token) pnpm crawl              # full crawl (~1,000 repos, ~25 min)
GITHUB_TOKEN=$(gh auth token) pnpm crawl --limit 20   # quick test
```

## Environment variables

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase project |
| `AIRSC_INGEST_TOKEN` | Guards crawler ingest + purchase grants (matches `private.app_secrets`) |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME` | Canonical URL and brand name |
| `GITHUB_TOKEN` | Fine-grained PAT (public repo read) for the daily cron crawl |
| `AIRSC_MODEL_FAST` / `AIRSC_MODEL_SMART` | Agent models (default `anthropic/claude-sonnet-5.5` / `anthropic/claude-opus-5.5`) |
| `AIRSC_MODEL_FALLBACK` / `AIRSC_ENRICH_MODEL` | Used when the primary model is unavailable (default `google/gemini-2.5-flash`) |
| `ADMIN_EMAILS` | Comma-separated emails allowed into `/admin` |
| `CRON_SECRET` | Vercel cron auth |
| `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_SERVER` | Polar.sh (`sandbox` or `production`) |
| `POLAR_DISCOUNT_PRO` | Polar id of the launch discount (percentage off, limited redemptions). Applied at checkout while it is running; the pricing page reads price and seats left from Polar |
| `POLAR_PRODUCT_PRO`, `POLAR_BENEFIT_PRO` | Polar Pro product id; id of the feature-flag benefit attached to it (the upgrade button stays hidden until `POLAR_PRODUCT_PRO` is set). The product's price in Polar is the regular price |

Polar webhook: URL `https://airsc.vercel.app/api/webhooks/polar`, format Raw, API version 2026-04, events `customer.state_changed` (Pro on/off), `order.paid` and `order.refunded` (payments in `/admin/payments`; the Sync from Polar button backfills). Customers are Airsc user ids (`external_customer_id`); the webhook re-reads the customer's state and sets `profiles.fulltime` (Pro) through the `set_pro` RPC.
