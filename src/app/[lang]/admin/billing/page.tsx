import Link from "next/link";
import { BarChart } from "@/components/admin/bar-chart";
import { Tile } from "@/components/admin/tile";
import { db } from "@/lib/engine/db";
import { href, type Locale } from "@/lib/i18n";
import { fmtDate, fmtDateTime } from "@/lib/time";
import { adminCopy } from "../copy";

const usd = (n: number) => `$${n.toFixed(2)}`;

export default async function AdminBilling({ params }: PageProps<"/[lang]/admin/billing">) {
  const { lang } = (await params) as { lang: Locale };
  const c = adminCopy(lang);
  const b = c.biz.dashboard;
  const [o, recent] = await Promise.all([db.adminBilling(), db.adminPayments({ limit: 6 })]);
  const day = (d: string) => fmtDate(`${d}T12:00:00+07:00`, lang, undefined, { day: "numeric", month: "numeric" });
  const { revenue: r, users: u } = o;
  const sum = (key: "signups" | "pro") => o.daily.reduce((s, d) => s + d[key], 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">{b.title}</h1>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label={b.net} value={usd(r.net)} tone="accent" sub={`${b.gross}: ${usd(r.gross)} · ${usd(r.refunded)} ${b.refunded}`} />
        <Tile label={`${b.net} · 30d`} value={usd(r.net_30d)} sub={`${r.orders_30d} ${b.orders30d}`} />
        <Tile label={b.pro} value={String(u.pro)} sub={`${u.total ? Math.round((u.pro / u.total) * 100) : 0}% ${b.conversion} · +${u.new_pro_30d} ${b.newPro30}`} />
        <Tile label={b.payers} value={String(r.payers)} sub={r.payers ? `${usd(r.net / r.payers)} ${b.avg}` : undefined} />
      </section>

      {u.pro_without_order > 0 && (
        <p className="rounded-xl border border-caution/60 bg-caution-soft/40 px-4 py-2.5 text-sm">
          <b className="tabular-nums">{u.pro_without_order}</b> {b.manual}{" "}
          <Link href={href(lang, "/admin/payments")} className="font-medium text-accent hover:underline">{b.sync}</Link>
        </p>
      )}

      <section className="grid gap-3 lg:grid-cols-3">
        <BarChart title={b.charts.revenue} unit="usd" data={o.daily.map((d) => ({ label: day(d.day), value: d.revenue }))} total={usd(o.daily.reduce((s, d) => s + d.revenue, 0))} />
        <BarChart title={b.charts.signups} data={o.daily.map((d) => ({ label: day(d.day), value: d.signups }))} total={String(sum("signups"))} />
        <BarChart title={b.charts.pro} data={o.daily.map((d) => ({ label: day(d.day), value: d.pro }))} total={String(sum("pro"))} />
      </section>

      <section className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-line bg-card p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium">{b.latest}</h2>
            <Link href={href(lang, "/admin/payments")} className="text-xs font-medium text-accent hover:underline">{b.all}</Link>
          </div>
          {recent.rows.length ? (
            <table className="mt-2 w-full text-sm">
              <tbody>
                {recent.rows.map((p) => (
                  <tr key={p.provider_order_id} className="border-t border-line first:border-t-0">
                    <td className="py-1.5 pr-3 text-xs text-muted tabular-nums">{fmtDateTime(p.created_at, lang)}</td>
                    <td className="max-w-56 truncate py-1.5 pr-3">{p.email ?? c.biz.payments.unlinked}</td>
                    <td className="py-1.5 pr-3 text-muted">{p.product}</td>
                    <td className="py-1.5 text-right font-medium tabular-nums">{usd((p.amount_cents - p.refunded_cents) / 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-2 text-sm text-muted">{c.biz.payments.empty}</p>
          )}
        </div>
        <div className="rounded-2xl border border-line bg-card p-4">
          <h2 className="text-sm font-medium">{b.byProduct}</h2>
          {o.by_product.length ? (
            <ul className="mt-2 space-y-1.5 text-sm">
              {o.by_product.map((p) => (
                <li key={p.product} className="flex items-baseline justify-between gap-3">
                  <span>{p.product} <span className="text-xs text-muted tabular-nums">× {p.orders}</span></span>
                  <b className="tabular-nums">{usd(p.net)}</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">{c.none}</p>
          )}
          <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
            {b.users}: <b className="tabular-nums text-fg">{u.total}</b> · +{u.new_7d} {b.new7d}
          </p>
        </div>
      </section>
    </div>
  );
}
