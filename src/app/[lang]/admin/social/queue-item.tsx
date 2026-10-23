import Image from "next/image";
import Link from "next/link";
import type { SocialPost } from "@/lib/engine/db";
import type { CardStyle, CardTheme } from "@/lib/engine/settings";
import { href, type Locale } from "@/lib/i18n";
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

/** An applied post's one image, full width of its column, with its description and the notes it was written from */
function AppliedPreview({ post, t }: { post: SocialPost; t: SocialCopy }) {
  const src = post.images[0];
  return (
    <div className="flex flex-col gap-3">
      {src && (
        <a href={src} target="_blank" rel="noreferrer">
          <Image src={src} alt={post.image_alt ?? ""} width={1600} height={900} unoptimized className="h-auto w-full rounded-xl border border-line" />
        </a>
      )}
      {post.image_alt && (
        <details open className="text-xs text-muted">
          <summary className="cursor-pointer">{t.card.alt}</summary>
          <p className="mt-1.5 leading-relaxed">{post.image_alt}</p>
        </details>
      )}
      {post.note && (
        <details open className="text-xs text-muted">
          <summary className="cursor-pointer">{t.posts.notes}</summary>
          <p className="mt-1.5 whitespace-pre-wrap leading-relaxed">{post.note}</p>
        </details>
      )}
    </div>
  );
}

/** One post in the queue: a header with what it is and when, the editor with its picture, and the actions */
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
    <article className="overflow-hidden rounded-2xl border border-line bg-card">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line px-4 py-3 text-sm">
        <span className="font-semibold">{t.kind[post.kind]}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", TONE[post.status])}>{t.status[post.status]}</span>
        {overdue && <span className="rounded-full bg-caution-soft px-2 py-0.5 text-xs font-medium text-caution">{t.overdue}</span>}
        {post.highlight && (
          <a href={href(lang, `/r/${post.highlight}`)} target="_blank" rel="noreferrer" className="font-mono text-xs text-muted hover:text-accent">
            {post.highlight}
          </a>
        )}
        <span className="ml-auto flex items-center gap-3 text-muted">
          {post.scheduled_at && <span className="tabular-nums">{fmtDateTime(post.scheduled_at, lang)}</span>}
          <Link href={href(lang, `/admin/social/posts/${post.id}`)} className="text-accent hover:underline">
            #{post.id}
          </Link>
        </span>
      </header>
      {post.error && <p className="mx-4 mt-3 rounded-lg bg-danger-soft p-2 font-mono text-xs text-danger">{post.error}</p>}
      <PostEditor
        key={post.updated_at}
        post={post}
        configured={configured}
        c={t.editor}
        preview={post.kind === "applied" ? <AppliedPreview post={post} t={t} /> : <CardControls post={post} defaults={defaults} c={t.card} />}
      />
    </article>
  );
}
