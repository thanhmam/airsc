import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { GOALS, PHASES, pmCopy, REQUESTS, tr } from "../content";
import { card, fmtDay, PmHeader, StatusPill } from "../shared";

const PR = "https://github.com/thanhmam/airsc/pull/";

export default async function PmRoadmap({ params }: PageProps<"/[lang]/admin/pm/roadmap">) {
  const { lang } = (await params) as { lang: Locale };
  const t = pmCopy(lang);
  const r = t.roadmap;

  return (
    <div className="space-y-6">
      <PmHeader title={t.tabs.roadmap} intro={r.intro} />

      <section className={card}>
        <h2 className="mb-3 text-sm font-medium">{r.goals}</h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {GOALS.map((g, i) => (
            <li key={g.en} className="flex gap-3 rounded-xl bg-soft p-3 text-sm">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">{i + 1}</span>
              <span>{tr(g, lang)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium">{r.phases}</h2>
        <ol className="relative space-y-3 border-l border-line pl-5">
          {PHASES.map((p) => (
            <li key={p.title.en} className="relative">
              <span
                className={cn(
                  "absolute -left-[27px] top-4 size-3 rounded-full border-2 border-bg",
                  p.status === "done" ? "bg-safe" : p.status === "doing" ? "bg-accent" : p.status === "next" ? "bg-caution" : "bg-line-strong",
                )}
                aria-hidden
              />
              <div className={card}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{tr(p.title, lang)}</h3>
                  <StatusPill status={p.status} label={r.status[p.status]} />
                  {p.when && <span className="text-xs text-muted">{fmtDay(p.when, lang)}</span>}
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted marker:text-line-strong">
                  {p.items.map((i) => (
                    <li key={i.en}>{tr(i, lang)}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium">{r.requests}</h2>
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <ul className="divide-y divide-line text-sm">
            {[...REQUESTS].reverse().map((q) => (
              <li key={q.when + q.text.en} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2">
                <span className="w-28 shrink-0 whitespace-nowrap text-xs text-muted">{fmtDay(q.when, lang)}</span>
                <span className="min-w-0 flex-1">{tr(q.text, lang)}</span>
                {q.ref && (
                  <span className="flex gap-1.5 font-mono text-xs">
                    {q.ref.split(" ").map((n) => (
                      <a key={n} href={PR + n.slice(1)} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                        {n}
                      </a>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
