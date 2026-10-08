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
