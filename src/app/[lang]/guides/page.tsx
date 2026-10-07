import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Sparkles } from "lucide-react";
import { getGuides } from "@/lib/data";
import { getDict, hasLocale, href } from "@/lib/i18n";
import { fmtDate, tzFor } from "@/lib/time";

export async function generateMetadata({ params }: PageProps<"/[lang]/guides">): Promise<Metadata> {
  const { lang } = await params;
  const t = getDict(hasLocale(lang) ? lang : "en");
  return { title: t.content.guidesTitle, description: t.content.guidesSub };
}

export default async function GuidesPage({ params }: PageProps<"/[lang]/guides">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const guides = await getGuides();
  const vi = lang === "vi";
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t.content.guidesTitle}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t.content.guidesSub}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((g) => {
          const Icon = g.kind === "digest" ? Sparkles : BookOpen;
          return (
            <Link
              key={g.slug}
              href={href(lang, `/guides/${g.slug}`)}
              className="group flex flex-col gap-3 rounded-2xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:border-accent/50"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="font-semibold leading-snug group-hover:text-accent">{vi ? g.title_vi : g.title}</h2>
              <p className="line-clamp-3 text-sm leading-relaxed text-muted">{vi ? g.description_vi : g.description}</p>
              <p className="mt-auto pt-2 text-xs text-muted">
                {g.resource_slugs.length} {t.kits.items} · {t.content.updated} {fmtDate(g.generated_at, lang, tzFor(lang))}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
