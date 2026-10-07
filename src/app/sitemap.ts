import type { MetadataRoute } from "next";
import { anonClient } from "@/lib/supabase/anon";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://airsc.vercel.app";

/** Every page exists in English (/) and Vietnamese (/vi) */
const both = (path: string, lastModified?: string): MetadataRoute.Sitemap[number] => ({
  url: `${site}${path}`,
  lastModified,
  alternates: { languages: { en: `${site}${path}`, vi: `${site}/vi${path === "/" ? "" : path}` } },
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = anonClient();
  const resources: { slug: string; crawled_at: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from("resources").select("slug,crawled_at").order("stars", { ascending: false }).range(from, from + 999);
    resources.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const [{ data: kits }, { data: pages }] = await Promise.all([
    db.from("kits").select("slug"),
    db.from("pages").select("slug,generated_at"),
  ]);
  return [
    ...["/", "/browse", "/kits", "/guides", "/mcp", "/support"].map((p) => both(p)),
    ...(pages ?? []).map((p) => both(`/guides/${p.slug}`, p.generated_at)),
    ...(kits ?? []).map((k) => both(`/kits/${k.slug}`)),
    ...resources.map((r) => both(`/r/${r.slug}`, r.crawled_at)),
  ];
}
