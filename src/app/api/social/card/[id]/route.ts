import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/engine/db";
import { CARD_STYLES, CARD_THEMES, socialSettings, type CardStyle, type CardTheme } from "@/lib/engine/settings";
import { renderCard } from "@/lib/social/card";
import { loadPicks, loadResources } from "@/lib/social/compose";

/**
 * Admin preview of the card a post goes out with: its style, resource and headline come from the post
 * (set in /admin/social). `?style=` and `?theme=` preview another look: /api/social/card/42?style=spotlight
 */
export async function GET(req: Request, ctx: RouteContext<"/api/social/card/[id]">) {
  if (!(await requireAdmin())) return new Response("Forbidden", { status: 403 });
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return new Response("Bad id", { status: 400 });
  const [posts, settings] = await Promise.all([db.socialPosts(200), db.settings()]);
  const post = posts.find((p) => p.id === id);
  if (!post) return new Response("No such post", { status: 404 });
  const rows = post.kind === "picks" ? await loadPicks(post.day) : await loadResources(post.slugs);
  if (!rows.length) return new Response("Its resource is no longer published", { status: 404 });
  const q = new URL(req.url).searchParams;
  const s = socialSettings(settings);
  const askedStyle = q.get("style") as CardStyle | null;
  const askedTheme = q.get("theme") as CardTheme | null;
  const style = (askedStyle && CARD_STYLES.includes(askedStyle) ? askedStyle : null) ?? post.card_style ?? s.x_card_style;
  const theme = (askedTheme && CARD_THEMES.includes(askedTheme) ? askedTheme : null) ?? s.x_card_theme;
  const png = await renderCard(post.day, rows, { style, theme, highlight: post.highlight, headline: post.headline });
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=300" },
  });
}
