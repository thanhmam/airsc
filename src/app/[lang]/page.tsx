import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight, BookOpen, Bug, CreditCard, Database, Layout, Lock, Palette, Rocket, Star, type LucideIcon,
} from "lucide-react";
import { HeroDemo } from "@/components/demos";
import { HeroSearch } from "@/components/home/hero-search";
import { KitArt } from "@/components/home/kit-art";
import { ResourceArt } from "@/components/home/resource-art";
import { TodaysPicks, type Pick, type SceneKind } from "@/components/home/todays-picks";
import { TYPE_ICON } from "@/components/icons";
import { SafetyBadge } from "@/components/safety-badge";
import { getGuides, getKit, getKits, getNewThisWeek, getResourcesBySlugs, getStats, getTrending } from "@/lib/data";
import { getDict, hasLocale, href, type Dict, type Locale } from "@/lib/i18n";
import { agentPrompt } from "@/lib/install-links";
import { compact } from "@/lib/utils";

/** Curated picks: each has a hand-made "what you get" scene on the homepage stage */
const PICKS: { slug: string; scene: SceneKind; cmds: string[] }[] = [
  {
    slug: "zarazhangrui-frontend-slides",
    scene: "slides",
    cmds: ["/plugin marketplace add https://github.com/zarazhangrui/frontend-slides", "/plugin install frontend-slides@frontend-slides"],
  },
  { slug: "tt-a1i-archify", scene: "diagram", cmds: ["npx skills add tt-a1i/archify -g"] },
  {
    slug: "executeautomation-mcp-playwright",
    scene: "browser",
    cmds: ["claude mcp add --transport stdio playwright npx @executeautomation/playwright-mcp-server"],
  },
  { slug: "obra-superpowers", scene: "plan", cmds: ["/plugin install superpowers@claude-plugins-official"] },
];

const GUIDE_ICON: [RegExp, LucideIcon][] = [
  [/deploy|devops/, Rocket],
  [/pay|commerce/, CreditCard],
  [/auth|security/, Lock],
  [/database|backend/, Database],
  [/web|app/, Layout],
  [/ui|design/, Palette],
  [/test|debug/, Bug],
];

const blurbOf = (r: { summary: string | null; summary_vi: string | null; description: string | null; description_vi: string | null }, lang: Locale) =>
  (lang === "vi" ? r.summary_vi || r.description_vi : r.summary) || r.description || "";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const h = t.home;
  const [stats, kits, picksRaw, fresh, loved, guides, landing] = await Promise.all([
    getStats(),
    getKits(),
    getResourcesBySlugs(PICKS.map((p) => p.slug)),
    getNewThisWeek(8),
    getTrending(8),
    getGuides(),
    getKit("beautiful-landing-page"),
  ]);

  const picks: Pick[] = picksRaw.map((r) => {
    const cfg = PICKS.find((p) => p.slug === r.slug)!;
    return {
      slug: r.slug,
      name: r.name,
      owner: r.owner,
      type: r.type,
      safety: r.safety,
      stars: r.stars,
      license: r.license,
      blurb: blurbOf(r, lang),
      prompt: agentPrompt(r),
      scene: cfg.scene,
      cmds: cfg.cmds,
    };
  });
  const demoResults = (landing?.items ?? []).slice(0, 3).map((r) => ({
    name: r.name,
    type: t.types[r.type],
    stars: compact(r.stars),
    safe: r.safety === "safe",
  }));
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const today = new Intl.DateTimeFormat(lang, { weekday: "short", month: "short", day: "numeric" }).format(new Date());
  const labels = { types: t.types, typesPlural: t.typesPlural, safety: t.safety };

  return (
    <>
      {/* Hero: sized to the viewport so the top of Today's picks peeks out below it */}
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(var(--dot)_1px,transparent_1.5px)] bg-[length:22px_22px] [mask-image:linear-gradient(to_bottom,#000_20%,transparent)]"
        />
        <div className="relative mx-auto flex min-h-[max(520px,calc(100svh-240px))] max-w-6xl flex-col items-center justify-center px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-[72px]">
          <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.08em] text-accent">{h.eyebrow}</p>
          <h1 className="max-w-[880px] text-[clamp(38px,5.2vw,68px)] font-semibold leading-[1.04] tracking-[-0.035em] text-balance">{h.title}</h1>
          <p className="mt-5 max-w-[560px] text-lg leading-[1.55] text-muted text-pretty">{h.subtitle}</p>
          <HeroSearch
            lang={lang}
            c={{
              label: h.searchLabel,
              button: h.searchBtn,
              phrases: h.phrases,
              tryLabel: h.tryLabel,
              tries: h.tries,
              all: h.all,
              safeOnly: h.safeOnly,
              result: h.result,
              results: h.results,
              forQuery: h.forQuery,
              noMatch: h.noMatch,
              noMatchSub: h.noMatchSub,
              seeAll: h.seeAll,
              keysHint: h.keysHint,
              clear: h.clear,
              ...labels,
            }}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="mb-[18px] flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5">
          <div className="flex items-center gap-3">
            <span aria-hidden className="a-pulse size-2.5 rounded-full bg-accent" />
            <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em]">{h.picksTitle}</h2>
            <span className="font-mono text-[13px] text-muted">{today}</span>
          </div>
          <p className="font-mono text-xs text-muted">{h.picksMeta(stats.total.toLocaleString(lang), stats.safe.toLocaleString(lang))}</p>
        </div>
        <TodaysPicks
          lang={lang}
          picks={picks}
          c={{
            tabResult: h.tabResult,
            tabInstall: h.tabInstall,
            walkNote: h.walkNote,
            installNote: h.installNote,
            installed: h.installed,
            getResource: h.getResource,
            copyPrompt: h.copyPrompt,
            copied: h.copied,
            noLicense: h.noLicense,
            browse: h.ctaBrowse,
            ...labels,
          }}
        />
        <h2 className="sr-only">{h.howTitle}</h2>
        <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-x-8 gap-y-5">
          {h.how.map((s, i) => (
            <div key={s.t} className="flex gap-3">
              <span className="flex-none pt-[3px] font-mono text-[13px] text-accent">0{i + 1}</span>
              <div>
                <h3 className="font-semibold">{s.t}</h3>
                <p className="mt-0.5 text-sm leading-normal text-muted">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Section title={h.kitsTitle} sub={h.kitsSub} more={{ to: href(lang, "/kits"), label: h.kitsAll }}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3">
          {kits.map((k) => (
            <Link
              key={k.slug}
              href={href(lang, `/kits/${k.slug}`)}
              className="kit lift flex flex-col gap-3 rounded-2xl border border-line bg-card px-2.5 pb-3.5 pt-2.5"
            >
              <KitArt icon={k.icon} />
              <span className="flex flex-col gap-0.5 px-1.5">
                <span className="font-medium leading-snug">{lang === "vi" ? k.title_vi : k.title}</span>
                <span className="text-xs text-muted">
                  {k.count} {k.count === 1 && lang === "en" ? "resource" : t.kits.items}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {fresh.length > 0 && (
        <Section title={t.content.newTitle} sub={t.content.newSub} more={{ to: href(lang, "/browse?sort=new"), label: h.newAll }}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3">
            {fresh.map((r) => {
              const TypeIcon = TYPE_ICON[r.type];
              return (
                <Link key={r.id} href={href(lang, `/r/${r.slug}`)} className="rc lift flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-card px-2.5 pb-3.5 pt-2.5">
                  <ResourceArt type={r.type} />
                  <span className="flex min-w-0 items-center gap-2.5 px-1.5">
                    <Avatar owner={r.owner} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold leading-tight tracking-tight">{r.name}</span>
                      <span className="block truncate text-xs text-muted">{r.owner}</span>
                    </span>
                    <SafetyBadge safety={r.safety} t={t} />
                  </span>
                  <span className="line-clamp-2 px-1.5 text-sm leading-relaxed text-muted">{blurbOf(r, lang)}</span>
                  <span className="mt-auto flex items-center gap-3 px-1.5 text-xs text-muted">
                    <span className="inline-flex items-center gap-[5px] font-medium text-fg">
                      <TypeIcon className="size-[13px]" aria-hidden />
                      {t.types[r.type]}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-[13px]" aria-hidden />
                      {compact(r.stars)}
                    </span>
                    {r.license && <span>{r.license}</span>}
                  </span>
                </Link>
              );
            })}
          </div>
        </Section>
      )}

      {loved.length > 0 && (
        <Section title={h.trendingTitle} more={{ to: href(lang, "/browse?sort=downloads"), label: h.lovedAll }}>
          <div className="overflow-hidden rounded-2xl border border-line bg-card">
            <div className="-mb-px grid grid-cols-[repeat(auto-fit,minmax(min(460px,100%),1fr))]">
              {loved.map((r, i) => (
                <LovedRow key={r.id} r={r} rank={i + 1} lang={lang} t={t} />
              ))}
            </div>
          </div>
        </Section>
      )}

      {guides.length > 0 && (
        <Section title={t.content.guidesTitle} sub={t.content.guidesSub} more={{ to: href(lang, "/guides"), label: h.guidesAll }}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3">
            {guides.slice(0, 6).map((g) => {
              const Icon = GUIDE_ICON.find(([re]) => re.test(g.slug))?.[1] ?? BookOpen;
              return (
                <Link
                  key={g.slug}
                  href={href(lang, `/guides/${g.slug}`)}
                  className="lift flex min-h-[60px] items-center gap-2.5 rounded-[14px] border border-line bg-card px-3.5 py-2 text-[14.5px] font-medium leading-tight"
                >
                  <Icon className="size-[18px] flex-none text-accent" aria-hidden />
                  <span className="line-clamp-2">{lang === "vi" ? g.title_vi : g.title}</span>
                </Link>
              );
            })}
          </div>
        </Section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap gap-x-12 gap-y-10 rounded-3xl bg-[#0f0f14] p-[clamp(24px,4vw,48px)] text-[#e8e8ee]">
          <div className="min-w-0 flex-[1_1_400px]">
            <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.08em] text-[#a99bff]">{h.mcpEyebrow}</p>
            <h2 className="text-[clamp(28px,3vw,38px)] font-semibold leading-[1.1] tracking-[-0.03em] text-white text-balance">{h.mcpTitle}</h2>
            <p className="mt-3.5 max-w-[480px] text-[16.5px] leading-[1.55] text-[#b4b3bd]">{t.mcp.sub}</p>
            <pre className="mt-6 whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-[#08070d] px-4 py-3.5 font-mono text-[12.5px] leading-[1.65]">
              {`claude mcp add --transport http airsc ${site}/api/mcp --header "Authorization: Bearer YOUR_AIRSC_KEY"`}
            </pre>
            <ul className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(210px,100%),1fr))] gap-x-5 gap-y-3 text-[13.5px] text-[#b4b3bd]">
              {h.mcpTools.map(([name, desc]) => (
                <li key={name}>
                  <code className="block font-mono text-[12.5px] text-white">{name}</code>
                  {desc}
                </li>
              ))}
            </ul>
            <Link
              href={href(lang, "/mcp")}
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-[#8f7bff] px-[18px] text-[15px] font-semibold text-[#0b0b0d] hover:opacity-90"
            >
              {h.mcpCta} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="min-w-0 flex-[1_1_440px] self-center">
            <HeroDemo lang={lang} results={demoResults} className="border-white/12 bg-[#08070d] shadow-none" />
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-3 px-4 pb-6 pt-6 text-center sm:px-6">
        <p className="text-muted">{h.freeLine}</p>
        <Link
          href={href(lang, "/support")}
          className="inline-flex h-11 items-center rounded-xl border border-line-strong bg-card px-4 text-sm font-medium hover:border-accent hover:text-accent"
        >
          {h.support} →
        </Link>
      </section>
    </>
  );
}

function Section({
  title,
  sub,
  more,
  children,
}: {
  title: string;
  sub?: string;
  more: { to: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em]">{title}</h2>
          {sub && <p className="mt-1 text-muted">{sub}</p>}
        </div>
        <Link href={more.to} className="hidden h-11 flex-none items-center text-sm font-medium text-accent hover:underline sm:inline-flex">
          {more.label} →
        </Link>
      </div>
      {children}
    </section>
  );
}

/** Repo owner's GitHub avatar over their initial, so a missing image still reads */
function Avatar({ owner }: { owner: string }) {
  return (
    <span aria-hidden className="relative grid size-9 flex-none place-items-center overflow-hidden rounded-[10px] bg-ink text-[15px] font-semibold text-bg">
      {owner.charAt(0).toUpperCase()}
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny external avatar, no optimisation needed */}
      <img src={`https://github.com/${owner}.png?size=72`} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
    </span>
  );
}

function LovedRow({
  r,
  rank,
  lang,
  t,
}: {
  r: Awaited<ReturnType<typeof getTrending>>[number];
  rank: number;
  lang: Locale;
  t: Dict;
}) {
  return (
    <Link href={href(lang, `/r/${r.slug}`)} className="flex h-[60px] min-w-0 items-center gap-3.5 border-b border-line px-[18px] hover:bg-soft">
      <span className="w-5 flex-none font-mono text-xs text-muted">{String(rank).padStart(2, "0")}</span>
      <span className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="truncate font-semibold tracking-tight">{r.name}</span>
        <span className="truncate text-[13px] text-muted">{r.owner}</span>
      </span>
      <span className="hidden flex-none text-xs text-muted sm:inline">{t.types[r.type]}</span>
      <SafetyBadge safety={r.safety} t={t} />
      <span className="w-[58px] flex-none text-right font-mono text-[12.5px]">★ {compact(r.stars)}</span>
    </Link>
  );
}
