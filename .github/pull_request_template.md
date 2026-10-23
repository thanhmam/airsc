## What and why

## Product docs (the check on this pull request fails without the first one)
- [ ] CHANGELOG entry with this PR's number in `src/app/[lang]/admin/pm/content.ts`
- [ ] Roadmap (PHASES, REQUESTS) and FEATURES updated if the scope or the status of something changed
- [ ] STACK updated if a dependency or a service changed

## Guardrails
- [ ] No core package added, removed or moved to another major (`stack.lock.json`); if one was, a file in `docs/decisions` says why
- [ ] A new route, migration, cron or service: run `/refresh-architecture` after merging (the admin shows "out of date" until you do)
