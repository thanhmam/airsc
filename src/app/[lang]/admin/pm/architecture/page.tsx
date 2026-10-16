import { ExternalLink } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { DIAGRAM_DATE, DIAGRAM_REVISION, DIAGRAMS } from "@/lib/pm/diagrams";
import { pmCopy } from "../content";
import { card, fmtDay, PmHeader } from "../shared";

const REPO = "https://github.com/thanhmam/airsc";

export default async function PmArchitecture({ params }: PageProps<"/[lang]/admin/pm/architecture">) {
  const { lang } = (await params) as { lang: Locale };
  const t = pmCopy(lang);
  const a = t.architecture;

  return (
    <div className="space-y-6">
      <PmHeader title={t.tabs.architecture} intro={a.intro}>
        <p className="text-xs text-muted">
          {a.traced}{" "}
          <a href={`${REPO}/commit/${DIAGRAM_REVISION}`} target="_blank" rel="noreferrer" className="font-mono text-accent hover:underline">
            {DIAGRAM_REVISION}
          </a>{" "}
          · {fmtDay(DIAGRAM_DATE, lang)}
        </p>
      </PmHeader>

      {DIAGRAMS.map((d) => {
        const src = `/api/admin/diagram/${d.name}`;
        return (
          <section key={d.name} className={card}>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-medium">
                  {a.titles[d.name]} <span className="ml-1 rounded-full bg-soft px-2 py-0.5 font-mono text-[11px] text-muted">{d.kind}</span>
                </h2>
                <p className="mt-0.5 text-sm text-muted">{a.descs[d.name]}</p>
              </div>
              <a href={src} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                {a.open} <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>
            <iframe src={src} title={a.titles[d.name]} loading="lazy" className="h-[78vh] min-h-[560px] w-full rounded-xl border border-line bg-bg" />
          </section>
        );
      })}
    </div>
  );
}
