import { db } from "@/lib/engine/db";
import { imageAlt, loadPicks, pickHighlight, writePost } from "./compose";

/**
 * Writes the X draft for `day` from its Today's picks. Without `force` an existing draft is kept (so the
 * engine never overwrites an admin's edits); with it (Regenerate) a draft or failed post is rewritten.
 * Kept free of the card renderer so the Content Engine's workflow step does not bundle next/og.
 */
export async function makeDraft(day: string, opts: { force?: boolean; model?: string; ai?: boolean } = {}) {
  const rows = await loadPicks(day);
  if (rows.length < 3) return { post: null, cost: 0, model: null, reason: `only ${rows.length} picks for ${day}` };
  const hi = pickHighlight(rows);
  const { text, cost, model } = await writePost(day, rows, opts.model, opts.ai ?? true);
  const post = await db.saveSocialDraft(
    { day, channel: "x", text, highlight: hi?.slug ?? null, slugs: rows.map((r) => r.slug), image_alt: imageAlt(day, rows, hi) },
    opts.force,
  );
  return { post, cost, model, reason: null };
}
