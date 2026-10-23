import Image from "next/image";
import type { SocialPost } from "@/lib/engine/db";
import type { CardStyle, CardTheme } from "@/lib/engine/settings";
import type { Locale } from "@/lib/i18n";
import { fmtDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { CardControls } from "./card-controls";
import type { SocialCopy } from "./copy";
import { PostEditor } from "./editor";

export const TONE: Record<string, string> = {
  posted: "bg-safe-soft text-safe",
  failed: "bg-danger-soft text-danger",
  posting: "bg-caution-soft text-caution",
  approved: "bg-safe-soft text-safe",
  draft: "bg-accent-soft text-accent",
  skipped: "bg-soft text-muted",
};

/** One post in the queue: its editor on the left, its card (spotlight) or screenshots (applied) on the right */
export function QueueItem({
  post,
  overdue,
  lang,
  configured,
  defaults,
  t,
}: {
  post: SocialPost;
  overdue: boolean;
  lang: Locale;
  configured: boolean;
  defaults: { style: CardStyle; theme: CardTheme };
  t: SocialCopy;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{t.kind[post.kind]}</span>
        {post.highlight && <span className="font-mono text-xs text-muted">{post.highlight}</span>}
        {post.scheduled_at && (
          <span className="text-muted">
            · {t.at} {fmtDateTime(post.scheduled_at, lang)}
          </span>
        )}
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", TONE[post.status])}>{t.status[post.status]}</span>
        {overdue && <span className="rounded-full bg-caution-soft px-2 py-0.5 text-xs font-medium text-caution">{t.overdue}</span>}
        {post.post_url && (
          <a href={post.post_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
            {post.post_url}
          </a>
        )}
      </div>
      {post.error && <p className="mb-3 rounded-lg bg-danger-soft p-2 font-mono text-xs text-danger">{post.error}</p>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <PostEditor key={post.updated_at} post={post} configured={configured} c={t.editor} />
        {post.kind === "applied" ? (
          <div className="flex flex-wrap content-start gap-2">
            {post.images.map((u) => (
              <a key={u} href={u} target="_blank" rel="noreferrer">
                <Image src={u} alt={post.image_alt ?? ""} width={320} height={200} unoptimized className="h-40 w-auto rounded-lg border border-line" />
              </a>
            ))}
            {post.note && <p className="w-full whitespace-pre-wrap text-xs text-muted">{post.note}</p>}
          </div>
        ) : (
          <CardControls key={post.updated_at} post={post} defaults={defaults} c={t.card} />
        )}
      </div>
    </div>
  );
}
