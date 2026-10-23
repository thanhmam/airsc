import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import { LATEST, SNAPSHOTS, snapshotById } from "@/lib/pm/diagrams";
import { architectureStatus, dispatchConfigured, latestRefreshRun, REPO_URL } from "@/lib/pm/github";
import { fmtDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { pmCopy } from "../content";
import { card, fmtDay, PmHeader } from "../shared";
import { RefreshButton } from "./refresh-button";

/** Architecture diagrams: the version picked in ?v= (the latest by default), whether they are out of date, and the history */
export default async function PmArchitecture({ params, searchParams }: PageProps<"/[lang]/admin/pm/architecture">) {
  const { lang } = (await params) as { lang: Locale };
  const q = await searchParams;
  const asked = String(Array.isArray(q.v) ? q.v[0] : (q.v ?? ""));
  const snap = snapshotById(asked);
  const isLatest = snap.id === LATEST.id;
  const t = pmCopy(lang);
  const a = t.architecture;
  const base = href(lang, "/admin/pm/architecture");

  const [status, run] = await Promise.all([architectureStatus(LATEST.revision), latestRefreshRun()]);
  const running = run?.status === "queued" || run?.status === "in_progress";
  const runLabel = run ? (run.status === "completed" ? (a.runs[run.conclusion ?? ""] ?? run.conclusion) : a.runs[run.status]) : null;

  return (
    <div className="space-y-6">
      <PmHeader title={t.tabs.architecture} intro={a.intro}>
        <p className="text-xs text-muted">
          {a.traced}{" "}
          <a href={`${REPO_URL}/commit/${snap.revision}`} target="_blank" rel="noreferrer" className="font-mono text-accent hover:underline">
            {snap.revision}
          </a>{" "}
          · {fmtDay(snap.date, lang)}
        </p>
      </PmHeader>

      <section className={cn(card, "flex flex-wrap items-start justify-between gap-4", status?.stale && "border-caution/60 bg-caution-soft/30")}>
        <div className="flex max-w-3xl gap-3">
          {status === null ? (
            <p className="text-sm text-muted">{a.unknown}</p>
          ) : status.stale ? (
            <>
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-caution" aria-hidden />
              <div>
                <p className="text-sm font-semibold">{a.stale}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {a.staleBody.replace("{commits}", String(status.commits)).replace("{prs}", String(status.prs.length)).replace("{signals}", status.signals.join(", "))}
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-safe" aria-hidden />
              <p className="text-sm text-muted">{a.fresh}</p>
            </>
          )}
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <RefreshButton
            configured={dispatchConfigured()}
            running={running}
            highlight={!!status?.stale}
            c={{ update: a.update, updating: a.updating, started: a.started, notConfigured: a.notConfigured, command: "/refresh-architecture" }}
          />
          {run && (
            <p className="text-xs text-muted">
              {a.lastRun}:{" "}
              <a href={run.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                {runLabel}
              </a>{" "}
              · {fmtDateTime(run.at, lang)}
            </p>
          )}
        </div>
      </section>

      {!isLatest && (
        <p className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-soft/50 px-4 py-2.5 text-sm">
          {a.olderNotice}
          <Link href={base} className="text-accent hover:underline">
            {a.backToLatest}
          </Link>
        </p>
      )}

      <p className="max-w-3xl text-sm text-muted">{snap.note[lang]}</p>

      {snap.diagrams.map((d) => {
        const src = `/api/admin/diagram/${d.name}?v=${snap.id}`;
        return (
          <section key={d.name} className={card}>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-medium">
                  {d.title[lang]} <span className="ml-1 rounded-full bg-soft px-2 py-0.5 font-mono text-[11px] text-muted">{d.kind}</span>
                </h2>
                <p className="mt-0.5 text-sm text-muted">{d.desc[lang]}</p>
              </div>
              <a href={src} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                {a.open} <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>
            <iframe src={src} title={d.title[lang]} loading="lazy" className="h-[78vh] min-h-[560px] w-full rounded-xl border border-line bg-bg" />
          </section>
        );
      })}

      <section className={card}>
        <h2 className="text-sm font-medium">{a.history}</h2>
        <p className="mt-0.5 text-sm text-muted">{a.historyIntro}</p>
        <ul className="mt-3 divide-y divide-line">
          {SNAPSHOTS.map((s, i) => (
            <li key={s.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0">
              <Link
                href={i === 0 ? base : `${base}?v=${s.id}`}
                aria-current={s.id === snap.id ? "page" : undefined}
                className={cn("w-32 shrink-0 text-sm tabular-nums", s.id === snap.id ? "font-semibold text-accent" : "text-fg hover:text-accent")}
              >
                {fmtDay(s.date, lang)}
              </Link>
              <a href={`${REPO_URL}/commit/${s.revision}`} target="_blank" rel="noreferrer" className="w-16 shrink-0 font-mono text-xs text-muted hover:text-accent">
                {s.revision}
              </a>
              <span className="min-w-0 flex-1 text-sm text-muted">
                {s.note[lang]} <span className="text-xs">· {s.diagrams.length} {a.diagrams}</span>
              </span>
              {i === 0 && <span className="rounded-full bg-safe-soft px-2 py-0.5 text-xs font-medium text-safe">{a.latest}</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
