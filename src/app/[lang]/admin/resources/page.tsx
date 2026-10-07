import Link from "next/link";
import { BadgeCheck, CircleDashed, Clapperboard, Tags, XCircle } from "lucide-react";
import { SafetyBadge } from "@/components/safety-badge";
import { db } from "@/lib/engine/db";
import { getDict, href, type Locale } from "@/lib/i18n";
import { CATEGORIES, categoryLabel } from "@/lib/taxonomy";
import { RESOURCE_TYPES } from "@/lib/types";
import { fmtDate } from "@/lib/time";
import { cn } from "@/lib/utils";
import { requeue, setStatus } from "../actions";
import { adminCopy } from "../copy";

const PAGE = 50;
const STATUS_STYLE = {
  published: "bg-safe-soft text-safe",
  pending: "bg-caution-soft text-caution",
  hidden: "bg-soft text-muted",
} as const;

export default async function AdminResources({ params, searchParams }: PageProps<"/[lang]/admin/resources">) {
  const { lang } = (await params) as { lang: Locale };
  const c = adminCopy(lang);
  const t = getDict(lang);
  const sp = await searchParams;
  const one = (k: string) => {
    const v = Array.isArray(sp[k]) ? sp[k][0] : sp[k];
    return v ? String(v) : undefined;
  };
  const filter = {
    q: one("q"),
    type: one("type"),
    status: one("status"),
    category: one("category"),
    safety: one("safety"),
    stage: one("stage"),
    sort: one("sort") ?? "stars",
  };
  const page = Math.max(1, Number(one("page")) || 1);
  const { total, rows } = await db.adminResources({ ...filter, limit: PAGE, offset: (page - 1) * PAGE });
  const pages = Math.ceil(total / PAGE);
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    Object.entries({ ...filter, page: String(page), ...patch }).forEach(([k, v]) => v && p.set(k, v));
    return `${href(lang, "/admin/resources")}?${p}`;
  };
  const select = "h-9 rounded-lg border border-line bg-card px-2 text-sm";
  const date = (d: string | null) => (d ? fmtDate(d, lang, undefined, { day: "numeric", month: "numeric" }) : "");

  const heading =
    filter.stage === "unclassified"
      ? c.tabs.queued
      : filter.status === "hidden"
        ? c.tabs.hidden
        : filter.type
          ? t.typesPlural[filter.type]
          : c.tabs.allResources;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">
        {heading} <span className="text-base font-normal text-muted tabular-nums">· {total.toLocaleString(lang)}</span>
      </h1>
      <form className="flex flex-wrap gap-2" action={href(lang, "/admin/resources")}>
        <input name="q" defaultValue={filter.q} placeholder={c.filters.search} className="h-9 min-w-56 flex-1 rounded-lg border border-line bg-card px-3 text-sm" />
        <select name="type" defaultValue={filter.type ?? ""} className={select}>
          <option value="">{c.filters.allTypes}</option>
          {RESOURCE_TYPES.map((x) => <option key={x} value={x}>{t.typesPlural[x]}</option>)}
        </select>
        <select name="status" defaultValue={filter.status ?? ""} className={select}>
          <option value="">{c.filters.allStatus}</option>
          <option value="published">{c.kpi.published}</option>
          <option value="pending">{c.kpi.queued}</option>
          <option value="hidden">{c.kpi.hidden}</option>
        </select>
        <select name="category" defaultValue={filter.category ?? ""} className={select}>
          <option value="">{c.filters.allCategories}</option>
          {CATEGORIES.map((x) => <option key={x.slug} value={x.slug}>{x[lang]}</option>)}
        </select>
        <select name="safety" defaultValue={filter.safety ?? ""} className={select}>
          <option value="">{c.filters.allSafety}</option>
          {(["safe", "caution", "danger"] as const).map((x) => <option key={x} value={x}>{t.safety[x]}</option>)}
        </select>
        <select name="stage" defaultValue={filter.stage ?? ""} className={select}>
          <option value="">{c.filters.allStages}</option>
          {Object.entries(c.filters.stages).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="sort" defaultValue={filter.sort} className={select}>
          {Object.entries(c.filters.sorts).map(([k, v]) => <option key={k} value={k}>↓ {v}</option>)}
        </select>
        <button className="h-9 rounded-lg bg-fg px-4 text-sm font-medium text-bg">{c.filters.apply}</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-line">
              <th className="px-3 py-2.5 font-medium">{c.table.resource}</th>
              <th className="px-3 py-2.5 font-medium">{c.table.status}</th>
              <th className="px-3 py-2.5 font-medium">{c.table.category}</th>
              <th className="px-3 py-2.5 text-right font-medium">{c.table.quality}</th>
              <th className="px-3 py-2.5 font-medium">{c.table.pipeline}</th>
              <th className="px-3 py-2.5 text-right font-medium">{c.table.views}</th>
              <th className="px-3 py-2.5 text-right font-medium">{c.table.downloads}</th>
              <th className="px-3 py-2.5 text-right font-medium">{c.table.stars}</th>
              <th className="px-3 py-2.5 font-medium">{c.table.seen}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.slug} className="align-top">
                <td className="max-w-72 px-3 py-2.5">
                  <Link href={href(lang, `/r/${r.slug}`)} className="font-medium hover:text-accent">{r.name}</Link>
                  <a href={r.repo_url} target="_blank" rel="noreferrer" className="block truncate text-xs text-muted hover:text-fg">{r.full_name}</a>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    {t.types[r.type]} <SafetyBadge safety={r.safety} t={t} />
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[r.status])}>
                    {r.status === "published" ? c.kpi.published : r.status === "pending" ? c.kpi.queued : c.kpi.hidden}
                  </span>
                  {r.status === "hidden" && r.hidden_reason && (
                    <p className="mt-1 max-w-40 text-[11px] leading-snug text-muted" title={r.quality_notes ?? undefined}>
                      {c.reasons[r.hidden_reason]}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {r.status !== "published" && (
                      <form action={setStatus.bind(null, r.slug, "published")}><button className="rounded border border-line px-1.5 py-0.5 text-[11px] hover:border-safe hover:text-safe">{c.actions.publish}</button></form>
                    )}
                    {r.status !== "hidden" && (
                      <form action={setStatus.bind(null, r.slug, "hidden")}><button className="rounded border border-line px-1.5 py-0.5 text-[11px] hover:border-danger hover:text-danger">{c.actions.hide}</button></form>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-xs">{categoryLabel(r.category, lang) ?? "—"}</td>
                <td className="px-3 py-2.5 text-right tabular-nums" title={r.quality_notes ?? undefined}>{r.quality ?? "—"}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span title={c.filters.stages.unclassified} className={r.classified_at ? "text-safe" : "text-muted"}>
                      {r.classified_at ? <Tags className="size-4" aria-label="classified" /> : <CircleDashed className="size-4" aria-label="not classified" />}
                    </span>
                    <span title={c.filters.stages.has_video} className={r.produced_at ? "text-accent" : "text-muted/40"}>
                      <Clapperboard className="size-4" aria-label={r.produced_at ? "video" : "no video"} />
                    </span>
                    {r.demo_ok === "true" ? (
                      <span className="inline-flex items-center gap-0.5 text-safe"><BadgeCheck className="size-4" aria-label="demo ok" />{r.demo_tools}</span>
                    ) : r.demo_ok === "false" ? (
                      <span className="text-danger" title={r.demo_error ?? undefined}><XCircle className="size-4" aria-label="demo failed" /></span>
                    ) : null}
                  </div>
                  <details className="mt-1 text-[11px] text-muted">
                    <summary className="cursor-pointer select-none">↻</summary>
                    <div className="mt-1 flex flex-col items-start gap-1">
                      <form action={requeue.bind(null, r.slug, "curate")}><button className="hover:text-fg">{c.actions.recurate}</button></form>
                      <form action={requeue.bind(null, r.slug, "produce")}><button className="hover:text-fg">{c.actions.revideo}</button></form>
                      {r.type === "mcp" && <form action={requeue.bind(null, r.slug, "demo")}><button className="hover:text-fg">{c.actions.redemo}</button></form>}
                    </div>
                  </details>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.views}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.downloads}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.stars.toLocaleString(lang)}</td>
                <td className="px-3 py-2.5 text-xs text-muted" title={r.sources.join(", ")}>{date(r.first_seen_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav className="flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={qs({ page: String(page - 1) })} className="rounded-lg border border-line px-3 py-1.5">←</Link>}
          <span className="tabular-nums text-muted">{page} / {pages}</span>
          {page < pages && <Link href={qs({ page: String(page + 1) })} className="rounded-lg border border-line px-3 py-1.5">→</Link>}
        </nav>
      )}
    </div>
  );
}
