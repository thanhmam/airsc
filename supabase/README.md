# Database (Supabase project `airsc`, ap-southeast-1)

All migrations were applied on 2026-10-06. The initial schema and credit functions
(applied when the project was created) are not in this folder; later ones are.

Key ideas:

- Catalog tables (`resources`, `kits`, `kit_items`) are public-read via RLS.
- All credit logic lives in Postgres `security definer` functions
  (`consume_download`, `consume_kit`, `mcp_download`, `grant_purchase`…), so the
  browser can never change its own balance.
- Server-to-database writes (crawler ingest, Polar webhook) are guarded by a
  random token stored in `private.app_secrets` (`AIRSC_INGEST_TOKEN` env var),
  so the app never needs the Supabase service-role key.
- Free credits: 10 per week, reset Monday 00:00 UTC (lazy reset in `private.credit_state`).
