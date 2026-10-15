import { db } from "@/lib/engine/db";
import { CARD_STYLES, socialSettings, type CardStyle } from "@/lib/engine/settings";
import { renderCard } from "@/lib/social/card";
import { loadPicks } from "@/lib/social/compose";

/**
 * The card attached to the day's X post: its style, featured pick and headline come from the day's
 * draft (set in /admin/social). `?style=` previews another style. Without a draft (or locally, without
 * the ingest token) it falls back to public data: /api/social/card/2026-10-15
 */
export async function GET(req: Request, ctx: RouteContext<"/api/social/card/[day]">) {
  const { day } = await ctx.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return new Response("Bad day", { status: 400 });
  const [rows, post, settings] = await Promise.all([
    loadPicks(day),
    db.socialPost(day).catch(() => null),
    db.settings().catch(() => null),
  ]);
  if (!rows.length) return new Response("No picks for this day", { status: 404 });
  const asked = new URL(req.url).searchParams.get("style") as CardStyle | null;
  const style = (asked && CARD_STYLES.includes(asked) ? asked : null) ?? post?.card_style ?? (settings ? socialSettings(settings).x_card_style : "editorial");
  const png = await renderCard(day, rows, { style, highlight: post?.highlight, headline: post?.headline });
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300, s-maxage=3600" },
  });
}
