import "server-only";

/** Reads of the public repository for /admin/pm: how far the diagrams and the changelog are behind main */
export const REPO = "thanhmam/airsc";
export const REPO_URL = `https://github.com/${REPO}`;
const API = `https://api.github.com/repos/${REPO}`;
const WORKFLOW = "refresh-architecture.yml";

/** GET with the read token if there is one (a bad or expired token falls back to anonymous reads), cached for ten minutes */
async function gh<T>(path: string): Promise<T | null> {
  const token = process.env.GITHUB_TOKEN;
  for (const auth of token ? [token, null] : [null]) {
    try {
      const res = await fetch(`${API}${path}`, {
        headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "airsc-admin", ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
        next: { revalidate: 600 },
        signal: AbortSignal.timeout(8_000),
      });
      if (res.ok) return (await res.json()) as T;
      if (res.status !== 401 && res.status !== 403) return null;
    } catch {
      return null;
    }
  }
  return null;
}

export type MergedPr = { number: number; title: string; mergedAt: string };

/** Pull requests merged into main, newest first */
export async function mergedPrs(limit = 80): Promise<MergedPr[] | null> {
  const rows = await gh<{ number: number; title: string; merged_at: string | null }[]>(`/pulls?state=closed&base=main&sort=updated&direction=desc&per_page=${limit}`);
  if (!rows) return null;
  return rows.filter((r) => r.merged_at).map((r) => ({ number: r.number, title: r.title, mergedAt: r.merged_at! }));
}

/** Files that decide what the architecture diagrams show */
const SHAPES: { re: RegExp; what: string }[] = [
  { re: /^supabase\/migrations\//, what: "database schema" },
  { re: /^src\/app\/api\//, what: "API routes" },
  { re: /^src\/workflows\//, what: "workflows" },
  { re: /^vercel\.ts$/, what: "crons" },
  { re: /^src\/proxy\.ts$/, what: "request routing" },
  { re: /^package\.json$/, what: "dependencies" },
  { re: /^src\/lib\/(engine|crawler|social|supabase)\//, what: "engine, crawler, social or Supabase code" },
];

export type ArchitectureStatus = {
  /** commits on main after the revision the diagrams were traced from */
  commits: number;
  /** pull requests merged since */
  prs: number[];
  /** files in the areas the diagrams show, changed since */
  files: number;
  /** areas with a structural change (added or removed file, new migration, cron or dependency change) */
  signals: string[];
  stale: boolean;
};

/**
 * Compares main with the commit the latest diagrams were traced from. The diagrams are stale when something
 * structural changed: a migration, a file added or removed in the routes, workflows or libraries, the crons or
 * the dependencies, or when many files in those areas changed. Null when GitHub cannot be reached.
 */
export async function architectureStatus(revision: string): Promise<ArchitectureStatus | null> {
  const r = await gh<{ ahead_by: number; commits: { commit: { message: string } }[]; files?: { filename: string; status: string; patch?: string }[] }>(`/compare/${revision}...main`);
  if (!r) return null;
  const files = r.files ?? [];
  const shaped = files.filter((f) => SHAPES.some((s) => s.re.test(f.filename)));
  const signals = new Set<string>();
  for (const f of shaped) {
    const what = SHAPES.find((s) => s.re.test(f.filename))!.what;
    // package.json counts only when a dependency line changed (a "name": "^1.2.3" line), not a script
    const depLine = /^[+-]\s+"[@\w/.-]+":\s+"[\^~]?\d/m;
    const structural =
      f.status === "added" ||
      f.status === "removed" ||
      f.status === "renamed" ||
      /^(supabase\/migrations\/|vercel\.ts)/.test(f.filename) ||
      (f.filename === "package.json" && depLine.test(f.patch ?? ""));
    if (structural) signals.add(what);
  }
  if (shaped.length >= 10) signals.add(`${shaped.length} files in the areas the diagrams show`);
  const prs = r.commits.flatMap((c) => [...c.commit.message.matchAll(/^Merge pull request #(\d+)/gm)].map((m) => Number(m[1])));
  return { commits: r.ahead_by, prs, files: shaped.length, signals: [...signals], stale: signals.size > 0 };
}

export type RefreshRun = { status: string; conclusion: string | null; url: string; at: string };

/** The latest run of the refresh-architecture workflow, if it has ever run */
export async function latestRefreshRun(): Promise<RefreshRun | null> {
  const r = await gh<{ workflow_runs: { status: string; conclusion: string | null; html_url: string; created_at: string }[] }>(`/actions/workflows/${WORKFLOW}/runs?per_page=1`);
  const run = r?.workflow_runs?.[0];
  return run ? { status: run.status, conclusion: run.conclusion, url: run.html_url, at: run.created_at } : null;
}

/** Starts the workflow (needs GITHUB_DISPATCH_TOKEN: a fine-grained token with Actions write on this repository) */
export async function dispatchRefresh(): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) return { ok: false, error: "GITHUB_DISPATCH_TOKEN is not set on this deployment" };
  try {
    const res = await fetch(`${API}/actions/workflows/${WORKFLOW}/dispatches`, {
      method: "POST",
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "airsc-admin", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ref: "main" }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 204) return { ok: true };
    return { ok: false, error: `GitHub ${res.status}: ${(await res.text()).slice(0, 200)}` };
  } catch (e) {
    return { ok: false, error: String((e as Error).message ?? e).slice(0, 200) };
  }
}

export const dispatchConfigured = () => !!process.env.GITHUB_DISPATCH_TOKEN;
