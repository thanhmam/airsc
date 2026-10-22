import { z } from "zod";
import { generateObject } from "@/lib/engine/ai";
import { db, type SocialPost, type SocialReview } from "@/lib/engine/db";
import { SOCIAL_MODEL, socialSettings } from "@/lib/engine/settings";
import { engagementRate } from "./metrics";

const DAY = 86_400_000;
/** A review every three days, about the posts that went out since the last one */
export const REVIEW_EVERY = 3 * DAY;

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const round = (n: number | null, d = 1) => (n === null ? null : Math.round(n * 10 ** d) / 10 ** d);

/** Medians per kind of post, the numbers the review and /admin/social compare */
export function summarize(posts: SocialPost[]) {
  const by = (kind: string) => posts.filter((p) => kind === "all" || p.kind === kind);
  const stat = (ps: SocialPost[]) => ({
    posts: ps.length,
    median_views: median(ps.flatMap((p) => (p.impressions === null ? [] : [p.impressions]))),
    median_engagement_pct: round(median(ps.flatMap((p) => (engagementRate(p) === null ? [] : [engagementRate(p)!])))),
    likes: ps.reduce((n, p) => n + (p.likes ?? 0), 0),
    reposts: ps.reduce((n, p) => n + (p.reposts ?? 0), 0),
    replies: ps.reduce((n, p) => n + (p.replies ?? 0), 0),
    link_clicks: ps.reduce((n, p) => n + (p.link_clicks ?? 0), 0),
    profile_clicks: ps.reduce((n, p) => n + (p.profile_clicks ?? 0), 0),
  });
  return { all: stat(by("all")), spotlight: stat(by("spotlight")), applied: stat(by("applied")), picks: stat(by("picks")) };
}

/** The last three days of sent posts against the three days before, for /admin/social */
export function lastTwoPeriods(posts: SocialPost[], now = Date.now()) {
  const sent = posts.filter((p) => p.status === "posted" && p.posted_at);
  const within = (from: number, to: number) =>
    sent.filter((p) => {
      const age = now - new Date(p.posted_at!).getTime();
      return age >= from && age < to;
    });
  return { last: summarize(within(0, REVIEW_EVERY)).all, previous: summarize(within(REVIEW_EVERY, 2 * REVIEW_EVERY)).all };
}

const SYSTEM = `You review the X (Twitter) posts of @thanhmam, an indie hacker in Hanoi who builds Airsc, a safety-checked library of AI agent resources (Claude skills, MCP servers, plugins, Cursor rules) for vibe coders. The account is small (about a hundred followers), so the goal right now is reach and engagement, not sales.
Post kinds: "spotlight" = one resource, drafted by AI from data, with the author tagged when they have an X handle and the link in the first reply; "applied" = a first-person story of using a resource in a real project, with screenshots; "picks" = the old daily digest of four resources (the baseline).
You get every post of the period with its text, time and numbers, the same summary for the previous period, and the writing guidance in use.

Write for the account owner, in Vietnamese, plainly and briefly:
- summary: markdown, at most about 200 words. Start with the headline numbers against the previous period, then what worked and what did not, pointing at specific posts (quote their first line), then at most three concrete changes for the next three days. Say clearly when there are too few posts or views to tell anything apart from noise (with a hundred followers, a difference of a few dozen views often is noise). Never invent numbers.
- guidance: the writing guidance for the next posts, in English, at most 8 short bullet lines, each an instruction a writer can follow (hooks, length, angle, which kinds of resources, what to avoid). Keep what still holds from the current guidance, drop what the numbers contradict. Only things the writer controls: not posting times, not tagging.`;

const schema = z.object({
  summary: z.string().describe("Markdown in Vietnamese, about 200 words at most"),
  guidance: z.string().describe("English, at most 8 lines starting with '- '"),
});

/**
 * Reviews the posts since the last review (or the last three days), stores it and makes its guidance the
 * one the writers use. Returns null when nothing went out in the period.
 */
export async function runReview(o: { force?: boolean } = {}): Promise<SocialReview | null> {
  const now = Date.now();
  const [reviews, posts, settings] = await Promise.all([db.socialReviews(1), db.socialPosts(200), db.settings()]);
  const last = reviews[0];
  if (!o.force && last && now - new Date(last.created_at).getTime() < REVIEW_EVERY - 30 * 60_000) return null;
  const start = last ? new Date(last.period_end).getTime() : now - REVIEW_EVERY;
  const sent = posts.filter((p) => p.status === "posted" && p.posted_at);
  const inPeriod = sent.filter((p) => new Date(p.posted_at!).getTime() > start);
  if (!inPeriod.length) return null;
  const previous = sent.filter((p) => {
    const t = new Date(p.posted_at!).getTime();
    return t <= start && t > start - Math.max(REVIEW_EVERY, now - start);
  });
  const s = socialSettings(settings);
  const stats = { period: summarize(inPeriod), previous_period: summarize(previous) };
  const view = (p: SocialPost) => ({
    kind: p.kind,
    posted_at_vietnam: new Date(p.posted_at!).toLocaleString("en-GB", { timeZone: "Asia/Ho_Chi_Minh" }),
    hours_since_posted: Math.round((now - new Date(p.posted_at!).getTime()) / 3_600_000),
    text: p.text,
    tagged: p.status === "posted" && p.mentions.length > 0,
    images: p.kind === "applied" ? p.images.length : 1,
    views: p.impressions,
    likes: p.likes,
    reposts: p.reposts,
    replies: p.replies,
    quotes: p.quotes,
    bookmarks: p.bookmarks,
    link_clicks: p.link_clicks,
    profile_clicks: p.profile_clicks,
  });
  const res = await generateObject({
    tier: "fast",
    model: SOCIAL_MODEL,
    reasoning: "high",
    schema,
    system: SYSTEM,
    prompt: JSON.stringify({ posts: inPeriod.map(view), stats, current_guidance: s.x_guidance || null }),
  });
  const guidance = res.object.guidance.trim().slice(0, 1500);
  const review = await db.addSocialReview({
    period_start: new Date(start).toISOString(),
    period_end: new Date(now).toISOString(),
    stats,
    summary: res.object.summary.trim(),
    guidance,
    model: res.model,
    cost_usd: res.cost,
  });
  // the next drafts follow the new guidance (it stays editable in /admin/social)
  const fresh = await db.settings();
  await db.saveSettings({ ...fresh, social: { ...socialSettings(fresh), x_guidance: guidance } });
  return review;
}
