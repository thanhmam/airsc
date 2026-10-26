import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JOB_ICON } from "@/components/icons";
import { getJobCounts } from "@/lib/data";
import { getDict, hasLocale, href } from "@/lib/i18n";
import { playbooksFor } from "@/lib/playbooks";
import { JOBS } from "@/lib/taxonomy";

export async function generateMetadata({ params }: PageProps<"/[lang]/for">): Promise<Metadata> {
  const { lang } = await params;
  const t = getDict(hasLocale(lang) ? lang : "en");
  return { title: t.jobs.title, description: t.jobs.sub };
}

/** The catalog by profession: every job with its number of resources and playbooks */
export default async function JobsPage({ params }: PageProps<"/[lang]/for">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const counts = await getJobCounts();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-balance text-3xl font-semibold tracking-tight">{t.jobs.title}</h1>
      <p className="mt-2 max-w-2xl text-pretty text-muted">{t.jobs.sub}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {JOBS.map((j) => {
          const Icon = JOB_ICON[j.slug];
          const playbooks = playbooksFor(j.slug).length;
          return (
            <Link
              key={j.slug}
              href={href(lang, `/for/${j.slug}`)}
              className="lift group flex flex-col gap-3 rounded-2xl border border-line bg-card p-5 transition hover:border-accent/50"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="text-lg font-semibold group-hover:text-accent">{j[lang]}</h2>
              <p className="text-sm leading-relaxed text-muted">{j.hint[lang]}</p>
              <p className="mt-auto pt-2 text-xs text-muted">
                {(counts[j.slug] ?? 0).toLocaleString(lang)} {t.jobs.resources}
                {playbooks > 0 && ` · ${playbooks} ${t.jobs.playbooks.toLowerCase()}`}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
