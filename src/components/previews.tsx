import Image from "next/image";
import { BadgeCheck, ExternalLink } from "lucide-react";
import type { AirscRun } from "@/lib/airsc-runs";
import type { Dict, Locale } from "@/lib/i18n";
import type { Preview } from "@/lib/types";

function Shot({ p, alt, priority }: { p: Preview; alt: string; priority?: boolean }) {
  return (
    <a href={p.src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-line bg-soft">
      {/* stored pre-sized as WebP, so Next does not need to optimise them again */}
      <Image src={p.src} alt={alt} width={p.width} height={p.height} unoptimized priority={priority} className="h-auto w-full" />
    </a>
  );
}

/** "See it in action": our own Airsc run first, then real-result images from the author's README */
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
  return (
    <section aria-labelledby="in-action" className="space-y-4">
      <h2 id="in-action" className="text-lg font-semibold">{t.content.inAction}</h2>

      {run && (
        <div className="space-y-3 rounded-2xl border border-accent/40 bg-accent-soft/40 p-4">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
            <BadgeCheck className="size-4" aria-hidden /> {t.content.runOnAirsc}
          </p>
          <p className="text-sm text-muted">{t.content.runOnAirscDesc}</p>
          <p className="rounded-lg bg-card px-3 py-2 text-sm">
            <span className="font-medium">{t.content.task}:</span> “{lang === "vi" ? run.task.vi : run.task.en}”
          </p>
          {run.images.map((p, i) => (
            <figure key={p.src} className="space-y-1.5">
              <Shot p={p} alt={cap(p)} priority={i === 0} />
              <figcaption className="text-xs text-muted">{cap(p)}</figcaption>
            </figure>
          ))}
          <p className="font-mono text-[11px] text-muted">
            {run.agent} · {run.date}
          </p>
        </div>
      )}

      {previews.length > 0 && (
        <div className="space-y-2">
          <div className={previews.length > 1 ? "grid gap-3 sm:grid-cols-2" : ""}>
            {previews.map((p, i) => (
              <figure key={p.src} className={previews.length === 3 && i === 0 ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
                <Shot p={p} alt={cap(p)} priority={!run && i === 0} />
                <figcaption className="text-xs text-muted">{cap(p)}</figcaption>
              </figure>
            ))}
          </div>
          <p className="inline-flex items-center gap-1 text-xs text-muted">
            {t.content.fromReadme} {owner} ·
            <a href={`${repoUrl}#readme`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 hover:text-fg">
              {t.content.source} <ExternalLink className="size-3" aria-hidden />
            </a>
          </p>
        </div>
      )}
    </section>
  );
}
