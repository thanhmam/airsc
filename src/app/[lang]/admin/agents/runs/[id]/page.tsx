import Link from "next/link";
import { notFound } from "next/navigation";
import { Square } from "lucide-react";
import { db } from "@/lib/engine/db";
import { href, type Locale } from "@/lib/i18n";
import { fmtDateTime, fmtTime } from "@/lib/time";
import { cancelRun } from "../../../actions";
import { duration, StatusPill, type Run } from "../../shared";

export default async function RunDetail({ params }: PageProps<"/[lang]/admin/agents/runs/[id]">) {
  const { lang, id } = (await params) as { lang: Locale; id: string };
  const runs = (await db.runs(100)) as Run[];
  const run = runs.find((r) => String(r.id) === id);
  if (!run) notFound();
  const vi = lang === "vi";
  const costs = Object.entries(run.stats).filter(([k]) => k.startsWith("cost"));
  const counts = Object.entries(run.stats).filter(([k]) => !k.startsWith("cost"));

  return (
    <div className="space-y-5">
      <Link href={href(lang, "/admin/agents")} className="text-sm text-muted hover:text-fg">← {vi ? "Agent & chi phí" : "Agents & costs"}</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{fmtDateTime(run.started_at, lang)}</h1>
        <StatusPill status={run.status} />
        <span className="text-sm text-muted">
          {run.trigger} · {duration(run.started_at, run.finished_at)}
        </span>
        {run.status === "running" && (
          <form action={cancelRun.bind(null, run.run_id)} className="ml-auto">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-danger/50 px-3 py-1.5 text-sm text-danger hover:bg-danger-soft">
              <Square className="size-3.5" aria-hidden /> {vi ? "Dừng lần chạy" : "Stop run"}
            </button>
          </form>
        )}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-line bg-card p-3">
            <p className="text-xs text-muted">{k.replace(/_/g, " ")}</p>
            <p className="text-xl font-semibold tabular-nums">{v}</p>
          </div>
        ))}
        {costs.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-accent/40 bg-card p-3">
            <p className="text-xs text-muted">{k.replace(/_/g, " ").replace("cost usd", vi ? "tổng chi phí" : "total cost")}</p>
            <p className="text-xl font-semibold tabular-nums">${Number(v).toFixed(4)}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-line bg-card">
        <h2 className="border-b border-line px-4 py-2.5 text-sm font-medium">Log ({run.log.length})</h2>
        <ol className="space-y-0.5 px-4 py-3 font-mono text-xs leading-relaxed">
          {run.log.map((l, i) => (
            <li key={i} className={l.msg.includes("failed") || l.msg.startsWith("error") || l.msg.startsWith("budget") ? "text-danger" : undefined}>
              <span className="text-muted">{fmtTime(l.at, lang)}</span> {l.msg}
            </li>
          ))}
        </ol>
      </section>
      <p className="font-mono text-[11px] text-muted">workflow run: {run.run_id}</p>
    </div>
  );
}
