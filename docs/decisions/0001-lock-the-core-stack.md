# 0001 Lock the core stack

**Date:** 2026-10-23. **Status:** accepted.

## Context

Airsc is built mostly by prompting an agent. Left alone, an agent changes the stack to fit the task: another
UI library, another way to call a model, a second payment SDK. Each change is small and works today, and
together they leave a product nobody chose and nobody can keep in their head.

## Options

1. Trust review of each pull request. Dependency changes are easy to miss in a large diff.
2. Lock the core stack in a file and fail the build when `package.json` drifts from it.
3. Do nothing and clean up later.

## Decision

Option 2. `stack.lock.json` lists the core packages with the major version each must stay on, and the other
packages we allow. `scripts/check-stack.mjs` runs before every build (`pnpm build`), so a Vercel preview or
production deploy of a drifting `package.json` fails. Minor and patch updates of a locked package pass.
AGENTS.md tells agents not to change the stack without asking.

We give up some speed when a package really should change: it now costs a decision file and a lock update in the
same pull request.

## Changes

`stack.lock.json`, `scripts/check-stack.mjs`, the `build` and `check:stack` scripts, the Tech stack page in
`/admin/pm/stack`, AGENTS.md.
