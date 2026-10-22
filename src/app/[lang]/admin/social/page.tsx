import Link from "next/link";
import { db } from "@/lib/engine/db";
import { socialSettings } from "@/lib/engine/settings";
import { href, type Locale } from "@/lib/i18n";
import { vnDay } from "@/lib/social/compose";
import { xConfigured } from "@/lib/social/x";
import { draftToday } from "../actions";
import { ActionButton } from "./action-button";
import { T } from "./copy";
import { QueueItem } from "./queue-item";

/** The queue: today's and upcoming X posts, to edit, approve, post or skip */
export default async function SocialQueue({ params }: PageProps<"/[lang]/admin/social">) {
  const { lang } = (await params) as { lang: Locale };
  const t = T[lang];
  const today = vnDay();
  const [settings, posts] = await Promise.all([db.settings(), db.socialPosts(200)]);
  const s = socialSettings(settings);
  const configured = xConfigured();
  const queue = posts
    .filter((p) => p.day >= today && p.channel === "x" && (p.status !== "posted" || p.day === today))
    .sort((a, b) => (a.scheduled_at ?? a.created_at).localeCompare(b.scheduled_at ?? b.created_at));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t.title} · {t.queue}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{t.intro}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ActionButton action={draftToday} label={t.draftToday} done={t.drafted} />
        <Link href={href(lang, "/admin/social/new")} className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg hover:opacity-90">
          {t.applied.title}
        </Link>
      </div>
      {!queue.length && <p className="text-sm text-muted">{t.queueEmpty}</p>}
      {queue.map((p) => (
        <QueueItem key={p.id} post={p} lang={lang} configured={configured} defaults={{ style: s.x_card_style, theme: s.x_card_theme }} t={t} />
      ))}
    </div>
  );
}
