import { BadgeCheck, ExternalLink } from "lucide-react";
import { Slideshow, type Slide } from "@/components/slideshow";
import type { AirscRun } from "@/lib/airsc-runs";
import type { Dict, Locale } from "@/lib/i18n";
import type { Preview } from "@/lib/types";

/** "See it in action": one auto-playing slideshow, our own Airsc run first, then real-result images from the README */
export function Previews({
  name,
  owner,
  repoUrl,
  run,
  previews,
  lang,
  t,
}: {
  name: string;
  owner: string;
  repoUrl: string;
  run?: AirscRun;
  previews: Preview[];
  lang: Locale;
  t: Dict;
}) {
  const cap = (p: Preview) => (lang === "vi" ? p.caption.vi : p.caption.en) || `${t.content.previewAlt} ${name}`;
  const slide = (p: Preview, isRun: boolean): Slide => ({
    src: p.src,
    width: p.width,
    height: p.height,
    caption: cap(p),
    badge: isRun ? t.content.runOnAirsc : t.content.fromReadme,
    run: isRun,
  });
  const slides = [...(run?.images ?? []).map((p) => slide(p, true)), ...previews.map((p) => slide(p, false))];

  return (
    <section aria-labelledby="in-action" className="space-y-3">
      <h2 id="in-action" className="text-lg font-semibold">{t.content.inAction}</h2>

      {run && (
        <div className="space-y-1.5 rounded-xl border border-accent/40 bg-accent-soft/40 px-4 py-3 text-sm">
          <p className="inline-flex items-center gap-1.5 font-semibold text-accent">
            <BadgeCheck className="size-4" aria-hidden /> {t.content.runOnAirsc}
          </p>
          <p>
            <span className="font-medium">{t.content.task}:</span> “{lang === "vi" ? run.task.vi : run.task.en}”
          </p>
          <p className="font-mono text-[11px] text-muted">
            {run.agent} · {run.date}
          </p>
        </div>
      )}

      <Slideshow slides={slides} name={`${t.content.inAction} · ${name}`} c={t.slideshow} />

      {previews.length > 0 && (
        <p className="inline-flex items-center gap-1 text-xs text-muted">
          {t.content.fromReadme} {owner} ·
          <a href={`${repoUrl}#readme`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 hover:text-fg">
            {t.content.source} <ExternalLink className="size-3" aria-hidden />
          </a>
        </p>
      )}
    </section>
  );
}
