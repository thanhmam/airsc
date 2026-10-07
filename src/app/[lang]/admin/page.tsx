import Link from "next/link";
import { BarChart } from "@/components/admin/bar-chart";
import { aiCredits } from "@/lib/engine/credits";
import { db } from "@/lib/engine/db";
import { href, type Locale } from "@/lib/i18n";
import { fmtDate, fmtDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { adminCopy } from "./copy";

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "accent" | "warn" }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-4", tone === "accent" ? "border-accent/60" : tone === "warn" ? "border-caution/60" : "border-line")}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "0%");

export default async function AdminOverview({ params }: PageProps<"/[lang]/admin">) {
  const { lang } = (await params) as { lang: Locale };
  const c = adminCopy(lang);
  const [o, credits, runs, donations] = await Promise.all([db.overview(), aiCredits(), db.runs(1), db.donations()]);
  const r = o.resources;
  const day = (d: string) => fmtDate(`${d}T12:00:00+07:00`, lang, undefined, { day: "numeric", month: "numeric" });
  const cost30 = o.daily.reduce((s, d) => s + Number(d.cost), 0);
  const last = runs[0] as { status: string; started_at: string; stats: Record<string, number> } | undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">{c.tabs.overview}</h1>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label={c.kpi.published} value={r.published.toLocaleString(lang)} sub={`+${r.new_7d} ${c.kpi.new7d}`} />
        <Tile label={c.kpi.queued} value={String(r.queued)} sub={`${c.kpi.hidden}: ${r.hidden} · ${c.kpi.autoHidden}`} />
        <Tile label={c.kpi.views7d} value={o.traffic.views_7d.toLocaleString(lang)} sub={`30d: ${o.traffic.views_30d.toLocaleString(lang)}`} />
        <Tile label={c.kpi.downloads7d} value={o.traffic.downloads_7d.toLocaleString(lang)} sub={`30d: ${o.traffic.downloads_30d.toLocaleString(lang)}`} />
        <Tile label={c.kpi.users} value={o.users.total.toLocaleString(lang)} sub={`+${o.users.new_7d} · ${c.kpi.fulltime}: ${o.users.fulltime}`} />
        <Tile label={c.kpi.revenue} value={`$${Number(donations.usd).toFixed(2)}`} sub={`${donations.count} ${c.kpi.orders} · 30d: ${donations.count_30d}`} />
        <Tile
          label={c.kpi.credit}
          value={credits ? `$${credits.balance.toFixed(2)}` : "—"}
          tone={credits && credits.balance < 2 ? "warn" : "accent"}
          sub={credits ? `${c.kpi.gatewayUsed}: $${credits.used.toFixed(2)} · ${c.kpi.spent30d}: $${cost30.toFixed(2)}` : undefined}
        />
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="text-xs text-muted">{c.kpi.pipeline}</p>
          <ul className="mt-1.5 space-y-1 text-sm">
            <li><b className="tabular-nums">{pct(r.total - r.unclassified, r.total)}</b> <span className="text-muted">{c.kpi.classified}</span></li>
            <li><b className="tabular-nums">{pct(r.with_video, r.published)}</b> <span className="text-muted">{c.kpi.video}</span></li>
            <li><b className="tabular-nums">{r.demo_ok}</b> <span className="text-muted">{c.kpi.demo}</span></li>
          </ul>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <BarChart title={c.charts.views} data={o.daily.map((d) => ({ label: day(d.day), value: d.views }))} total={o.traffic.views_30d.toLocaleString(lang)} />
        <BarChart title={c.charts.downloads} data={o.daily.map((d) => ({ label: day(d.day), value: d.downloads }))} total={o.traffic.downloads_30d.toLocaleString(lang)} />
        <BarChart title={c.charts.cost} unit="usd" data={o.daily.map((d) => ({ label: day(d.day), value: Number(d.cost) }))} total={`$${cost30.toFixed(2)}`} />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-card p-4">
          <h2 className="text-sm font-medium">{c.topViewed}</h2>
          {o.top_viewed.length ? (
            <table className="mt-2 w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr>
                  <th className="py-1 font-normal">{c.table.resource}</th>
                  <th className="py-1 text-right font-normal">{c.table.views}</th>
                  <th className="py-1 text-right font-normal">{c.table.downloads}</th>
                </tr>
              </thead>
              <tbody>
                {o.top_viewed.map((t) => (
                  <tr key={t.slug} className="border-t border-line">
                    <td className="py-1.5">
                      <Link href={href(lang, `/r/${t.slug}`)} className="hover:text-accent">{t.name}</Link>
                      <span className="ml-1.5 text-xs text-muted">{t.type}</span>
                    </td>
                    <td className="py-1.5 text-right tabular-nums">{t.views}</td>
                    <td className="py-1.5 text-right tabular-nums">{t.downloads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-2 text-sm text-muted">{c.none}</p>
          )}
        </div>
        <div className="rounded-2xl border border-line bg-card p-4">
          <h2 className="text-sm font-medium">{c.lastRun}</h2>
          {last ? (
            <div className="mt-2 space-y-1 text-sm">
              <p>
                {fmtDateTime(last.started_at, lang)} · <b>{last.status}</b>
                {last.stats.cost_usd ? ` · $${Number(last.stats.cost_usd).toFixed(3)}` : ""}
              </p>
              <p className="text-xs text-muted">
                {Object.entries(last.stats)
                  .filter(([k]) => !k.startsWith("cost"))
                  .map(([k, v]) => `${k.replace(/_/g, " ")} ${v}`)
                  .join(" · ")}
              </p>
              <Link href={href(lang, "/admin/agents")} className="inline-block pt-1 text-xs font-medium text-accent hover:underline">
                {c.tabs.agents} →
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">{c.none}</p>
          )}
        </div>
      </section>
    </div>
  );
}
