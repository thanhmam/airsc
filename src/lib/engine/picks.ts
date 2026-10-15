import type { Resource } from "@/lib/types";

export type PickCandidate = Pick<Resource, "slug" | "owner" | "type" | "category" | "quality" | "stars" | "first_seen_at">;

/** One past day of picks, newest first */
export type PickDay = { day: string; slugs: string[] };

export const PICKS_PER_DAY = 4;
/** Candidates must be rated at least this well by the Curator */
export const PICK_MIN_QUALITY = 80;

const WEEK = 7 * 86_400_000;

/** Quality first, stars as a tie-breaker in the same league, and a lift for this week's arrivals */
export function score(c: PickCandidate, now = Date.now()) {
  const fresh = now - new Date(c.first_seen_at).getTime() < WEEK ? 10 : 0;
  return (c.quality ?? 0) + 6 * Math.log10(c.stars + 1) + fresh;
}

/**
 * Today's picks. Candidates are safe, well-rated resources with a real-result image.
 * Never-featured resources go first (best score first), then the ones featured longest ago, so the
 * whole pool rotates before anything repeats and new arrivals jump the queue.
 * A day's set mixes owners, categories and types (at most two of a type) when the pool allows it.
 */
export function choosePicks(candidates: PickCandidate[], history: PickDay[], n = PICKS_PER_DAY, now = Date.now()): string[] {
  const last = new Map<string, string>();
  for (const h of history) for (const s of h.slugs) if ((last.get(s) ?? "") < h.day) last.set(s, h.day);

  const queue = [...new Map(candidates.map((c) => [c.slug, c])).values()].sort(
    (a, b) =>
      (last.get(a.slug) ?? "").localeCompare(last.get(b.slug) ?? "") || score(b, now) - score(a, now) || a.slug.localeCompare(b.slug),
  );

  const picked: PickCandidate[] = [];
  const count = (key: "type" | "category" | "owner", v: string | null) => picked.filter((p) => p[key] === v).length;
  // the mix only reorders the front of the queue, among resources waiting as long as the plain top n,
  // so it never brings one back while others have not had their turn
  const cutoff = last.get(queue[n - 1]?.slug ?? "") ?? "";
  const front = queue.slice(0, n * 4).filter((c) => (last.get(c.slug) ?? "") <= cutoff);
  const rules: [PickCandidate[], (c: PickCandidate) => boolean][] = [
    [front, (c) => !count("owner", c.owner) && !count("category", c.category) && count("type", c.type) < 2],
    [front, (c) => !count("owner", c.owner) && count("type", c.type) < 2],
    [queue, (c) => !count("owner", c.owner)],
    [queue, () => true],
  ];
  for (const [from, ok] of rules) {
    for (const c of from) {
      if (picked.length >= n) break;
      if (!picked.includes(c) && ok(c)) picked.push(c);
    }
  }
  return picked.map((p) => p.slug);
}
