<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Airsc conventions

- Follow `BRAND.md` for logo, colour, typography and component rules.
- Logo: use `<Logo />` from `src/components/brand/logo.tsx`; official files are in `public/brand/`. Never draw the mark or wordmark with text or CSS.
- Colours: use the tokens in `src/app/globals.css` (`bg-accent`, `text-muted`, `border-line`, …), not raw hex, so light and dark themes both work. Raw hex is only for always-dark panels and illustrations, as listed in `BRAND.md`.
- Type: Geist and Geist Mono only; headings `font-semibold`.
- Copy: every user-facing string lives in `src/lib/i18n.ts` with both `en` and `vi`.
- Deploys: pushing to `main` deploys production on Vercel. Work on a branch and check the preview first.
- X posts: follow `docs/x-posts.md` (the builder's problem first, facts only, one image, the link in the first reply). The rules the writers use are in `src/lib/social/rules.ts`.

## Guardrails (read before changing the stack or finishing a change)

- **Do not change the core stack on your own.** The core packages and services are locked in `stack.lock.json`; `pnpm build` runs `scripts/check-stack.mjs` and fails when `package.json` adds a package that is not listed, drops a core package, or moves one to another major version. Never add, remove, replace or major-upgrade a dependency, and never swap a service (database, auth, hosting, payments, model provider), to make a task easier. If a task seems to need a new library or service, stop and ask; if the answer is yes, write `docs/decisions/NNNN-title.md` first and update `package.json`, `stack.lock.json` and the Tech stack list in the same pull request. Prefer what is already in the stack.
- **Update the product docs in the same pull request as the change.** In `src/app/[lang]/admin/pm/content.ts`: add a `CHANGELOG` entry (EN and VI, with this pull request's number in `pr`), and update `PHASES` and `REQUESTS` (the roadmap) when scope or status changed, `FEATURES` when a feature was added, changed or removed, and `STACK` when a dependency or service changed. The `Product docs` check on GitHub fails a pull request that changes `src/`, a migration, `vercel.ts` or `package.json` without touching that file (label `no-changelog` only for a typo or a pure docs change), and `/admin/pm/changelog` lists every merged pull request that has no entry.
- **Keep the architecture current.** After a change that adds or removes a route, a table, a cron, a workflow or a service, the admin shows Architecture as out of date. Run `/refresh-architecture` (`.claude/commands/refresh-architecture.md`) or press Update architecture; snapshots are added, never edited (`docs/architecture-snapshots.md`).
