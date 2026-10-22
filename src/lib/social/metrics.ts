import { db, type SocialMetrics, type SocialPost } from "@/lib/engine/db";
import { type TweetMetrics, tweetMetrics, xConfigured } from "./x";

const HOUR = 3_600_000;

/** Public counts from fxtwitter (no key needed): the fallback when the X API will not answer */
async function fxMetrics(id: string): Promise<TweetMetrics | null> {
  try {
    const res = await fetch(`https://api.fxtwitter.com/status/${id}`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const t = ((await res.json()) as { tweet?: { views?: number | null; likes?: number; retweets?: number; replies?: number; quotes?: number; bookmarks?: number } }).tweet;
    if (!t) return null;
    return {
      impressions: t.views ?? null,
      likes: t.likes ?? 0,
      reposts: t.retweets ?? 0,
      replies: t.replies ?? 0,
      quotes: t.quotes ?? 0,
      bookmarks: t.bookmarks ?? 0,
      profile_clicks: null,
      link_clicks: null,
    };
  } catch {
    return null;
  }
}

/**
 * Posts whose numbers are worth reading again: fresh ones every 3 hours for the first two days, then
 * twice a day until they are a week old (most of a post's views come in its first day or two).
 */
export function staleMetrics(posts: SocialPost[], now = Date.now()) {
  return posts.filter((p) => {
    if (p.status !== "posted" || !p.post_id || !p.posted_at) return false;
    const age = now - new Date(p.posted_at).getTime();
    if (age > 8 * 24 * HOUR) return false;
    const since = p.metrics_at ? now - new Date(p.metrics_at).getTime() : Infinity;
    return since >= (age < 48 * HOUR ? 3 : 12) * HOUR;
  });
}

/**
 * Reads the numbers of `posts` (and of their link replies, for link clicks) and stores them. Uses the X
 * API with the posting keys, else fxtwitter's public counts.
 */
export async function refreshMetrics(posts: SocialPost[]) {
  if (!posts.length) return { updated: 0, source: "none" as const };
  const ids = posts.flatMap((p) => [p.post_id!, ...(p.reply_post_id ? [p.reply_post_id] : [])]);
  let found = new Map<string, TweetMetrics>();
  let source: "x" | "fxtwitter" = "x";
  if (xConfigured()) {
    try {
      found = await tweetMetrics(ids);
    } catch (e) {
      console.error("x metrics failed", (e as Error).message);
    }
  }
  if (!posts.some((p) => found.has(p.post_id!))) {
    source = "fxtwitter";
    for (const p of posts) {
      const m = await fxMetrics(p.post_id!);
      if (m) found.set(p.post_id!, m);
    }
  }
  const rows: ({ id: number } & SocialMetrics)[] = [];
  for (const p of posts) {
    const m = found.get(p.post_id!);
    if (!m) continue;
    const reply = p.reply_post_id ? found.get(p.reply_post_id) : undefined;
    rows.push({
      id: p.id,
      ...m,
      // the link is in the reply, so its clicks are counted there
      link_clicks: m.link_clicks === null && reply?.link_clicks == null ? null : (m.link_clicks ?? 0) + (reply?.link_clicks ?? 0),
    });
  }
  return { updated: rows.length ? await db.setSocialMetrics(rows) : 0, source };
}

/** Likes, reposts, replies, quotes and bookmarks per view, as a percentage (null without views) */
export const engagementRate = (p: SocialMetrics) =>
  p.impressions ? (100 * ((p.likes ?? 0) + (p.reposts ?? 0) + (p.replies ?? 0) + (p.quotes ?? 0) + (p.bookmarks ?? 0))) / p.impressions : null;
