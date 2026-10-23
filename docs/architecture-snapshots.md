# Architecture snapshots

The diagrams in `/admin/pm/architecture` are drawn from the code with [Archify](https://github.com/tt-a1i/archify)
and kept as **dated snapshots**. A refresh adds a new snapshot; it never edits or removes an older one, so the page
doubles as the history of how the system grew.

## Where things are

```
src/lib/pm/diagrams/
  snapshots.json                 the registry, newest first (id, date, commit, a note in EN/VI, the diagrams)
  snapshots/<date>-<commit>/
    <name>.html                  one self-contained diagram, served to admins by /api/admin/diagram/<name>?v=<id>
    source/<name>.json           the Archify JSON it was rendered from; the next refresh starts from it
```

## How the admin knows the diagrams are out of date

The page compares `main` on GitHub with the commit of the newest snapshot (`src/lib/pm/github.ts`, public reads,
cached ten minutes). It calls the diagrams **out of date** when, since that commit, there is a new migration, a file
added or removed in the API routes, workflows or libraries, a change to `vercel.ts` or the dependencies, or ten or
more files changed in those areas. The nav then shows a badge on Architecture with the number of merged pull
requests since, and the page says what changed. An ordinary UI change does not trigger it.

## Updating

- **From the admin:** the **Update architecture** button on the page starts the `Refresh architecture` workflow on
  GitHub. Claude runs Archify from `.claude/commands/refresh-architecture.md`, the workflow opens a pull request
  titled `Architecture snapshot`, you look at it on the preview and merge. Takes about 15 to 30 minutes and a
  few dollars of Claude usage.
- **From Claude Code:** run `/refresh-architecture` on a branch, commit, open a pull request (same recipe, same
  result).

### One-time setup for the button

1. GitHub: Settings → Secrets and variables → Actions → New repository secret `ANTHROPIC_API_KEY`.
2. GitHub: create a fine-grained personal access token for the repository `thanhmam/airsc` with **Actions: Read and
   write**, nothing else.
3. Vercel: add it as `GITHUB_DISPATCH_TOKEN`, **Production** only (it can start workflows).
4. GitHub: create the label `no-changelog` (the update pull request carries it).

Without step 3 the button is off and the page shows the command to run in Claude Code instead. The workflow
(`.github/workflows/refresh-architecture.yml`) has not run yet: expect to adjust it after the first run.

## Rules

- Never edit or delete an older snapshot or its registry entry.
- A snapshot shows only what is in the code. If it cannot be found there, it is not in the diagram.
- After merging a structural change (a route, a migration, a cron, a new service) refresh the architecture, or press
  the button when the badge shows.
