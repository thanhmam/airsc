import { db, type SocialPost } from "@/lib/engine/db";
import { type CardStyle, socialSettings } from "@/lib/engine/settings";
import { imageAlt, loadPicks, resolveHighlight, writeHeadline, writePost, type PickRow } from "./compose";

/**
 * Writes the X draft for `day` from its Today's picks: the post text and the card's headline (Sonnet).
 * Without `force` an existing draft is kept (so the engine never overwrites an admin's edits); with it
 * (Write again) a draft or failed post is rewritten. Kept free of the card renderer so the Content
 * Engine's workflow step does not bundle next/og.
 */
export async function makeDraft(day: string, opts: { force?: boolean; model?: string; ai?: boolean } = {}) {
  const rows = await loadPicks(day);
  if (rows.length < 3) return { post: null, cost: 0, model: null, reason: `only ${rows.length} picks for ${day}` };
  const hi = resolveHighlight(rows);
  const { text, cost, model } = await writePost(day, rows, opts.model, opts.ai ?? true);
  let post = await db.saveSocialDraft(
    { day, channel: "x", text, highlight: hi?.slug ?? null, slugs: rows.map((r) => r.slug), image_alt: imageAlt(day, rows, hi) },
    opts.force,
  );
  let total = cost;
  // a new (or rewritten) draft gets its card art direction; an existing one keeps the admin's
  if (post && (opts.force || !post.headline) && (post.status === "draft" || post.status === "failed")) {
    const card = await artDirect(day, rows, post, {
      highlight: hi?.slug ?? null,
      style: post.card_style ?? socialSettings(await db.settings()).x_card_style,
      model: opts.model,
      ai: opts.ai,
    });
    post = card.post ?? post;
    total += card.cost;
  }
  return { post, cost: total, model, reason: null };
}

/**
 * Sets the card for a post: style, featured pick and headline. Without a headline Sonnet writes a new
 * one (different from the current one), which is what "Regenerate image" in /admin/social does.
 */
export async function artDirect(
  day: string,
  rows: PickRow[],
  post: Pick<SocialPost, "id" | "headline">,
  c: { highlight: string | null; style: CardStyle; headline?: string | null; model?: string; ai?: boolean },
) {
  const hi = resolveHighlight(rows, c.highlight);
  let headline = c.headline?.trim() || "";
  let cost = 0;
  if (!headline && hi) {
    const r = await writeHeadline(hi, { avoid: post.headline, model: c.model, ai: c.ai });
    headline = r.headline;
    cost = r.cost;
  }
  headline ||= "Four AI agent resources worth installing today.";
  const saved = await db.setSocialCard(post.id, {
    highlight: hi?.slug ?? null,
    headline,
    card_style: c.style,
    image_alt: imageAlt(day, rows, hi, headline),
  });
  return { post: saved, cost };
}
