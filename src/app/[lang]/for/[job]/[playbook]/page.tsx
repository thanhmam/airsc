import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, BadgeCheck, Lock, Star } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { ResourceCard } from "@/components/resource-card";
import { SafetyBadge } from "@/components/safety-badge";
import { AIRSC_RUNS } from "@/lib/airsc-runs";
import { getResource, resolvePlaybook } from "@/lib/data";
import { getDict, hasLocale, href } from "@/lib/i18n";
import { agentPrompt } from "@/lib/install-links";
import { findPlaybook } from "@/lib/playbooks";
import { currentPlan } from "@/lib/pro";
import { jobLabel } from "@/lib/taxonomy";
import { compact } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[lang]/for/[job]/[playbook]">): Promise<Metadata> {
  const { lang, job, playbook } = await params;
  const p = findPlaybook(job, playbook);
  if (!p || !hasLocale(lang)) return {};
  return { title: p.title[lang], description: p.intro[lang] };
}

/** A playbook: numbered steps, each with the recommended resource, its alternatives, why and what it needs */
export default async function PlaybookPage({ params }: PageProps<"/[lang]/for/[job]/[playbook]">) {
  const { lang, job, playbook } = await params;
  const p = findPlaybook(job, playbook);
  if (!hasLocale(lang) || !p) notFound();
  const t = getDict(lang);
  const steps = await resolvePlaybook(p);

  // one prompt that installs every step's pick is a Pro feature, like a kit; the playbook stays open
  const { user, pro } = await currentPlan();
  const full = pro ? await Promise.all(steps.flatMap((s) => (s.card ? [getResource(s.card.slug)] : []))) : [];
  const prompt = [
    lang === "vi" ? `Cài các tài nguyên của lộ trình "${p.title.vi}", từng cái một:` : `Install the resources of the "${p.title.en}" playbook, one at a time:`,
    ...full.filter(Boolean).map((r, i) => `${i + 1}. ${agentPrompt(r!)}`),
  ].join("\n\n");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 flex flex-wrap gap-x-2 text-sm text-muted">
        <Link href={href(lang, "/for")} className="hover:text-fg">{t.jobs.allJobs}</Link>
        <span aria-hidden>/</span>
        <Link href={href(lang, `/for/${p.job}`)} className="hover:text-fg">{jobLabel(p.job, lang)}</Link>
      </nav>
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <h1 className="text-balance text-3xl font-semibold tracking-tight">{p.title[lang]}</h1>
          <p className="mt-2 max-w-2xl text-pretty text-lg text-muted">{p.intro[lang]}</p>
          {p.warning && (
            <p className="mt-5 flex gap-2.5 rounded-xl border border-caution/40 bg-caution-soft p-3 text-sm text-fg">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-caution" aria-hidden />
              {p.warning[lang]}
            </p>
          )}

          <ol className="mt-8 space-y-8">
            {steps.map((s, i) => (
              <li key={s.title.en} className="grid gap-4 sm:grid-cols-[2.25rem_1fr]">
                <span className="grid size-9 place-items-center rounded-full bg-accent-soft font-mono text-sm font-semibold text-accent">{i + 1}</span>
                <div className="min-w-0 space-y-3">
                  <h2 className="text-lg font-semibold tracking-tight">{s.title[lang]}</h2>
                  <p className="text-pretty text-sm leading-relaxed text-muted">{s.why[lang]}</p>
                  {s.needs && (
                    <p className="text-xs text-muted">
                      <span className="font-medium text-fg">{t.jobs.needs}:</span> {s.needs[lang]}
                    </p>
                  )}
                  {s.card && (
                    <div className="space-y-1.5">
                      <p className="flex flex-wrap items-center gap-2 text-xs font-medium">
                        <span className="text-accent">{t.jobs.recommended}</span>
                        {AIRSC_RUNS[s.card.slug] && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-accent">
                            <BadgeCheck className="size-3.5" aria-hidden /> {t.jobs.airscUsed}
                          </span>
                        )}
                      </p>
                      {s.promoted && <p className="text-xs text-muted">{t.jobs.promoted}</p>}
                      <div className="max-w-md">
                        <ResourceCard r={s.card} lang={lang} t={t} />
                      </div>
                    </div>
                  )}
                  {s.others.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-muted">{t.jobs.alternatives}</p>
                      <ul className="divide-y divide-line rounded-xl border border-line bg-card">
                        {s.others.map((r) => (
                          <li key={r.slug}>
                            <Link href={href(lang, `/r/${r.slug}`)} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm hover:bg-soft">
                              <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
                              <span className="text-xs text-muted">{r.owner}</span>
                              <span className="inline-flex items-center gap-1 text-xs text-muted">
                                <Star className="size-3.5" aria-hidden /> {compact(r.stars)}
                              </span>
                              <SafetyBadge safety={r.safety} t={t} />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-10 max-w-2xl text-xs leading-relaxed text-muted">{t.jobs.reviewed}</p>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-4 rounded-2xl border border-line bg-card p-5">
            <p className="font-semibold">
              {steps.length} {t.jobs.steps}
            </p>
            {pro ? (
              <div className="space-y-2">
                <p className="text-xs text-muted">{t.jobs.promptIntro}</p>
                <div className="relative rounded-xl bg-soft">
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap p-3 pr-10 font-mono text-xs leading-relaxed">{prompt}</pre>
                  <CopyButton text={prompt} copiedLabel={t.resource.copied} className="absolute right-1.5 top-1.5" />
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-dashed border-line-strong p-4 text-center">
                <p className="flex items-center justify-center gap-1.5 text-sm font-medium">
                  <Lock className="size-4 text-accent" aria-hidden /> {t.jobs.proTitle}
                </p>
                <p className="text-xs text-muted">{t.jobs.proText}</p>
                <Link
                  href={user ? href(lang, "/pricing") : href(lang, `/login?next=${encodeURIComponent(href(lang, "/pricing"))}`)}
                  className="block rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg hover:opacity-90"
                >
                  {t.kits.proCta}
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
