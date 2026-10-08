import { searchResources } from "@/lib/data";
import { RESOURCE_TYPES, type ResourceType } from "@/lib/types";

/** Instant results for the homepage search dropdown: top 5 + total, same ranking as /browse */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 120);
  if (!q) return Response.json({ items: [], total: 0 });
  const type = RESOURCE_TYPES.includes(sp.get("type") as ResourceType) ? (sp.get("type") as ResourceType) : undefined;
  const vi = sp.get("lang") === "vi";
  const { items, total } = await searchResources({ q, type, safeOnly: sp.get("safe") === "1", pageSize: 5 });
  return Response.json(
    {
      total,
      items: items.map((r) => ({
        slug: r.slug,
        name: r.name,
        owner: r.owner,
        type: r.type,
        safety: r.safety,
        stars: r.stars,
        blurb: (vi ? r.summary_vi || r.description_vi : r.summary) || r.description || "",
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
