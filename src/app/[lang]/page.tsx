import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroDemo } from "@/components/demos";
import { KIT_ICON } from "@/components/icons";
import { ResourceCard } from "@/components/resource-card";
import { SearchBox } from "@/components/search-box";
import { getGuides, getKit, getKits, getNewThisWeek, getStats, getTrending } from "@/lib/data";
import { getDict, hasLocale, href } from "@/lib/i18n";
import { compact } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const [stats, kits, trending, landing, fresh, guides] = await Promise.all([
    getStats(),
    getKits(),
    getTrending(8),
    getKit("beautiful-landing-page"),
    getNewThisWeek(8),
    getGuides(),
  ]);
  const heroResults = (landing?.items ?? []).slice(0, 3).map((r) => ({
    name: r.name,
    type: t.types[r.type],
    stars: compact(r.stars),
    safe: r.safety === "safe",
  }));

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] bg-[radial-gradient(60%_50%_at_50%_0%,var(--accent-soft),transparent)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-muted">
              {t.home.eyebrow}
            </p>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl">{t.home.title}</h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted text-pretty">{t.home.subtitle}</p>
            <SearchBox lang={lang} placeholder={t.home.searchPlaceholder} size="lg" />
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={href(lang, "/browse")}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg hover:opacity-90"
              >
                {t.home.ctaBrowse} <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href={href(lang, "/mcp")} className="rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-medium hover:border-fg/30">
                {t.home.ctaMcp}
              </Link>
            </div>
            <dl className="flex flex-wrap gap-x-8 gap-y-2 pt-2 text-sm">
              <div><dt className="sr-only">{t.home.stats.resources}</dt><dd><b className="tabular-nums">{stats.total.toLocaleString(lang)}</b> <span className="text-muted">{t.home.stats.resources}</span></dd></div>
              <div><dt className="sr-only">{t.home.stats.safe}</dt><dd><b className="tabular-nums">{stats.safe.toLocaleString(lang)}</b> <span className="text-muted">{t.home.stats.safe}</span></dd></div>
              <div><dd className="text-muted">{t.home.stats.updated}</dd></div>
            </dl>
          </div>
          <HeroDemo lang={lang} results={heroResults} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t.home.kitsTitle}</h2>
            <p className="mt-1 text-muted">{t.home.kitsSub}</p>
          </div>
          <Link href={href(lang, "/kits")} className="hidden shrink-0 text-sm font-medium text-accent hover:underline sm:block">
            {t.nav.kits} →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {kits.map((k) => {
            const Icon = KIT_ICON[k.icon] ?? KIT_ICON.box;
            return (
              <Link
                key={k.slug}
                href={href(lang, `/kits/${k.slug}`)}
                className="group flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 transition hover:-translate-y-0.5 hover:border-accent/50"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <span className="font-medium leading-snug group-hover:text-accent">{lang === "vi" ? k.title_vi : k.title}</span>
                <span className="mt-auto text-xs text-muted">
                  {k.count} {k.count === 1 && lang === "en" ? "resource" : t.kits.items}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {fresh.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{t.content.newTitle}</h2>
              <p className="mt-1 text-muted">{t.content.newSub}</p>
            </div>
            <Link href={href(lang, "/browse?sort=new")} className="hidden shrink-0 text-sm font-medium text-accent hover:underline sm:block">
              {t.nav.browse} →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {fresh.map((r) => (
              <ResourceCard key={r.id} r={r} lang={lang} t={t} />
            ))}
          </div>
        </section>
      )}

      {guides.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{t.content.guidesTitle}</h2>
              <p className="mt-1 text-muted">{t.content.guidesSub}</p>
            </div>
            <Link href={href(lang, "/guides")} className="hidden shrink-0 text-sm font-medium text-accent hover:underline sm:block">
              {t.nav.guides} →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {guides.slice(0, 6).map((g) => (
              <Link
                key={g.slug}
                href={href(lang, `/guides/${g.slug}`)}
                className="group rounded-2xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:border-accent/50"
              >
                <h3 className="font-semibold leading-snug group-hover:text-accent">{lang === "vi" ? g.title_vi : g.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{lang === "vi" ? g.description_vi : g.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">{t.home.trendingTitle}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {trending.map((r) => (
            <ResourceCard key={r.id} r={r} lang={lang} t={t} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">{t.home.howTitle}</h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {t.home.how.map((s, i) => (
            <li key={s.t} className="rounded-2xl border border-line bg-card p-5">
              <span className="font-mono text-sm text-accent">0{i + 1}</span>
              <h3 className="mt-2 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-center text-sm text-muted">
          {t.home.freeLine}{" "}
          <Link href={href(lang, "/support")} className="font-medium text-accent hover:underline">
            {t.nav.pricing} →
          </Link>
        </p>
      </section>
    </>
  );
}
