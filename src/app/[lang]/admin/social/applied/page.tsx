import { ExternalLink, GitPullRequest } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AIRSC_RUNS, REPO } from "@/lib/airsc-runs";
import { db, type SocialPost } from "@/lib/engine/db";
import { href, type Locale } from "@/lib/i18n";
import { loadResources } from "@/lib/social/compose";
import { engagementRate } from "@/lib/social/metrics";
import { summarize } from "@/lib/social/review";
import { cn } from "@/lib/utils";
import { T } from "../copy";
import { TONE } from "../queue-item";

const num = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US"));
const firstLine = (t: string) => t.split("\n").find((l) => l.trim()) ?? "";
const box = "rounded-2xl border border-line bg-card p-4";
const label = "text-xs font-medium uppercase tracking-wide text-muted";
const link = "inline-flex items-center gap-1.5 text-accent hover:underline";

/**
 * Everything Airsc applied to its own code in one place: each run (src/lib/airsc-runs.ts) with its task,
 * the images of the result (public/runs/<slug>/), the code in the repo, and the applied X posts about it
 */
export default async function SocialApplied({ params }: PageProps<"/[lang]/admin/social/applied">) {
  const { lang } = (await params) as { lang: Locale };
  const t = T[lang];
  const a = t.hub;
  const runs = Object.entries(AIRSC_RUNS).sort((x, y) => y[1].date.localeCompare(x[1].date));
  const [posts, rows] = await Promise.all([db.socialPosts(400), loadResources(runs.map(([slug]) => slug))]);
  const applied = posts.filter((p) => p.channel === "x" && p.kind === "applied" && p.status !== "skipped");
  const sent = summarize(posts.filter((p) => p.channel === "x" && p.status === "posted"));
  const others = applied.filter((p) => !p.highlight || !AIRSC_RUNS[p.highlight]);
  const unposted = runs.filter(([slug]) => !applied.some((p) => p.highlight === slug)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{a.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">{a.intro}</p>
        </div>
        <Link href={href(lang, "/admin/social/new")} className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg hover:opacity-90">
          {t.applied.title}
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { k: a.stats.applied, v: sent.applied },
          { k: a.stats.spotlight, v: sent.spotlight },
        ].map(({ k, v }) => (
          <div key={k} className={box}>
            <p className="text-xs text-muted">
              {k} · {v.posts} posts
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {num(v.median_views)} <span className="text-sm font-normal text-muted">{t.medianViews}</span>
            </p>
            <p className="text-sm tabular-nums text-muted">
              {v.median_engagement_pct === null ? "—" : `${v.median_engagement_pct}%`} {t.medianEr}
            </p>
          </div>
        ))}
        <div className={box}>
          <p className="text-xs text-muted">{a.stats.runs}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {runs.length} <span className="text-sm font-normal text-muted">{a.stats.runsUnit}</span>
          </p>
          <p className="text-sm tabular-nums text-muted">
            {unposted} {a.stats.unposted}
          </p>
        </div>
      </div>

      {runs.map(([slug, run]) => {
        const name = rows.find((r) => r.slug === slug)?.name ?? slug;
        const mine = applied.filter((p) => p.highlight === slug);
        return (
          <article key={slug} className={cn(box, "space-y-4")}>
            <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-base font-semibold">{name}</h2>
              <a href={href(lang, `/r/${slug}`)} target="_blank" rel="noreferrer" className="font-mono text-xs text-muted hover:text-accent">
                {slug}
              </a>
              <span className="ml-auto text-xs tabular-nums text-muted">
                {run.date} · {run.agent}
              </span>
            </header>
            <p className="max-w-3xl text-sm leading-relaxed">{run.task[lang]}</p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {run.images.map((img) => (
                <figure key={img.src} className="space-y-1.5">
                  <a href={img.src} target="_blank" rel="noreferrer">
                    <Image src={img.src} alt={img.caption[lang]} width={img.width} height={img.height} unoptimized className="h-auto w-full rounded-xl border border-line" />
                  </a>
                  <figcaption className="text-xs leading-relaxed text-muted">{img.caption[lang]}</figcaption>
                </figure>
              ))}
            </div>

            <div className="grid gap-4 border-t border-line pt-3 md:grid-cols-2">
              <div className="space-y-1.5 text-sm">
                <p className={label}>{a.code}</p>
                <a href={`${REPO}/pull/${run.code.pr}`} target="_blank" rel="noreferrer" className={link}>
                  <GitPullRequest className="size-4" aria-hidden /> PR #{run.code.pr}
                </a>
                <p className="flex flex-wrap gap-x-3 gap-y-1">
                  {run.code.commits.map((c) => (
                    <a key={c} href={`${REPO}/commit/${c}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-accent hover:underline">
                      {c}
                    </a>
                  ))}
                </p>
                {run.code.files?.map((f) => (
                  <a key={f} href={`${REPO}/${f.endsWith("/") ? "tree" : "blob"}/main/${f.replace(/\/$/, "")}`} target="_blank" rel="noreferrer" className="block break-all font-mono text-xs text-accent hover:underline">
                    {f}
                  </a>
                ))}
                <p className="break-all font-mono text-xs text-muted">public/runs/{slug}/</p>
              </div>

              <div className="space-y-1.5 text-sm">
                <p className={label}>{a.posts}</p>
                {mine.map((p) => (
                  <PostLine key={p.id} post={p} lang={lang} t={t} />
                ))}
                {!mine.length && <p className="text-muted">{a.noPost}</p>}
                <Link href={href(lang, `/admin/social/new?preset=${slug}`)} className={cn(link, "pt-1")}>
                  {mine.length ? a.writeAnother : a.write}
                </Link>
              </div>
            </div>
          </article>
        );
      })}

      {others.length > 0 && (
        <section className={cn(box, "space-y-2")}>
          <h2 className="text-base font-semibold">{a.othersTitle}</h2>
          <p className="text-sm text-muted">{a.othersIntro}</p>
          {others.map((p) => (
            <PostLine key={p.id} post={p} lang={lang} t={t} />
          ))}
        </section>
      )}
    </div>
  );
}

/** One applied post: status, first line, its numbers once it is out, and links to its page and to X */
function PostLine({ post: p, lang, t }: { post: SocialPost; lang: Locale; t: (typeof T)["en"] }) {
  const er = engagementRate(p);
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", TONE[p.status])}>{t.status[p.status]}</span>
      <Link href={href(lang, `/admin/social/posts/${p.id}`)} className="min-w-0 flex-1 truncate text-accent hover:underline" title={p.text}>
        #{p.id} {firstLine(p.text)}
      </Link>
      {p.status === "posted" && (
        <span className="text-xs tabular-nums text-muted">
          {num(p.impressions)} {t.recent.views} · {er === null ? "—" : `${er.toFixed(1)}%`}
        </span>
      )}
      {p.post_url && (
        <a href={p.post_url} target="_blank" rel="noreferrer" aria-label={t.posts.openX} title={t.posts.openX} className="inline-flex text-muted hover:text-accent">
          <ExternalLink className="size-4" aria-hidden />
        </a>
      )}
    </div>
  );
}
