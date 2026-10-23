import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { db, type SocialPost } from "@/lib/engine/db";
import { href, type Locale } from "@/lib/i18n";
import { engagementRate } from "@/lib/social/metrics";
import { isOpen } from "@/lib/social/publish";
import { lastTwoPeriods } from "@/lib/social/review";
import { fmtDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { refreshSocialMetrics } from "../../actions";
import { ActionButton } from "../action-button";
import { T } from "../copy";
import { TONE } from "../queue-item";

const num = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US"));
const firstLine = (t: string) => t.split("\n").find((l) => l.trim()) ?? "";

const FILTERS = ["all", "posted", "waiting", "skipped"] as const;
type Filter = (typeof FILTERS)[number];

const matches = (p: SocialPost, f: Filter) =>
  f === "all" || (f === "posted" && p.status === "posted") || (f === "waiting" && isOpen(p)) || (f === "skipped" && p.status === "skipped");

/** Every post with the numbers X reports for it: when, what, how it went, and a link to its full page and to X */
export default async function SocialPosts({ params, searchParams }: PageProps<"/[lang]/admin/social/posts">) {
  const { lang } = (await params) as { lang: Locale };
  const q = await searchParams;
  const asked = String(Array.isArray(q.status) ? q.status[0] : (q.status ?? ""));
  const filter: Filter = (FILTERS as readonly string[]).includes(asked) ? (asked as Filter) : "all";
  const t = T[lang];
  const p = t.posts;

  const all = (await db.socialPosts(400)).filter((x) => x.channel === "x");
  const sent = all.filter((x) => x.status === "posted" && x.posted_at);
  const { last, previous } = lastTwoPeriods(sent);
  const rows = all
    .filter((x) => matches(x, filter))
    .sort((a, b) => (b.posted_at ?? b.scheduled_at ?? b.created_at).localeCompare(a.posted_at ?? a.scheduled_at ?? a.created_at));
  const base = href(lang, "/admin/social/posts");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{p.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            {p.intro} {t.perfIntro}
          </p>
        </div>
        <ActionButton action={refreshSocialMetrics} label={t.refresh} done={t.refreshed} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: t.last3, v: last },
          { label: t.prev3, v: previous },
        ].map(({ label, v }) => (
          <div key={label} className="rounded-2xl border border-line bg-card p-4">
            <p className="text-xs text-muted">
              {label} · {v.posts} posts
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {num(v.median_views)} <span className="text-sm font-normal text-muted">{t.medianViews}</span>
            </p>
            <p className="text-sm tabular-nums text-muted">
              {v.median_engagement_pct === null ? "—" : `${v.median_engagement_pct}%`} {t.medianEr} · {v.likes} likes · {v.reposts} reposts · {v.link_clicks} link clicks
            </p>
          </div>
        ))}
      </div>

      <nav aria-label={p.title} className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? base : `${base}?status=${f}`}
            aria-current={filter === f ? "page" : undefined}
            className={cn("rounded-full border px-3 py-1 text-sm", filter === f ? "border-accent bg-accent-soft font-medium text-accent" : "border-line text-muted hover:text-fg")}
          >
            {p.filters[f]} <span className="tabular-nums text-xs opacity-70">{all.filter((x) => matches(x, f)).length}</span>
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[1040px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-line">
              {p.cols.map((c, i) => (
                <th key={c} className={cn("px-3 py-2.5 font-medium", i > 4 && "text-right")}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {!rows.length && (
              <tr>
                <td colSpan={p.cols.length} className="px-3 py-6 text-center text-muted">
                  {p.empty}
                </td>
              </tr>
            )}
            {rows.map((x) => {
              const er = engagementRate(x);
              return (
                <tr key={x.id} className="hover:bg-soft/60">
                  <td className="whitespace-nowrap px-3 py-2 text-xs tabular-nums">{fmtDateTime(x.posted_at ?? x.scheduled_at ?? x.created_at, lang)}</td>
                  <td className="px-3 py-2 text-xs">{t.kind[x.kind]}</td>
                  <td className="px-3 py-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", TONE[x.status])}>{t.status[x.status]}</span>
                  </td>
                  <td className="max-w-[360px] px-3 py-2 text-xs">
                    <Link href={href(lang, `/admin/social/posts/${x.id}`)} className="line-clamp-2 text-accent hover:underline" title={x.text}>
                      {firstLine(x.text)}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {x.post_url ? (
                      <a href={x.post_url} target="_blank" rel="noreferrer" aria-label={p.openX} title={p.openX} className="inline-flex text-muted hover:text-accent">
                        <ExternalLink className="size-4" aria-hidden />
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  {[x.impressions, x.likes, x.reposts, x.replies, x.bookmarks, x.link_clicks, x.profile_clicks].map((v, i) => (
                    <td key={i} className="px-3 py-2 text-right tabular-nums">
                      {num(v)}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right tabular-nums">{er === null ? "—" : `${er.toFixed(1)}%`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
