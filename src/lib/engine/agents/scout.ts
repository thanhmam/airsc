import { GitHub, type GhRepo } from "@/lib/crawler/github";
import { SOURCES } from "@/lib/crawler/run";
import type { ResourceType } from "@/lib/types";
import { db } from "../db";
import { select } from "../select";

export type { Candidate } from "../select";
import type { Candidate } from "../select";

const GH_REPO = /github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?(?=[/#?)\s"'`]|$)/g;
const IGNORE_OWNERS = new Set(["sponsors", "features", "topics", "orgs", "apps", "marketplace", "settings", "user-attachments"]);

function reposIn(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(GH_REPO)) {
    if (IGNORE_OWNERS.has(m[1].toLowerCase())) continue;
    out.add(`${m[1]}/${m[2]}`.replace(/\.$/, ""));
  }
  return [...out];
}

async function fromMcpRegistry(): Promise<string[]> {
  const repos = new Set<string>();
  for (const base of ["https://registry.modelcontextprotocol.io/v0.1/servers", "https://registry.modelcontextprotocol.io/v0/servers"]) {
    let cursor: string | undefined;
    try {
      for (let page = 0; page < 20; page++) {
        const res = await fetch(`${base}?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, { signal: AbortSignal.timeout(15_000) });
        if (!res.ok) break;
        const data = (await res.json()) as { servers?: unknown[]; metadata?: { nextCursor?: string; next_cursor?: string } };
        for (const entry of data.servers ?? []) reposIn(JSON.stringify(entry)).forEach((r) => repos.add(r));
        cursor = data.metadata?.nextCursor ?? data.metadata?.next_cursor;
        if (!cursor) break;
      }
      if (repos.size) break;
    } catch {
      // try the next API version
    }
  }
  return [...repos];
}

async function fromNpm(): Promise<string[]> {
  const repos = new Set<string>();
  for (const text of ["keywords:mcp-server", "keywords:claude-code", "keywords:claude-skill"]) {
    const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(text)}&size=250&popularity=1.0`, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) continue;
    const data = (await res.json()) as { objects: { package: { links?: { repository?: string } } }[] };
    data.objects.forEach((o) => reposIn(o.package.links?.repository ?? "").forEach((r) => repos.add(r)));
  }
  return [...repos];
}

async function fromAwesomeLists(gh: GitHub): Promise<string[]> {
  const repos = new Set<string>();
  const lists = new Set<GhRepo>();
  for (const q of ["awesome claude skills in:name", "awesome mcp servers in:name", "awesome claude code in:name", "awesome cursorrules in:name"]) {
    (await gh.searchRepos(`${q} stars:>=200`, 1)).slice(0, 2).forEach((r) => lists.add(r));
  }
  for (const list of lists) {
    const readme = (await gh.raw(list.full_name, list.default_branch, "README.md", 2_000_000)) ?? "";
    reposIn(readme).forEach((r) => r.toLowerCase() !== list.full_name.toLowerCase() && repos.add(r));
  }
  return [...repos];
}

type Named = { name: string; type: ResourceType; sources: string[] };

/**
 * Scout, part 1: query every source. Returns topic hits that are new or updated since our last
 * crawl (these already carry metadata) and bare names from other sources that still need
 * metadata, skipping names we know or checked in the last 14 days.
 */
export async function discover(opts: { minStars?: number; log?: (m: string) => void } = {}) {
  const { minStars = 10, log = () => {} } = opts;
  const gh = new GitHub();
  const known = new Map((await db.known()).map((k) => [k.full_name.toLowerCase(), k]));
  const seen = new Set((await db.seen()).map((s) => s.toLowerCase()));
  const since = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);

  const withRepo = new Map<string, Candidate>();
  for (const s of SOURCES) {
    const repos = await gh.searchRepos(`${s.q} stars:>=${minStars} pushed:>=${since} archived:false fork:false`, 1);
    for (const r of repos) {
      const key = r.full_name.toLowerCase();
      const k = known.get(key);
      if (k && new Date(r.pushed_at) <= new Date(k.crawled_at)) continue; // unchanged
      const cur = withRepo.get(key);
      if (cur) cur.sources = [...new Set([...cur.sources, "github-topic"])];
      else withRepo.set(key, { repo: r, type: s.type, sources: ["github-topic"], isNew: !k });
    }
  }
  log(`topics: ${withRepo.size} new/updated`);

  const settle = async <T,>(label: string, p: Promise<T[]>) =>
    p.then((v) => (log(`${label}: ${v.length}`), v)).catch((e) => (log(`${label} failed: ${(e as Error).message}`), [] as T[]));
  // code search and GraphQL need a token; without one the Scout still runs on the other sources
  const authed = !!process.env.GITHUB_TOKEN;
  if (!authed) log("GITHUB_TOKEN missing: skipping code search and metadata lookups");
  const [skillFiles, marketplaces, registry, npm, awesome] = await Promise.all([
    authed ? settle("code SKILL.md", gh.searchCodeRepos("filename:SKILL.md", 3)) : [],
    authed ? settle("code marketplace", gh.searchCodeRepos("filename:marketplace.json path:.claude-plugin", 2)) : [],
    settle("mcp-registry", fromMcpRegistry()),
    settle("npm", fromNpm()),
    settle("awesome-lists", fromAwesomeLists(gh)),
  ]);
  const named = new Map<string, Named>();
  const add = (list: string[], type: ResourceType, source: string) => {
    for (const name of list) {
      const key = name.toLowerCase();
      if (known.has(key) || seen.has(key) || withRepo.has(key)) continue;
      const cur = named.get(key);
      if (cur) cur.sources = [...new Set([...cur.sources, source])];
      else named.set(key, { name, type, sources: [source] });
    }
  };
  add(skillFiles, "skill", "github-code");
  add(marketplaces, "plugin", "github-code");
  add(registry, "mcp", "mcp-registry");
  add(npm, "mcp", "npm");
  add(awesome, "skill", "awesome-list");
  log(`names needing metadata: ${named.size}`);
  return { withRepo: [...withRepo.values()], named: authed ? [...named.values()] : [] };
}

/** Scout, part 2: fetch metadata for a batch of names and keep the ones worth analysing */
export async function metadata(batch: Named[], minStars = 10): Promise<Candidate[]> {
  const gh = new GitHub();
  const repos = await gh.reposByName(batch.map((b) => b.name));
  await db.markSeen(batch.map((b) => b.name));
  const byName = new Map(batch.map((b) => [b.name.toLowerCase(), b]));
  return repos
    .filter((r) => r.stargazers_count >= minStars && !r.archived && !r.fork)
    .map((r) => {
      const b = byName.get(r.full_name.toLowerCase());
      return { repo: r, type: b?.type ?? "skill", sources: b?.sources ?? [], isNew: true };
    });
}

/** Whole Scout in one call (local scripts); the workflow runs the parts as separate steps */
export async function scout(opts: { maxNew?: number; maxRefresh?: number; minStars?: number; maxNames?: number; log?: (m: string) => void } = {}) {
  const { withRepo, named } = await discover(opts);
  const fetched: Candidate[] = [];
  const names = named.slice(0, opts.maxNames ?? 1000);
  for (let i = 0; i < names.length; i += 250) fetched.push(...(await metadata(names.slice(i, i + 250), opts.minStars)));
  opts.log?.(`metadata: ${fetched.length} of ${names.length} pass filters`);
  return select([...withRepo, ...fetched], opts.maxNew, opts.maxRefresh);
}
