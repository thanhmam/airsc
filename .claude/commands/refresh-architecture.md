---
description: Redraw the architecture diagrams with Archify and add a dated snapshot (earlier snapshots are kept)
---

Refresh the architecture diagrams shown in /admin/pm/architecture. The history is the point: add a new snapshot,
never edit or delete an older one. Archify is the skill in `.claude/skills/archify` or `~/.claude/skills/archify`;
read its SKILL.md and `references/repository-authoring.md` first and follow them (commands as
`node <archify>/bin/archify.mjs …`). Work on a branch, never on main.

1. **Identify the snapshot.** Make sure you are on the latest main (`git pull`). `DATE` = today in Vietnam
   (`TZ=Asia/Ho_Chi_Minh date +%F`), `REV` = `git rev-parse --short HEAD`, the snapshot id is `<DATE>-<REV>`. If
   `src/lib/pm/diagrams/snapshots/<id>` already exists, stop and say so.

2. **Start from the previous snapshot, not from nothing.** `src/lib/pm/diagrams/snapshots.json` lists the
   snapshots, newest first. Take the newest one: its `source/*.json` files are the Archify sources of its diagrams.
   Find what changed since its `revision`: `git log --merges --oneline <revision>..HEAD`, and
   `git diff --stat <revision>..HEAD -- src supabase vercel.ts package.json`. Read the changed route handlers,
   workflows, migrations, crons and services before you edit anything.

3. **Redraw each diagram.** Copy each previous source to `.archify/<type>-<slug>-<YYYYMMDD-HHMMSS>/candidate.json`
   and bring it up to date with the code as it is now: components, connections, steps, cards, and the file and
   line evidence of every box (lines move; every cited range must exist). Keep ids and names stable where nothing
   changed, so two snapshots can be compared. Add a diagram when a new main flow exists that none of them shows
   (for example a new webhook, a gated feature or a new pipeline), and keep every diagram the previous snapshot
   had unless the thing it shows is gone. Set `meta.repository.revision` to the full `git rev-parse HEAD`, then run
   `node <archify>/bin/archify.mjs finalize <type> <candidate.json> <output.html> --repo-root . --quality showcase --json`
   and repair until it passes (SKILL.md, step 5). Real facts only: if you cannot find it in the code, it is not in
   the diagram.

4. **Store the snapshot.** Create `src/lib/pm/diagrams/snapshots/<id>/` with each `<name>.html` and
   `source/<name>.json`. Do not commit the `.archify/` work folders.

5. **Register it.** Add an entry at the **top** of `src/lib/pm/diagrams/snapshots.json`:
   `id`, `date`, `revision` (the short REV), a `note` in English and Vietnamese saying what changed in the system
   since the previous snapshot (name the routes, tables, crons or services; two sentences), and `diagrams`:
   `name`, `kind`, `title` and `desc`, each in English and Vietnamese. Leave every older entry as it is.

6. **Check.** `snapshots.json` must still parse as JSON, every listed `<name>.html` must exist in the snapshot
   folder, and no file outside `src/lib/pm/diagrams/` should have changed.

7. **Report** in a few lines: the snapshot id, what changed since the previous one, any diagram you added, and
   Archify's update notice if its receipt has one (never install an update yourself).

Locally, commit on a branch and open a pull request titled `Architecture snapshot <DATE>`; the admin's
out-of-date notice clears once it is merged.
