import { anonClient } from "@/lib/supabase/anon";
import type { ResourceType } from "@/lib/types";
import { enrichBatch, type EnrichInput } from "./enrich";
import { GitHub, type GhRepo } from "./github";
import { buildInstall, cleanReadme, detectType, pickFiles, readmePath } from "./install";
import { KITS, pickKitMembers } from "./kits";
import { licenseOk, scanFiles, type ScanFile } from "./scan";

/** Search sources, in priority order: a repo found by several queries keeps the first type */
export const SOURCES: { type: ResourceType; q: string; pages: number }[] = [
  { type: "plugin", q: "topic:claude-code-plugin", pages: 1 },
  { type: "plugin", q: "topic:claude-code-plugins", pages: 1 },
  { type: "skill", q: "topic:claude-skills", pages: 1 },
  { type: "skill", q: "topic:agent-skills", pages: 1 },
  { type: "skill", q: "topic:claude-code-skills", pages: 1 },
  { type: "skill", q: "topic:anthropic-skills", pages: 1 },
  { type: "agent", q: "topic:claude-code-agents", pages: 1 },
  { type: "agent", q: "topic:subagents", pages: 1 },
  { type: "rule", q: "topic:cursor-rules", pages: 1 },
  { type: "rule", q: "topic:cursorrules", pages: 1 },
  { type: "mcp", q: "topic:mcp-server", pages: 3 },
  { type: "mcp", q: "topic:model-context-protocol", pages: 1 },
];

export const slugify = (fullName: string) =>
  fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function pool<T, R>(items: T[], size: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

export type Row = Record<string, unknown> & { full_name: string; slug: string };

export async function analyse(gh: GitHub, repo: GhRepo, queryType: ResourceType): Promise<Row | null> {
  const branch = repo.default_branch;
  let tree;
  try {
    tree = await gh.tree(repo.full_name, branch);
  } catch {
    return null;
  }
  const type = detectType(queryType, tree.entries);
  const rp = readmePath(tree.entries);
  const readme = rp ? ((await gh.raw(repo.full_name, branch, rp)) ?? "") : "";

  const files: ScanFile[] = [];
  let packageJson: Record<string, unknown> | null = null;
  for (const path of pickFiles(tree.entries)) {
    const content = await gh.raw(repo.full_name, branch, path, 100_000);
    if (!content) continue;
    if (path === "package.json") {
      try {
        packageJson = JSON.parse(content);
      } catch {}
      // only lifecycle scripts matter for the scan
      const scripts = packageJson?.scripts ? JSON.stringify(packageJson.scripts) : "";
      files.push({ path, content: scripts, role: "manifest" });
    } else if (/\.(sh|ps1)$/.test(path)) {
      files.push({ path, content, role: "script" });
    } else if (path.endsWith(".json")) {
      continue;
    } else {
      files.push({ path, content, role: "agent" });
    }
  }
  if (readme) files.push({ path: rp!, content: readme, role: "readme" });

  const spdx = repo.license?.spdx_id ?? null;
  const { safety, notes } = scanFiles(files, { license: spdx, pushedAt: repo.pushed_at, archived: repo.archived });
  const { install, npmPackage } = buildInstall({
    type,
    fullName: repo.full_name,
    repo: repo.name,
    branch,
    entries: tree.entries,
    readme,
    packageJson,
  });

  return {
    slug: slugify(repo.full_name),
    type,
    name: repo.name,
    full_name: repo.full_name,
    owner: repo.owner.login,
    repo_url: repo.html_url,
    homepage: repo.homepage || null,
    description: repo.description,
    readme_excerpt: cleanReadme(readme),
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    license: spdx && spdx !== "NOASSERTION" ? spdx : null,
    license_ok: licenseOk(spdx),
    topics: repo.topics ?? [],
    language: repo.language,
    default_branch: branch,
    pushed_at: repo.pushed_at,
    version: tree.sha.slice(0, 12),
    safety,
    safety_notes: notes,
    install,
    npm_package: npmPackage,
  };
}

export type CrawlOptions = {
  /** cap on repos analysed this run (cron runs are time-boxed) */
  limit?: number;
  minStars?: number;
  enrich?: boolean;
  log?: (msg: string) => void;
};

export async function crawl(opts: CrawlOptions = {}) {
  const { limit = 2000, minStars = 10, enrich = true, log = console.log } = opts;
  const token = process.env.AIRSC_INGEST_TOKEN!;
  const gh = new GitHub();
  const db = anonClient();

  // 1. Discover
  const found = new Map<string, { repo: GhRepo; type: ResourceType }>();
  for (const s of SOURCES) {
    const repos = await gh.searchRepos(`${s.q} stars:>=${minStars} archived:false fork:false`, s.pages);
    for (const repo of repos) if (!found.has(repo.full_name)) found.set(repo.full_name, { repo, type: s.type });
    log(`search ${s.q}: ${repos.length} (total ${found.size})`);
  }
  const targets = [...found.values()].sort((a, b) => b.repo.stargazers_count - a.repo.stargazers_count).slice(0, limit);

  // 2. Analyse (tree + files + scan + install)
  let done = 0;
  const rows = (
    await pool(targets, 8, async ({ repo, type }) => {
      const row = await analyse(gh, repo, type).catch((e) => {
        log(`skip ${repo.full_name}: ${e.message}`);
        return null;
      });
      if (++done % 50 === 0) log(`analysed ${done}/${targets.length}`);
      return row;
    })
  ).filter((r): r is Row => !!r);

  // 3. Enrich only rows that have no summary yet (summaries survive re-crawls)
  if (enrich) {
    const have = new Set<string>();
    for (let from = 0; ; from += 1000) {
      const { data: page } = await db.from("resources").select("full_name").not("summary", "is", null).order("full_name").range(from, from + 999);
      page?.forEach((r) => have.add(r.full_name));
      if (!page || page.length < 1000) break;
    }
    const todo: EnrichInput[] = rows
      .filter((r) => !have.has(r.full_name))
      .map((r) => ({
        key: r.full_name,
        name: r.name as string,
        type: r.type as string,
        description: r.description as string | null,
        topics: r.topics as string[],
        readme: (r.readme_excerpt as string) ?? "",
      }));
    const batches: EnrichInput[][] = [];
    for (let i = 0; i < todo.length; i += 15) batches.push(todo.slice(i, i + 15));
    const byKey = new Map<string, Row>(rows.map((r) => [r.full_name, r]));
    let eDone = 0;
    await pool(batches, 4, async (batch) => {
      try {
        for (const item of await enrichBatch(batch)) {
          const row = byKey.get(item.key);
          if (!row) continue;
          row.summary = item.summary;
          row.summary_vi = item.summary_vi;
          row.description_vi = item.description_vi;
        }
      } catch (e) {
        log(`enrich failed: ${(e as Error).message}`);
      }
      eDone += batch.length;
      log(`enriched ${eDone}/${todo.length}`);
    });
  }

  // 4. Ingest in chunks
  let ingested = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const { data, error } = await db.rpc("ingest_resources", { p_token: token, p_rows: rows.slice(i, i + 100) });
    if (error) throw new Error(`ingest: ${error.message}`);
    ingested += data as number;
  }
  log(`ingested ${ingested}`);

  // 5. Rebuild kits from the full catalog
  const all: { full_name: string; name: string; description: string | null; topics: string[]; stars: number; safety: string; type: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data: page, error } = await db
      .from("resources")
      .select("full_name,name,description,topics,stars,safety,type")
      .order("full_name")
      .range(from, from + 999);
    if (error) throw new Error(`kits: ${error.message}`);
    all.push(...page);
    if (page.length < 1000) break;
  }
  const kits = KITS.map((k, position) => ({ ...k, position, resources: pickKitMembers(k, all) }));
  const { error: kitErr } = await db.rpc("ingest_kits", { p_token: token, p_kits: kits });
  if (kitErr) throw new Error(`ingest kits: ${kitErr.message}`);
  log(`kits: ${kits.map((k) => `${k.slug}=${k.resources.length}`).join(", ")}`);

  return { discovered: found.size, analysed: rows.length, ingested };
}
