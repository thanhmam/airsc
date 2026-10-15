import { db } from "@/lib/engine/db";
import { CARD_STYLES, CARD_THEMES, socialSettings, type CardStyle, type CardTheme } from "@/lib/engine/settings";
import { renderCard } from "@/lib/social/card";
import { loadPicks } from "@/lib/social/compose";

/**
 * The card attached to the day's X post: its style, featured pick and headline come from the day's
 * draft (set in /admin/social). `?style=` and `?theme=` preview another look. Without a draft (or locally, without
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
  const q = new URL(req.url).searchParams;
  const s = settings ? socialSettings(settings) : null;
  const askedStyle = q.get("style") as CardStyle | null;
  const askedTheme = q.get("theme") as CardTheme | null;
  const style = (askedStyle && CARD_STYLES.includes(askedStyle) ? askedStyle : null) ?? post?.card_style ?? s?.x_card_style ?? "editorial";
  const theme = (askedTheme && CARD_THEMES.includes(askedTheme) ? askedTheme : null) ?? s?.x_card_theme ?? "light";
  const png = await renderCard(day, rows, { style, theme, highlight: post?.highlight, headline: post?.headline });
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300, s-maxage=3600" },
  });
}
