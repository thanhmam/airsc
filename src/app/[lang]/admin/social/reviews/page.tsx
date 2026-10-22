import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { db } from "@/lib/engine/db";
import type { Locale } from "@/lib/i18n";
import { fmtDateTime } from "@/lib/time";
import { reviewSocialNow } from "../../actions";
import { ActionButton } from "../action-button";
import { T } from "../copy";

/** What each three-day review found, and the writing guidance it set */
export default async function SocialReviews({ params }: PageProps<"/[lang]/admin/social/reviews">) {
  const { lang } = (await params) as { lang: Locale };
  const t = T[lang];
  const reviews = await db.socialReviews(10);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t.reviews}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{t.reviewsIntro}</p>
      </div>
      <ActionButton action={reviewSocialNow} label={t.reviewNow} done={t.reviewed} />
      {!reviews.length && <p className="text-sm text-muted">{t.noReviews}</p>}
      {reviews.map((r) => (
        <article key={r.id} className="rounded-2xl border border-line bg-card p-4">
          <p className="text-xs text-muted">
            {fmtDateTime(r.period_start, lang)} → {fmtDateTime(r.period_end, lang)} · {r.model}
          </p>
          <div className="prose-readme mt-2 text-sm">
            <Markdown remarkPlugins={[remarkGfm]} skipHtml>
              {r.summary}
            </Markdown>
          </div>
          {r.guidance && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-muted">{t.guidanceUsed}</summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-soft p-3 font-mono text-xs">{r.guidance}</pre>
            </details>
          )}
        </article>
      ))}
    </div>
  );
}
