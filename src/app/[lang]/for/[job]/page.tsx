import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { JOB_ICON } from "@/components/icons";
import { ResourceCard } from "@/components/resource-card";
import { searchResources } from "@/lib/data";
import { getDict, hasLocale, href } from "@/lib/i18n";
import { playbooksFor } from "@/lib/playbooks";
import { JOBS } from "@/lib/taxonomy";

const findJob = (slug: string) => JOBS.find((j) => j.slug === slug);

export async function generateMetadata({ params }: PageProps<"/[lang]/for/[job]">): Promise<Metadata> {
  const { lang, job } = await params;
  const j = findJob(job);
  if (!j || !hasLocale(lang)) return {};
  return { title: `${getDict(lang).nav.jobs}: ${j[lang]}`, description: j.hint[lang] };
}

/** One job: its playbooks first, then its most-starred resources */
export default async function JobPage({ params }: PageProps<"/[lang]/for/[job]">) {
  const { lang, job } = await params;
  const j = findJob(job);
  if (!hasLocale(lang) || !j) notFound();
  const t = getDict(lang);
  const Icon = JOB_ICON[j.slug];
  const playbooks = playbooksFor(j.slug);
  const { items, total } = await searchResources({ job: j.slug, sort: "stars", pageSize: 12 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-muted">
        <Link href={href(lang, "/for")} className="hover:text-fg">{t.jobs.allJobs}</Link>
      </nav>
      <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Icon className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight">{j[lang]}</h1>
      <p className="mt-2 max-w-2xl text-pretty text-lg text-muted">{j.hint[lang]}</p>

      {playbooks.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">{t.jobs.playbooks}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {playbooks.map((p) => (
              <Link
                key={p.slug}
                href={href(lang, `/for/${j.slug}/${p.slug}`)}
                className="lift group flex flex-col gap-2 rounded-2xl border border-line bg-card p-5 transition hover:border-accent/50"
              >
                <h3 className="text-lg font-semibold group-hover:text-accent">{p.title[lang]}</h3>
                <p className="text-sm leading-relaxed text-muted">{p.intro[lang]}</p>
                <p className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-accent">
                  {p.steps.length} {t.jobs.steps} <ArrowRight className="size-4" aria-hidden />
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">{t.jobs.top}</h2>
          <Link href={`${href(lang, "/browse")}?job=${j.slug}`} className="text-sm font-medium text-accent hover:underline">
            {t.jobs.seeAll.replace("{n}", total.toLocaleString(lang))} →
          </Link>
        </div>
        {!playbooks.length && <p className="mt-2 text-sm text-muted">{t.jobs.noPlaybook}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <ResourceCard key={r.id} r={r} lang={lang} t={t} />
          ))}
        </div>
      </section>
    </div>
  );
}
