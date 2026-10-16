import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/engine/db";
import { getDict, href, type Locale } from "@/lib/i18n";
import { anonClient } from "@/lib/supabase/anon";
import type { Preview, Resource } from "@/lib/types";
import { cn } from "@/lib/utils";
import { pmCopy } from "../content";
import { fmtDay, PmHeader } from "../shared";

type PickRow = Pick<Resource, "slug" | "name" | "owner" | "type" | "quality" | "stars"> & { previews: Preview[] | null };

const DAYS = 90;

const TONE: Record<string, string> = {
  posted: "bg-safe-soft text-safe",
  failed: "bg-danger-soft text-danger",
  posting: "bg-caution-soft text-caution",
  draft: "bg-accent-soft text-accent",
  skipped: "bg-soft text-muted",
};

async function loadHistory() {
  const sb = anonClient();
  const { data: days } = await sb.from("daily_picks").select("day,slugs").order("day", { ascending: false }).limit(DAYS);
  const history = (days ?? []) as { day: string; slugs: string[] }[];
  const slugs = [...new Set(history.flatMap((d) => d.slugs))];
  // public reads only see published resources: a pick hidden later shows as its slug
  const { data: rows } = slugs.length
    ? await sb.from("resources").select("slug,name,owner,type,quality,stars,previews").in("slug", slugs)
    : { data: [] };
  const bySlug = new Map(((rows ?? []) as PickRow[]).map((r) => [r.slug, r]));
  const posts = await db.socialPosts(DAYS).catch(() => []);
  return { history, bySlug, posts };
}

export default async function PmPicks({ params }: PageProps<"/[lang]/admin/pm/picks">) {
  const { lang } = (await params) as { lang: Locale };
  const t = pmCopy(lang);
  const p = t.picks;
  const types = getDict(lang).types;
  const { history, bySlug, posts } = await loadHistory();

  return (
    <div className="space-y-6">
      <PmHeader title={t.tabs.picks} intro={p.intro}>
        <p className="text-xs text-muted">
          {history.length} {p.days}
        </p>
      </PmHeader>

      {!history.length ? (
        <p className="text-sm text-muted">{p.none}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr className="border-b border-line">
                {p.cols.map((c) => (
                  <th key={c} className="px-3 py-2.5 font-medium">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {history.map((d) => {
                const post = posts.find((x) => x.day === d.day && x.channel === "x");
                return (
                  <tr key={d.day} className="align-top">
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="font-medium">{fmtDay(d.day, lang)}</p>
                      <a href={`/api/social/card/${d.day}`} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                        {p.card}
                      </a>
                    </td>
                    <td className="px-3 py-3">
                      <ol className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
                        {d.slugs.map((slug, i) => {
                          const r = bySlug.get(slug);
                          const thumb = r?.previews?.[0];
                          const featured = post?.highlight === slug;
                          return (
                            <li key={slug} className={cn("flex items-center gap-2.5 rounded-xl border p-2", featured ? "border-accent bg-accent-soft/40" : "border-line")}>
                              {thumb ? (
                                <Image src={thumb.thumb} alt="" width={640} height={360} unoptimized className="aspect-video w-16 flex-none rounded-md border border-line bg-soft object-cover object-top" />
                              ) : (
                                <span className="flex aspect-video w-16 flex-none items-center justify-center rounded-md bg-soft text-xs text-muted">{i + 1}</span>
                              )}
                              <div className="min-w-0">
                                {r ? (
                                  <Link href={href(lang, `/r/${slug}`)} className="block truncate font-medium hover:text-accent">
                                    {r.name}
                                  </Link>
                                ) : (
                                  <span className="block truncate font-mono text-xs">{slug}</span>
                                )}
                                <p className="truncate text-xs text-muted">
                                  {r ? `${types[r.type]} · ${r.owner} · q${r.quality ?? "—"}` : p.missing}
                                  {featured && <span className="text-accent"> · {p.featured}</span>}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    </td>
                    <td className="w-40 px-3 py-3 text-xs">
                      {post ? (
                        <div className="space-y-1">
                          <span className={cn("rounded-full px-2 py-0.5 font-medium", TONE[post.status])}>{p.status[post.status]}</span>
                          {post.post_url && (
                            <a href={post.post_url} target="_blank" rel="noreferrer" className="block text-accent hover:underline">
                              x.com →
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
