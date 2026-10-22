import { db } from "@/lib/engine/db";

/** X handles are 1-15 letters, digits or underscores */
const HANDLE = /^\w{1,15}$/;

/** The X handle a GitHub user or org lists on their profile (`twitter_username`), or null */
async function lookup(owner: string): Promise<string | null> {
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(owner)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "airsc-social",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${owner}`);
  const h = ((await res.json()) as { twitter_username?: string | null }).twitter_username?.replace(/^@/, "").trim() ?? "";
  return HANDLE.test(h) ? h : null;
}

/**
 * X handles of these GitHub owners, keyed by owner in lower case. Looked up on GitHub once a month and
 * cached in x_handles; an owner GitHub cannot answer for right now is left out (asked again next time).
 */
export async function xHandles(owners: string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(owners.map((o) => o.toLowerCase()))];
  const out = new Map<string, string | null>();
  if (!unique.length) return out;
  for (const r of await db.xHandles(unique)) out.set(r.owner.toLowerCase(), r.handle);
  const missing = unique.filter((o) => !out.has(o));
  const found: { owner: string; handle: string | null }[] = [];
  for (let i = 0; i < missing.length; i += 6) {
    const batch = missing.slice(i, i + 6);
    const res = await Promise.allSettled(batch.map(lookup));
    res.forEach((r, j) => {
      if (r.status === "fulfilled") found.push({ owner: batch[j], handle: r.value });
    });
  }
  if (found.length) await db.setXHandles(found);
  for (const f of found) out.set(f.owner, f.handle);
  return out;
}
