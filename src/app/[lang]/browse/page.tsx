import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { TYPE_ICON } from "@/components/icons";
import { ResourceCard } from "@/components/resource-card";
import { SearchBox } from "@/components/search-box";
import { getCategoryCounts, getTypeCounts, searchResources, type SortKey } from "@/lib/data";
import { getDict, hasLocale, href } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/taxonomy";
import { RESOURCE_TYPES, type ResourceType } from "@/lib/types";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[lang]/browse">): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDict(hasLocale(lang) ? lang : "en").browse.title };
}

const PAGE_SIZE = 24;

function Item({ to, active, count, lang, children }: { to: string; active: boolean; count?: number; lang: string; children: React.ReactNode }) {
  return (
    <Link
      href={to}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition",
        active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-soft hover:text-fg",
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 [&>svg]:size-4 [&>svg]:shrink-0">{children}</span>
      {count !== undefined && <span className="text-xs tabular-nums opacity-70">{count.toLocaleString(lang)}</span>}
    </Link>
  );
}


export default async function Browse({ params, searchParams }: PageProps<"/[lang]/browse">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) as string | undefined;
  const q = one("q")?.trim() || undefined;
  const type = RESOURCE_TYPES.includes(one("type") as ResourceType) ? (one("type") as ResourceType) : undefined;
  const sort = (["stars", "recent", "downloads", "new"].includes(one("sort") ?? "") ? one("sort") : "stars") as SortKey;
  const category = CATEGORIES.some((c) => c.slug === one("category")) ? one("category") : undefined;
  const safe = one("safe") === "1";
  const page = Math.max(1, Number(one("page")) || 1);

  const [{ items, total }, categoryCounts, typeCounts] = await Promise.all([
    searchResources({ q, type, category, safeOnly: safe, sort, page, pageSize: PAGE_SIZE }),
    getCategoryCounts(),
    getTypeCounts(),
  ]);
  const pages = Math.ceil(total / PAGE_SIZE);
  const allCount = Object.values(typeCounts).reduce((a, b) => a + b, 0);
  const activeFilters = [type, category, safe ? "1" : undefined].filter(Boolean).length;

  const link = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { q, type, category, sort: sort === "stars" ? undefined : sort, safe: safe ? "1" : undefined, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && next.set(k, v));
    const s = next.toString();
    return href(lang, "/browse") + (s ? `?${s}` : "");
  };

  const filters = (
    <div className="space-y-6">
      <section aria-labelledby="f-type">
        <h2 id="f-type" className="mb-1.5 px-2.5 text-xs font-semibold uppercase tracking-wide text-muted">{t.browse.type}</h2>
        <nav className="space-y-0.5">
          <Item lang={lang} to={link({ type: undefined, page: undefined })} active={!type} count={allCount}>{t.browse.all}</Item>
          {RESOURCE_TYPES.map((ty) => {
            const Icon = TYPE_ICON[ty];
            return (
              <Item key={ty} lang={lang} to={link({ type: ty, page: undefined })} active={type === ty} count={typeCounts[ty] ?? 0}>
                <Icon aria-hidden />
                {t.typesPlural[ty]}
              </Item>
            );
          })}
        </nav>
      </section>

      {Object.keys(categoryCounts).length > 0 && (
        <section aria-labelledby="f-cat">
          <h2 id="f-cat" className="mb-1.5 px-2.5 text-xs font-semibold uppercase tracking-wide text-muted">{t.browse.category}</h2>
          <nav className="space-y-0.5">
            <Item lang={lang} to={link({ category: undefined, page: undefined })} active={!category}>{t.content.allCategories}</Item>
            {CATEGORIES.filter((c) => categoryCounts[c.slug]).map((c) => (
              <Item key={c.slug} lang={lang} to={link({ category: c.slug, page: undefined })} active={category === c.slug} count={categoryCounts[c.slug]}>
                {c[lang]}
              </Item>
            ))}
          </nav>
        </section>
      )}

      <section aria-labelledby="f-safe">
        <h2 id="f-safe" className="mb-1.5 px-2.5 text-xs font-semibold uppercase tracking-wide text-muted">{t.browse.safety}</h2>
        <Item lang={lang} to={link({ safe: safe ? undefined : "1", page: undefined })} active={safe}>
          <ShieldCheck aria-hidden />
          {t.browse.onlySafe}
        </Item>
      </section>

      {activeFilters > 0 && (
        <Link href={link({ type: undefined, category: undefined, safe: undefined, page: undefined })} className="flex items-center gap-1.5 px-2.5 text-sm text-muted hover:text-fg">
          <X className="size-4" aria-hidden /> {t.browse.clear}
        </Link>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        {/* desktop: sticky left navigation */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">{filters}</div>
        </aside>

        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">{t.browse.title}</h1>
          <div className="mt-5 max-w-2xl">
            <SearchBox
              lang={lang}
              placeholder={t.home.searchPlaceholder}
              defaultValue={q}
              hidden={{ type, category, sort: sort === "stars" ? undefined : sort, safe: safe ? "1" : undefined }}
            />
          </div>

          {/* mobile: filters collapse into a panel */}
          <details className="mt-4 rounded-xl border border-line bg-card lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-sm font-medium">
              <SlidersHorizontal className="size-4" aria-hidden /> {t.browse.filters}
              {activeFilters > 0 && <span className="rounded-full bg-accent px-1.5 text-xs text-accent-fg">{activeFilters}</span>}
            </summary>
            <div className="border-t border-line p-3">{filters}</div>
          </details>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-muted">
              <b className="tabular-nums text-fg">{total.toLocaleString(lang)}</b> {t.browse.results}
              {q && <> · “{q}”</>}
            </p>
            <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-card p-1" role="group" aria-label={t.browse.sortBy}>
              {(
                [
                  ["stars", t.browse.sortStars],
                  ["recent", t.browse.sortRecent],
                  ["downloads", t.browse.sortDownloads],
                  ["new", t.browse.sortNew],
                ] as const
              ).map(([key, label]) => (
                <Link
                  key={key}
                  href={link({ sort: key === "stars" ? undefined : key, page: undefined })}
                  className={cn("shrink-0 rounded-lg px-3 py-1", sort === key ? "bg-soft font-medium text-fg" : "text-muted hover:text-fg")}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {items.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((r) => (
                <ResourceCard key={r.id} r={r} lang={lang} t={t} />
              ))}
            </div>
          ) : (
            <p className="mt-16 text-center text-muted">{t.browse.none}</p>
          )}

          {pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-3 text-sm" aria-label="Pagination">
              {page > 1 && (
                <Link href={link({ page: String(page - 1) })} className="rounded-lg border border-line bg-card px-3 py-1.5 hover:border-fg/30">
                  ← {t.browse.prev}
                </Link>
              )}
              <span className="tabular-nums text-muted">
                {page} / {pages}
              </span>
              {page < pages && (
                <Link href={link({ page: String(page + 1) })} className="rounded-lg border border-line bg-card px-3 py-1.5 hover:border-fg/30">
                  {t.browse.next} →
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
