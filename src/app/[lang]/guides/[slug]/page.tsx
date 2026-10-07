import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ResourceCard } from "@/components/resource-card";
import { getGuide } from "@/lib/data";
import { getDict, hasLocale, href } from "@/lib/i18n";
import { fmtDate, tzFor } from "@/lib/time";

export async function generateMetadata({ params }: PageProps<"/[lang]/guides/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const data = await getGuide(slug);
  if (!data) return {};
  const vi = lang === "vi";
  return {
    title: vi ? data.page.title_vi : data.page.title,
    description: vi ? data.page.description_vi : data.page.description,
    alternates: { languages: { en: `/guides/${slug}`, vi: `/vi/guides/${slug}` } },
  };
}

export default async function GuidePage({ params }: PageProps<"/[lang]/guides/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const data = await getGuide(slug);
  if (!data) notFound();
  const { page, resources } = data;
  const vi = lang === "vi";
  const why = new Map((page.showcase?.picks ?? []).map((p) => [p.slug, vi ? p.why_vi : p.why_en]));
  const [intro, ...rest] = (vi ? page.body_vi : page.body).split(/\n(?=## )/);

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-muted">
        <Link href={href(lang, "/guides")} className="hover:text-fg">{t.content.guidesTitle}</Link>
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{vi ? page.title_vi : page.title}</h1>
      <p className="mt-2 text-sm text-muted">
        {t.content.updated} {fmtDate(page.generated_at, lang, tzFor(lang))}
      </p>
      <div className="prose-readme mt-6 text-[17px] text-fg/90">
        <Markdown remarkPlugins={[remarkGfm]} skipHtml>{intro}</Markdown>
      </div>

      <ol className="mt-10 space-y-5">
        {resources.map((r, i) => (
          <li key={r.slug} className="grid gap-4 sm:grid-cols-[1fr_1.1fr] sm:items-start">
            <ResourceCard r={r} lang={lang} t={t} />
            <div className="rounded-2xl bg-soft p-4 text-sm leading-relaxed">
              <p className="mb-1 font-mono text-xs text-accent">#{i + 1} · {t.content.whyPick}</p>
              {why.get(r.slug)}
            </div>
          </li>
        ))}
      </ol>

      <div className="prose-readme mt-12">
        <Markdown remarkPlugins={[remarkGfm]} skipHtml>{rest.join("\n")}</Markdown>
      </div>
    </article>
  );
}
