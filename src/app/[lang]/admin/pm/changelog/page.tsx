import type { Locale } from "@/lib/i18n";
import { CHANGELOG, pmCopy, tr } from "../content";
import { fmtDay, PmHeader } from "../shared";

const PR = "https://github.com/thanhmam/airsc/pull/";

export default async function PmChangelog({ params }: PageProps<"/[lang]/admin/pm/changelog">) {
  const { lang } = (await params) as { lang: Locale };
  const t = pmCopy(lang);
  const days = [...new Set(CHANGELOG.map((c) => c.when))];

  return (
    <div className="space-y-6">
      <PmHeader title={t.tabs.changelog} intro={t.changelog.intro} />
      {days.map((day) => (
        <section key={day}>
          <h2 className="mb-2 text-sm font-medium text-muted">{fmtDay(day, lang)}</h2>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
            {CHANGELOG.filter((c) => c.when === day).map((c) => (
              <article key={c.title.en} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{tr(c.title, lang)}</h3>
                  {c.pr ? (
                    <a href={PR + c.pr} target="_blank" rel="noreferrer" className="font-mono text-xs text-accent hover:underline">
                      #{c.pr}
                    </a>
                  ) : (
                    <span className="text-xs text-muted">{t.changelog.direct}</span>
                  )}
                  {c.open && <span className="rounded-full bg-caution-soft px-2 py-0.5 text-xs font-medium text-caution">{t.changelog.open}</span>}
                </div>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted marker:text-line-strong">
                  {c.items.map((i) => (
                    <li key={i.en}>{tr(i, lang)}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
