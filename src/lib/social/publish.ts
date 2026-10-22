import sharp from "sharp";
import { db, type SocialPost, type SocialStatus } from "@/lib/engine/db";
import { socialSettings } from "@/lib/engine/settings";
import { renderCard } from "./card";
import { loadPicks, loadResources, SITE, withoutMentions } from "./compose";
import { createPost, uploadImage, xConfigured } from "./x";

/** X takes images up to 5 MB: PNG keeps diagrams sharp, JPEG when a PNG would be too big */
async function forX(src: string): Promise<Buffer> {
  const url = src.startsWith("/") ? `${SITE}${src}` : src;
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`image ${res.status}: ${url}`);
  const img = sharp(Buffer.from(await res.arrayBuffer())).resize(2048, 2048, { fit: "inside", withoutEnlargement: true });
  const png = await img.clone().png({ compressionLevel: 9 }).toBuffer();
  return png.length < 4.8e6 ? png : img.jpeg({ quality: 88 }).toBuffer();
}

/** The images a post goes out with: an applied post's screenshots, otherwise its card */
async function media(p: SocialPost): Promise<Buffer[]> {
  if (p.kind === "applied") return Promise.all(p.images.slice(0, 4).map(forX));
  const s = socialSettings(await db.settings());
  const rows = p.kind === "picks" ? await loadPicks(p.day) : await loadResources(p.slugs);
  if (!rows.length) return [];
  return [await renderCard(p.day, rows, { style: p.card_style ?? s.x_card_style, theme: s.x_card_theme, highlight: p.highlight, headline: p.headline })];
}

/**
 * Posts a draft to X with its images, then its link as the first reply. The claim (→ 'posting') makes sure
 * only one caller posts it. Nothing retries on its own: a failure is stored on the post for /admin/social,
 * and a post left in 'posting' (crash after X accepted it) waits for an admin, so it never goes out twice.
 * The @mentions stay only when an admin approved or pressed Post now (`asWritten`): X does not allow
 * automated posts to tag people who did not ask for it.
 */
export async function publishPost(
  post: Pick<SocialPost, "id">,
  from: SocialStatus[],
  o: { asWritten: boolean },
): Promise<{ ok: true; url: string; replyError?: string } | { ok: false; error: string }> {
  if (!xConfigured()) return { ok: false, error: "X not configured on this deployment (X_API_KEY … X_ACCESS_TOKEN_SECRET)" };
  const claimed = await db.claimSocialPost(post.id, from);
  if (!claimed) return { ok: false, error: "This post is already being posted or is no longer waiting" };

  let result: { id: string; url: string };
  try {
    const images = await media(claimed);
    const ids: string[] = [];
    for (const [i, png] of images.entries()) ids.push(await uploadImage(png, i === 0 ? (claimed.image_alt ?? undefined) : undefined));
    result = await createPost(o.asWritten ? claimed.text : withoutMentions(claimed.text), ids);
  } catch (e) {
    const error = String((e as Error)?.message ?? e).slice(0, 500);
    await db.finishSocial(claimed.id, { status: "failed", error });
    return { ok: false, error };
  }
  // X has the post now: from here on it is 'posted' whatever happens to the reply
  let replyId: string | undefined;
  let replyError: string | undefined;
  if (claimed.reply_text?.trim()) {
    try {
      replyId = (await createPost(claimed.reply_text.trim(), [], result.id)).id;
    } catch (e) {
      replyError = `reply: ${String((e as Error)?.message ?? e).slice(0, 300)}`;
    }
  }
  await db.finishSocial(claimed.id, { status: "posted", post_id: result.id, post_url: result.url, reply_post_id: replyId, error: replyError ?? null });
  return { ok: true, url: result.url, replyError };
}

/**
 * What the hourly cron may post now: approved posts whose time has come, and (when automatic posting is
 * on) spotlight drafts whose time has come, without their @mentions. Posts more than three hours late
 * wait for an admin, so a cron outage never sends a burst of stale posts.
 */
export function duePosts(posts: SocialPost[], auto: boolean, now = Date.now()) {
  return posts
    .filter((p) => {
      if (p.channel !== "x" || !p.scheduled_at) return false;
      const t = new Date(p.scheduled_at).getTime();
      if (t > now + 2 * 60_000 || t < now - 3 * 3_600_000) return false;
      return p.status === "approved" || (auto && p.status === "draft" && p.kind === "spotlight");
    })
    .sort((a, b) => a.scheduled_at!.localeCompare(b.scheduled_at!));
}
