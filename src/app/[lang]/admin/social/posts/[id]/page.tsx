import { ArrowLeft, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/engine/db";
import { href, type Locale } from "@/lib/i18n";
import { engagementRate } from "@/lib/social/metrics";
import { isOpen } from "@/lib/social/publish";
import { fmtDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { T } from "../../copy";
import { TONE } from "../../queue-item";

const num = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US"));
const link = "inline-flex items-center gap-1.5 text-accent hover:underline";

/** One post in full: its text, link reply, image and notes, the numbers X reports, and links to X and to the resource */
export default async function SocialPostDetail({ params }: PageProps<"/[lang]/admin/social/posts/[id]">) {
  const { lang, id } = (await params) as { lang: Locale; id: string };
  const post = (await db.socialPosts(400)).find((x) => String(x.id) === id);
  if (!post) notFound();
  const t = T[lang];
  const p = t.posts;
  const er = engagementRate(post);
  const numbers: [string, string][] = [
    [p.metrics[0], num(post.impressions)],
    [p.metrics[1], num(post.likes)],
    [p.metrics[2], num(post.reposts)],
    [p.metrics[3], num(post.replies)],
    [p.metrics[4], num(post.quotes)],
    [p.metrics[5], num(post.bookmarks)],
    [p.metrics[6], num(post.link_clicks)],
    [p.metrics[7], num(post.profile_clicks)],
    [p.metrics[8], er === null ? "—" : `${er.toFixed(1)}%`],
  ];
  const image = post.kind === "applied" ? post.images[0] : `/api/social/card/${post.id}?v=${encodeURIComponent(post.updated_at)}`;
  const box = "rounded-2xl border border-line bg-card p-4";
  const label = "text-xs font-medium uppercase tracking-wide text-muted";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={href(lang, "/admin/social/posts")} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
          <ArrowLeft className="size-4" aria-hidden /> {p.back}
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">
          {t.kind[post.kind]} #{post.id}
        </h1>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", TONE[post.status])}>{t.status[post.status]}</span>
        {post.highlight && <span className="font-mono text-xs text-muted">{post.highlight}</span>}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <section className={box}>
            <p className={label}>{p.fullText}</p>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{post.text}</p>
            {post.reply_text && (
              <>
                <p className={cn(label, "mt-5")}>{p.reply}</p>
                <p className="mt-2 whitespace-pre-wrap break-all text-sm leading-relaxed text-muted">{post.reply_text}</p>
              </>
            )}
            {post.mentions.length > 0 && (
              <p className="mt-4 text-xs text-muted">
                {p.tagged}: {post.mentions.map((h) => `@${h}`).join(" ")}
              </p>
            )}
          </section>

          {post.note && (
            <section className={box}>
              <p className={label}>{p.notes}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{post.note}</p>
            </section>
          )}
        </div>

        <div className="space-y-4">
          {image && (
            <section className={box}>
              <p className={label}>{p.image}</p>
              <Image src={image} alt={post.image_alt ?? ""} width={1600} height={900} unoptimized className="mt-2 h-auto w-full rounded-xl border border-line" />
              {post.image_alt && (
                <details className="mt-2 text-xs text-muted">
                  <summary className="cursor-pointer">{p.imageAlt}</summary>
                  <p className="mt-1.5 leading-relaxed">{post.image_alt}</p>
                </details>
              )}
            </section>
          )}

          <section className={box}>
            <p className={label}>{p.numbers}</p>
            {post.status === "posted" && post.metrics_at ? (
              <>
                <dl className="mt-3 grid grid-cols-3 gap-3">
                  {numbers.map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-muted">{k}</dt>
                      <dd className="text-lg font-semibold tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-muted">
                  {p.numbersAt} {fmtDateTime(post.metrics_at, lang)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">{p.noNumbers}</p>
            )}
          </section>

          <section className={cn(box, "space-y-2 text-sm")}>
            <p className={label}>{p.links}</p>
            <p className="text-xs text-muted">
              {post.posted_at ? `${p.postedAt} ${fmtDateTime(post.posted_at, lang)}` : post.scheduled_at ? `${p.scheduled} ${fmtDateTime(post.scheduled_at, lang)}` : null}
            </p>
            {post.post_url && (
              <a href={post.post_url} target="_blank" rel="noreferrer" className={link}>
                <ExternalLink className="size-4" aria-hidden /> {p.postOnX}
              </a>
            )}
            {post.reply_post_id && (
              <a href={`https://x.com/i/web/status/${post.reply_post_id}`} target="_blank" rel="noreferrer" className={cn(link, "block")}>
                <ExternalLink className="mr-1.5 inline size-4" aria-hidden />
                {p.replyOnX}
              </a>
            )}
            {post.highlight && (
              <a href={href(lang, `/r/${post.highlight}`)} target="_blank" rel="noreferrer" className={cn(link, "block")}>
                <ExternalLink className="mr-1.5 inline size-4" aria-hidden />
                {p.resource}
              </a>
            )}
            {isOpen(post) && (
              <Link href={href(lang, "/admin/social/queue")} className={cn(link, "block")}>
                {p.editInQueue}
              </Link>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
