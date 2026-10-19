import Link from "next/link";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Pager } from "@/components/admin/pager";
import { db } from "@/lib/engine/db";
import { href, type Locale } from "@/lib/i18n";
import { polarDashboardUrl } from "@/lib/polar";
import { fmtDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { syncOrders } from "../actions";
import { adminCopy } from "../copy";

const PAGE = 50;
const STATUS_STYLE: Record<string, string> = {
  paid: "bg-safe-soft text-safe",
  partially_refunded: "bg-caution-soft text-caution",
  refunded: "bg-soft text-muted",
};
const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default async function AdminPayments({ params, searchParams }: PageProps<"/[lang]/admin/payments">) {
  const { lang } = (await params) as { lang: Locale };
  const c = adminCopy(lang);
  const p = c.biz.payments;
  const sp = await searchParams;
  const one = (k: string) => {
    const v = Array.isArray(sp[k]) ? sp[k][0] : sp[k];
    return v ? String(v) : undefined;
  };
  const status = one("status") ?? "all";
  const synced = one("synced");
  const page = Math.max(1, Number(one("page")) || 1);
  const { total, rows } = await db.adminPayments({ status, limit: PAGE, offset: (page - 1) * PAGE });
  const pages = Math.ceil(total / PAGE);
  const qs = (patch: { status?: string; page?: number }) => {
    const q = new URLSearchParams();
    const next = { status, page: 1, ...patch };
    if (next.status !== "all") q.set("status", next.status);
    if (next.page > 1) q.set("page", String(next.page));
    const s = q.toString();
    return `${href(lang, "/admin/payments")}${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">
          {p.title} <span className="text-base font-normal text-muted tabular-nums">· {total.toLocaleString(lang)}</span>
        </h1>
        <div className="flex items-center gap-2">
          <a href={polarDashboardUrl()} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-sm hover:bg-soft">
            {p.openPolar} <ExternalLink className="size-3.5" aria-hidden />
          </a>
          <form action={syncOrders.bind(null, lang)}>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-fg px-4 text-sm font-medium text-bg">
              <RefreshCw className="size-3.5" aria-hidden /> {p.sync}
            </button>
          </form>
        </div>
      </div>

      {synced && (
        <p className={cn("rounded-xl border px-4 py-2.5 text-sm", synced === "error" ? "border-caution/60 bg-caution-soft/40" : "border-safe/60 bg-safe-soft/40")}>
          {synced === "error" ? p.syncError : p.synced.replace("{n}", String(Number(synced) || 0))}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {Object.entries(p.status).map(([k, v]) => (
          <Link key={k} href={qs({ status: k, page: 1 })} className={cn("rounded-full px-3 py-1 text-sm", status === k ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-soft hover:text-fg")}>
            {v}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-line">
              <th className="px-3 py-2.5 font-medium">{p.cols.date}</th>
              <th className="px-3 py-2.5 font-medium">{p.cols.customer}</th>
              <th className="px-3 py-2.5 font-medium">{p.cols.product}</th>
              <th className="px-3 py-2.5 text-right font-medium">{p.cols.amount}</th>
              <th className="px-3 py-2.5 text-right font-medium">{p.cols.refunded}</th>
              <th className="px-3 py-2.5 font-medium">{p.cols.status}</th>
              <th className="px-3 py-2.5 font-medium">{p.cols.order}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.provider_order_id}>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted tabular-nums">{fmtDateTime(r.created_at, lang)}</td>
                <td className="max-w-64 truncate px-3 py-2.5">{r.email ?? <span className="text-muted">{p.unlinked}</span>}</td>
                <td className="px-3 py-2.5">{r.product}</td>
                <td className="px-3 py-2.5 text-right font-medium tabular-nums">{usd(r.amount_cents)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.refunded_cents ? usd(r.refunded_cents) : <span className="text-muted">—</span>}</td>
                <td className="px-3 py-2.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[r.status])}>{p.statusName[r.status] ?? r.status}</span>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-muted" title={r.provider_order_id}>{r.provider_order_id.slice(0, 8)}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted">{p.empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={pages} prev={qs({ page: page - 1 })} next={qs({ page: page + 1 })} labels={c.biz} />
      <p className="text-xs text-muted">{p.hook}</p>
    </div>
  );
}
