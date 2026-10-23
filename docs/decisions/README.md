# Decisions

One short file per decision that changes how Airsc is built: a new core package, a replaced service, a change
of hosting or database. Name it `NNNN-short-title.md`. Write it **before** the change, in the same pull request
as the change.

Why: an agent that writes code fast will happily swap a library or add a service to solve the task in front of
it. The core stack is locked in `stack.lock.json` and `scripts/check-stack.mjs` fails the build when
`package.json` drifts from it, so a change of stack always needs a person to say yes, and this folder says why.

A decision file has:

- **Context**: what problem made the current stack not enough.
- **Options**: at least two, including "keep what we have".
- **Decision**: what we chose and what we give up.
- **Changes**: the files to update with it: `package.json`, `stack.lock.json`, the Tech stack list in
  `src/app/[lang]/admin/pm/content.ts`, the changelog entry.
