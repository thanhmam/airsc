import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { db, type SocialPost } from "@/lib/engine/db";
import { socialSettings } from "@/lib/engine/settings";
import { href, type Locale } from "@/lib/i18n";
import { daysAgo } from "@/lib/social/compose";
import { engagementRate } from "@/lib/social/metrics";
import { isOpen, isOverdue } from "@/lib/social/publish";
import { xConfigured } from "@/lib/social/x";
import { fmtDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { draftToday } from "../../actions";
import { ActionButton } from "../action-button";
import { T } from "../copy";
import { QueueItem, TONE } from "../queue-item";

const firstLine = (t: string) => t.split("\n").find((l) => l.trim()) ?? "";

/** The queue: every post still waiting to go out, whatever its day, then what went out or was skipped in the last week */
export default async function SocialQueue({ params }: PageProps<"/[lang]/admin/social/queue">) {
  const { lang } = (await params) as { lang: Locale };
  const t = T[lang];
  const [settings, posts] = await Promise.all([db.settings(), db.socialPosts(400)]);
  const s = socialSettings(settings);
  const configured = xConfigured();
  const x = posts.filter((p) => p.channel === "x" && p.kind !== "picks");
  const queue = x.filter(isOpen).sort((a, b) => (a.scheduled_at ?? a.created_at).localeCompare(b.scheduled_at ?? b.created_at));
  const since = daysAgo(7);
  const recent = x
    .filter((p) => (p.status === "posted" || p.status === "skipped") && p.day >= since)
    .sort((a, b) => (b.posted_at ?? b.scheduled_at ?? b.created_at).localeCompare(a.posted_at ?? a.scheduled_at ?? a.created_at));
  const hours = s.x_slots_vn.map((h) => `${String(h).padStart(2, "0")}:30`).join(", ");
  const auto = !s.x_enabled ? t.autoState.off : s.x_auto ? t.autoState.on.replace("{hours}", hours || "—") : t.autoState.manual;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t.queue}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">{t.intro}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton action={draftToday} label={t.draftToday} done={t.drafted} />
          <Link href={href(lang, "/admin/social/new")} className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg hover:opacity-90">
            {t.applied.title}
          </Link>
        </div>
      </div>
      <p className={cn("rounded-xl border px-3 py-2 text-sm", s.x_enabled && s.x_auto ? "border-caution/40 bg-caution-soft text-caution" : "border-line bg-card text-muted")}>
        {auto}{" "}
        <Link href={href(lang, "/admin/social/settings")} className="underline">
          {t.settings}
        </Link>
      </p>
      {!queue.length && <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">{t.queueEmpty}</p>}
      {queue.map((p) => (
        <QueueItem key={p.id} post={p} overdue={isOverdue(p)} lang={lang} configured={configured} defaults={{ style: s.x_card_style, theme: s.x_card_theme }} t={t} />
      ))}

      <section className="space-y-2 pt-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-base font-semibold">{t.recent.title}</h2>
          <Link href={href(lang, "/admin/social/posts")} className="text-sm text-accent hover:underline">
            {t.recent.all}
          </Link>
        </div>
        <p className="max-w-3xl text-sm text-muted">{t.recent.intro}</p>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
          {!recent.length && <li className="px-3 py-6 text-center text-sm text-muted">{t.posts.empty}</li>}
          {recent.map((p) => (
            <RecentRow key={p.id} post={p} lang={lang} t={t} />
          ))}
        </ul>
      </section>
    </div>
  );
}

/** A post that is done: when, what, how it went, and links to its page and to X */
function RecentRow({ post: p, lang, t }: { post: SocialPost; lang: Locale; t: (typeof T)["en"] }) {
  const er = engagementRate(p);
  return (
    <li className="flex flex-col gap-1.5 p-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted sm:w-64 sm:shrink-0">
        <span className="tabular-nums">{fmtDateTime(p.posted_at ?? p.scheduled_at ?? p.created_at, lang)}</span>
        <span>{t.kind[p.kind]}</span>
        <span className={cn("rounded-full px-2 py-0.5 font-medium", TONE[p.status])}>{t.status[p.status]}</span>
      </div>
      <Link href={href(lang, `/admin/social/posts/${p.id}`)} className="min-w-0 flex-1 truncate text-sm text-accent hover:underline" title={p.text}>
        {firstLine(p.text)}
      </Link>
      <div className="flex shrink-0 items-center gap-3 text-xs tabular-nums text-muted">
        {p.status === "posted" && (
          <span>
            {p.impressions ?? "—"} {t.recent.views} · {er === null ? "—" : `${er.toFixed(1)}%`}
          </span>
        )}
        {p.post_url && (
          <a href={p.post_url} target="_blank" rel="noreferrer" aria-label={t.posts.openX} title={t.posts.openX} className="inline-flex hover:text-accent">
            <ExternalLink className="size-4" aria-hidden />
          </a>
        )}
      </div>
    </li>
  );
}
