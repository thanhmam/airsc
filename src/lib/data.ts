import "server-only";
import { anonClient } from "@/lib/supabase/anon";
import type { GuidePageRow, Kit, Resource, ResourceType } from "@/lib/types";

export const CARD_FIELDS =
  "id,slug,type,name,owner,full_name,description,description_vi,summary,summary_vi,stars,safety,license,pushed_at,downloads,topics,category,first_seen_at,previews";

export type ResourceCard = Pick<
  Resource,
  | "id" | "slug" | "type" | "name" | "owner" | "full_name" | "description" | "description_vi" | "summary"
  | "summary_vi" | "stars" | "safety" | "license" | "pushed_at" | "downloads" | "topics" | "category" | "first_seen_at"
  | "previews"
>;

export type SortKey = "stars" | "recent" | "downloads" | "new";

/** Turn free text into a prefix tsquery: "stripe pay" -> "stripe:* & pay:*" */
export function toTsQuery(q: string): string | null {
  const words = q
    .toLowerCase()
    .normalize("NFC")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 1)
    .slice(0, 6);
  return words.length ? words.map((w) => `${w}:*`).join(" & ") : null;
}

export async function searchResources(opts: {
  q?: string;
  type?: ResourceType;
  category?: string;
  safeOnly?: boolean;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
}): Promise<{ items: ResourceCard[]; total: number }> {
  const { q, type, category, safeOnly, sort = "stars", page = 1, pageSize = 24 } = opts;
  let query = anonClient().from("resources").select(CARD_FIELDS, { count: "exact" });
  const ts = q ? toTsQuery(q) : null;
  if (ts) query = query.textSearch("search", ts, { config: "simple" });
  if (type) query = query.eq("type", type);
  if (category) query = query.eq("category", category);
  if (safeOnly) query = query.eq("safety", "safe");
  query =
    sort === "recent"
      ? query.order("pushed_at", { ascending: false, nullsFirst: false })
      : sort === "new"
        ? query.order("first_seen_at", { ascending: false }).order("stars", { ascending: false })
      : sort === "downloads"
        ? query.order("downloads", { ascending: false }).order("stars", { ascending: false })
        : query.order("stars", { ascending: false });
  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);
  return { items: (data ?? []) as ResourceCard[], total: count ?? 0 };
}

export async function getResource(slug: string): Promise<Resource | null> {
  const { data } = await anonClient().from("resources").select("*").eq("slug", slug).maybeSingle();
  return data as Resource | null;
}

export async function getTrending(limit = 8): Promise<ResourceCard[]> {
  const { data } = await anonClient()
    .from("resources")
    .select(CARD_FIELDS)
    .neq("safety", "danger")
    .order("downloads", { ascending: false })
    .order("stars", { ascending: false })
    .limit(limit);
  return (data ?? []) as ResourceCard[];
}

/** Cards plus the fields agentPrompt() needs, returned in the order of `slugs` */
export async function getResourcesBySlugs(slugs: string[]) {
  const { data } = await anonClient()
    .from("resources")
    .select(`${CARD_FIELDS},default_branch,install`)
    .in("slug", slugs)
    .neq("safety", "danger");
  type Row = ResourceCard & Pick<Resource, "default_branch" | "install">;
  const bySlug = new Map(((data ?? []) as Row[]).map((r) => [r.slug, r]));
  return slugs.map((s) => bySlug.get(s)).filter((r): r is Row => !!r);
}

export async function getStats() {
  const db = anonClient();
  const [all, safe] = await Promise.all([
    db.from("resources").select("id", { count: "exact", head: true }),
    db.from("resources").select("id", { count: "exact", head: true }).eq("safety", "safe"),
  ]);
  return { total: all.count ?? 0, safe: safe.count ?? 0 };
}

export type KitWithCount = Kit & { count: number };

export async function getKits(): Promise<KitWithCount[]> {
  const { data } = await anonClient().from("kits").select("*, kit_items(count)").order("position");
  return ((data ?? []) as (Kit & { kit_items: { count: number }[] })[]).map(({ kit_items, ...k }) => ({
    ...k,
    count: kit_items?.[0]?.count ?? 0,
  }));
}

export async function getKit(slug: string): Promise<{ kit: Kit; items: ResourceCard[] } | null> {
  const { data } = await anonClient()
    .from("kits")
    .select(`*, kit_items(position, resources(${CARD_FIELDS}))`)
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  const { kit_items, ...kit } = data as Kit & { kit_items: { position: number; resources: ResourceCard }[] };
  return {
    kit,
    // hidden/pending resources come back as null through RLS
    items: kit_items.sort((a, b) => a.position - b.position).map((i) => i.resources).filter(Boolean),
  };
}

export async function kitsForResource(resourceId: string): Promise<Kit[]> {
  const { data } = await anonClient().from("kit_items").select("kits(*)").eq("resource_id", resourceId);
  return ((data ?? []) as unknown as { kits: Kit }[]).map((r) => r.kits);
}

export async function getNewThisWeek(limit = 8): Promise<ResourceCard[]> {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await anonClient()
    .from("resources")
    .select(CARD_FIELDS)
    .gte("first_seen_at", since)
    .order("stars", { ascending: false })
    .limit(limit);
  return (data ?? []) as ResourceCard[];
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (let from = 0; ; from += 1000) {
    const { data } = await anonClient().from("resources").select("category").not("category", "is", null).range(from, from + 999);
    (data ?? []).forEach((r) => (counts[r.category as string] = (counts[r.category as string] ?? 0) + 1));
    if (!data || data.length < 1000) break;
  }
  return counts;
}

export async function getTypeCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (let from = 0; ; from += 1000) {
    const { data } = await anonClient().from("resources").select("type").range(from, from + 999);
    (data ?? []).forEach((r) => (counts[r.type as string] = (counts[r.type as string] ?? 0) + 1));
    if (!data || data.length < 1000) break;
  }
  return counts;
}

export async function getGuides(): Promise<GuidePageRow[]> {
  const { data } = await anonClient()
    .from("pages")
    .select("slug,kind,title,title_vi,description,description_vi,resource_slugs,generated_at")
    .order("kind")
    .order("generated_at", { ascending: false });
  return (data ?? []) as GuidePageRow[];
}

export async function getGuide(slug: string): Promise<{ page: GuidePageRow; resources: ResourceCard[] } | null> {
  const { data } = await anonClient().from("pages").select("*").eq("slug", slug).maybeSingle();
  if (!data) return null;
  const page = data as GuidePageRow;
  const { data: rows } = await anonClient().from("resources").select(CARD_FIELDS).in("slug", page.resource_slugs);
  const bySlug = new Map(((rows ?? []) as ResourceCard[]).map((r) => [r.slug, r]));
  return { page, resources: page.resource_slugs.map((s) => bySlug.get(s)).filter((r): r is ResourceCard => !!r) };
}

export async function foundingLeft(): Promise<number> {
  const { data } = await anonClient().rpc("founding_left");
  return (data as number) ?? 200;
}
