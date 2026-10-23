import { db } from "@/lib/engine/db";
import { socialSettings } from "@/lib/engine/settings";
import { vnHour } from "@/lib/engine/start";
import { vnDay } from "@/lib/social/compose";
import { makeDrafts } from "@/lib/social/draft";
import { refreshMetrics, staleMetrics } from "@/lib/social/metrics";
import { duePosts, publishPost } from "@/lib/social/publish";
import { runReview } from "@/lib/social/review";

export const maxDuration = 300;

/**
 * Cron at :30 every hour (vercel.ts), and `?task=post` every five minutes. Once the day's engine run is done it drafts today's spotlights if the
 * engine has not; posts at most one post whose time has come (approved ones as written, spotlight drafts
 * without @mentions when automatic posting is on); reads the numbers of recent posts; and every three
 * days writes the review that updates the writing guidance. Each part fails on its own.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const settings = await db.settings();
  const s = socialSettings(settings);
  const out: Record<string, unknown> = {};
  const day = vnDay();
  // ?task=post runs every five minutes and only sends what is due, so a post goes out within five minutes of its time
  const postOnly = new URL(req.url).searchParams.get("task") === "post";

  if (!postOnly && s.x_enabled && vnHour() > settings.run_hour_vn) {
    try {
      const d = await makeDrafts(day);
      out.drafts = d.posts.length ? d.posts.map((p) => p.highlight) : d.reason;
    } catch (e) {
      out.drafts = `error: ${(e as Error).message.slice(0, 200)}`;
    }
  }

  let posts = await db.socialPosts(120);
  if (s.x_enabled) {
    const [next] = duePosts(posts, s.x_auto);
    if (next) {
      const r = await publishPost(next, [next.status], { asWritten: next.status === "approved" });
      out.posted = { id: next.id, kind: next.kind, ...r };
      posts = await db.socialPosts(120);
    }
  }

  if (postOnly) return Response.json(out);

  try {
    out.metrics = await refreshMetrics(staleMetrics(posts));
  } catch (e) {
    out.metrics = `error: ${(e as Error).message.slice(0, 200)}`;
  }

  try {
    const review = await runReview();
    if (review) out.review = review.id;
  } catch (e) {
    out.review = `error: ${(e as Error).message.slice(0, 200)}`;
  }

  return Response.json(out);
}
