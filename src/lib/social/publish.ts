import { db, type SocialPost, type SocialStatus } from "@/lib/engine/db";
import { socialSettings } from "@/lib/engine/settings";
import { renderCard } from "./card";
import { loadPicks } from "./compose";
import { createPost, uploadImage, xConfigured } from "./x";

/**
 * Posts a draft to X with its card. The claim (draft → posting) makes sure only one caller posts it.
 * Nothing retries on its own: a failure is stored on the post for /admin/social, and a post left in
 * 'posting' (crash after X accepted it) waits for an admin to check X, so it can never go out twice.
 */
export async function publishPost(post: Pick<SocialPost, "id">, from: SocialStatus[]): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!xConfigured()) return { ok: false, error: "X not configured on this deployment (X_API_KEY … X_ACCESS_TOKEN_SECRET)" };
  const claimed = await db.claimSocialPost(post.id, from);
  if (!claimed) return { ok: false, error: "This post is already being posted or is no longer a draft" };

  let result: { id: string; url: string };
  try {
    const s = socialSettings(await db.settings());
    const png = await renderCard(claimed.day, await loadPicks(claimed.day), {
      style: claimed.card_style ?? s.x_card_style,
      // light or dark is one setting for every card (/admin/social)
      theme: s.x_card_theme,
      highlight: claimed.highlight,
      headline: claimed.headline,
    });
    const media = await uploadImage(png, claimed.image_alt ?? undefined);
    result = await createPost(claimed.text, [media]);
  } catch (e) {
    const error = String((e as Error)?.message ?? e).slice(0, 500);
    await db.finishSocialPost(claimed.id, "failed", { error });
    return { ok: false, error };
  }
  // X has the post now; if this write fails the row stays 'posting' rather than becoming retryable
  await db.finishSocialPost(claimed.id, "posted", { post_id: result.id, post_url: result.url });
  return { ok: true, url: result.url };
}
