import { KeyRound } from "lucide-react";
import { Pager } from "@/components/admin/pager";
import { db } from "@/lib/engine/db";
import { href, type Locale } from "@/lib/i18n";
import { fmtDate, fmtDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { setUserPro } from "../actions";
import { adminCopy } from "../copy";

const PAGE = 50;

export default async function AdminUsers({ params, searchParams }: PageProps<"/[lang]/admin/users">) {
  const { lang } = (await params) as { lang: Locale };
  const c = adminCopy(lang);
  const u = c.biz.users;
  const sp = await searchParams;
  const one = (k: string) => {
    const v = Array.isArray(sp[k]) ? sp[k][0] : sp[k];
    return v ? String(v) : undefined;
  };
  const filter = { q: one("q"), filter: one("filter") ?? "all", sort: one("sort") ?? "newest" };
  const page = Math.max(1, Number(one("page")) || 1);
  const { total, rows } = await db.adminUsers({ ...filter, limit: PAGE, offset: (page - 1) * PAGE });
  const pages = Math.ceil(total / PAGE);
  const qs = (to: number) => {
    const p = new URLSearchParams();
    Object.entries({ ...filter, page: String(to) }).forEach(([k, v]) => v && p.set(k, v));
    return `${href(lang, "/admin/users")}?${p}`;
  };
  const select = "h-9 rounded-lg border border-line bg-card px-2 text-sm";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">
        {u.title} <span className="text-base font-normal text-muted tabular-nums">· {total.toLocaleString(lang)}</span>
      </h1>
      <form className="flex flex-wrap gap-2" action={href(lang, "/admin/users")}>
        <input name="q" defaultValue={filter.q} placeholder={u.search} className="h-9 min-w-56 flex-1 rounded-lg border border-line bg-card px-3 text-sm" />
        <select name="filter" defaultValue={filter.filter} className={select}>
          {Object.entries(u.filters).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="sort" defaultValue={filter.sort} className={select}>
          {Object.entries(u.sorts).map(([k, v]) => <option key={k} value={k}>↓ {v}</option>)}
        </select>
        <button className="h-9 rounded-lg bg-fg px-4 text-sm font-medium text-bg">{c.filters.apply}</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-line">
              <th className="px-3 py-2.5 font-medium">{u.cols.user}</th>
              <th className="px-3 py-2.5 font-medium">{u.cols.plan}</th>
              <th className="px-3 py-2.5 text-right font-medium">{u.cols.paid}</th>
              <th className="px-3 py-2.5 text-right font-medium">{u.cols.usage}</th>
              <th className="px-3 py-2.5 font-medium">{u.cols.joined}</th>
              <th className="px-3 py-2.5 font-medium">{u.cols.active}</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className="align-middle">
                <td className="max-w-64 px-3 py-2.5">
                  <p className="truncate font-medium">{r.email ?? r.id}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    {r.provider ?? "—"}
                    {r.has_key && <KeyRound className="size-3" aria-label={u.cols.key} />}
                    {r.founding && <span>· {u.founding}</span>}
                  </p>
                </td>
                <td className="px-3 py-2.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", r.fulltime ? "bg-accent-soft text-accent" : "bg-soft text-muted")}>
                    {r.fulltime ? u.pro : u.free}
                  </span>
                  {r.fulltime && r.fulltime_at && <span className="ml-1.5 text-xs text-muted">{fmtDate(r.fulltime_at, lang, undefined, { day: "numeric", month: "numeric" })}</span>}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.paid_cents ? `$${(r.paid_cents / 100).toFixed(2)}` : <span className="text-muted">—</span>}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.downloads}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted">{fmtDate(r.created_at, lang)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted">{r.last_sign_in_at ? fmtDateTime(r.last_sign_in_at, lang) : u.never}</td>
                <td className="px-3 py-2.5 text-right">
                  <form action={setUserPro.bind(null, r.id, !r.fulltime)}>
                    <button className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium hover:bg-soft">{r.fulltime ? u.take : u.give}</button>
                  </form>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted">{c.none}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={pages} prev={qs(page - 1)} next={qs(page + 1)} labels={c.biz} />
      <p className="text-xs text-muted">{u.note}</p>
    </div>
  );
}
