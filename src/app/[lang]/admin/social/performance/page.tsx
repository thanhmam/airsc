import { db } from "@/lib/engine/db";
import type { Locale } from "@/lib/i18n";
import { engagementRate } from "@/lib/social/metrics";
import { lastTwoPeriods } from "@/lib/social/review";
import { fmtDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { refreshSocialMetrics } from "../../actions";
import { ActionButton } from "../action-button";
import { T } from "../copy";

const num = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US"));
const firstLine = (t: string) => t.split("\n").find((l) => l.trim()) ?? "";

/** Views and engagement of every post that went out, and the last three days against the three before */
export default async function SocialPerformance({ params }: PageProps<"/[lang]/admin/social/performance">) {
  const { lang } = (await params) as { lang: Locale };
  const t = T[lang];
  const posts = await db.socialPosts(200);
  const sent = posts.filter((p) => p.status === "posted" && p.posted_at).sort((a, b) => b.posted_at!.localeCompare(a.posted_at!));
  const { last, previous } = lastTwoPeriods(sent);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t.performance}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{t.perfIntro}</p>
      </div>
      <ActionButton action={refreshSocialMetrics} label={t.refresh} done={t.refreshed} />
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
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-line">
              {t.cols.map((c, i) => (
                <th key={c} className={cn("px-3 py-2.5 font-medium", i > 2 && "text-right")}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sent.slice(0, 60).map((p) => {
              const er = engagementRate(p);
              return (
                <tr key={p.id} className="hover:bg-soft/60">
                  <td className="whitespace-nowrap px-3 py-2 text-xs">
                    <a href={p.post_url ?? "#"} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                      {fmtDateTime(p.posted_at!, lang)}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-xs">{t.kind[p.kind]}</td>
                  <td className="max-w-[340px] truncate px-3 py-2 text-xs" title={p.text}>
                    {firstLine(p.text)}
                  </td>
                  {[p.impressions, p.likes, p.reposts, p.replies, p.bookmarks, p.link_clicks, p.profile_clicks].map((v, i) => (
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
