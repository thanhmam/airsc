import { renderCard } from "@/lib/social/card";
import { loadPicks } from "@/lib/social/compose";

/**
 * The card attached to the day's X post, from public data only (Today's picks). Shown in /admin/social
 * and handy to check a design change locally: /api/social/card/2026-10-15
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/social/card/[day]">) {
  const { day } = await ctx.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return new Response("Bad day", { status: 400 });
  const rows = await loadPicks(day);
  if (!rows.length) return new Response("No picks for this day", { status: 404 });
  const png = await renderCard(day, rows);
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300, s-maxage=3600" },
  });
}
