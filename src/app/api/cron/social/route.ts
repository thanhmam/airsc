import { db } from "@/lib/engine/db";
import { socialSettings } from "@/lib/engine/settings";
import { vnHour } from "@/lib/engine/start";
import { vnDay } from "@/lib/social/compose";
import { makeDraft } from "@/lib/social/draft";
import { publishPost } from "@/lib/social/publish";

/**
 * Hourly cron (vercel.ts). From the hour set in /admin/social (Vietnam time), posts today's draft about
 * Today's picks to X. Writes the draft first if the Content Engine has not (e.g. X was turned on later).
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const settings = await db.settings();
  const s = socialSettings(settings);
  if (!s.x_enabled) return Response.json({ skipped: "X posting is off" });
  if (!s.x_auto) return Response.json({ skipped: "waiting for an admin to post" });
  if (vnHour() < s.x_post_hour_vn) return Response.json({ skipped: "not the posting hour yet", hourVN: vnHour() });

  const day = vnDay();
  let post = (await db.socialPosts(3)).find((p) => p.day === day && p.channel === "x") ?? null;
  if (!post) post = (await makeDraft(day)).post;
  if (!post) return Response.json({ skipped: "no picks today" });
  if (post.status !== "draft") return Response.json({ skipped: `today's post is ${post.status}` });
  return Response.json(await publishPost(post, ["draft"]));
}
