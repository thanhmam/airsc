import Link from "next/link";
import { aiCredits } from "@/lib/engine/credits";
import { db, type Scoreboard } from "@/lib/engine/db";
import { href, type Locale } from "@/lib/i18n";
import { LOOPS } from "@/lib/loops/specs";
import { JOBS } from "@/lib/taxonomy";
import { fmtDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { duration, StatusPill } from "../agents/shared";

const T = {
  en: {
    title: "Engine scoreboard",
    intro: "How the loops that run Airsc are doing. Every loop has a goal a machine can check; the numbers below are what it is measured on.",
    missing: "The signals table does not exist yet: apply migration 20261026000300_signals.sql to see this page.",
    kpi: {
      searches: "Searches · 7 days",
      zero: "Searches with no result",
      mcp: "From the MCP server",
      published: "Published resources",
      fresh: "New in 7 days",
      views: "Page views, all time",
      opens: "GitHub opens, all time",
      credit: "AI credit left",
    },
    vsPrev: "vs the 7 days before",
    zeroTitle: "Looked for and not found · 14 days",
    zeroHint: "Each of these is a gap in the catalog: the Scout will use them to choose what to look for (planned, P4).",
    topTitle: "Most searched · 14 days",
    results: "avg results",
    none: "Nothing yet. Searches are recorded from now on.",
    jobs: "Resources per job",
    unlabelled: "Without a job",
    runs: "Latest engine runs",
    cols: { when: "Started", trigger: "Trigger", status: "Status", took: "Took", added: "New", curated: "Curated", cost: "Cost" },
    loops: "The loops",
    loopCols: { goal: "Goal", verifier: "Verifier", stop: "Stops when", learns: "Learns from" },
    status: { live: "live", partial: "partly", planned: "planned" } as Record<string, string>,
    agents: "Agents and run settings",
  },
  vi: {
    title: "Scoreboard của cỗ máy",
    intro: "Các vòng lặp đang vận hành Airsc chạy ra sao. Mỗi vòng có mục tiêu mà máy kiểm tra được; các con số dưới đây là thước đo của nó.",
    missing: "Bảng tín hiệu chưa tồn tại: áp migration 20261026000300_signals.sql để xem trang này.",
    kpi: {
      searches: "Lượt tìm · 7 ngày",
      zero: "Lượt tìm không ra kết quả",
      mcp: "Từ MCP server",
      published: "Tài nguyên đang hiển thị",
      fresh: "Mới trong 7 ngày",
      views: "Lượt xem trang, từ đầu",
      opens: "Lượt mở GitHub, từ đầu",
      credit: "Credit AI còn lại",
    },
    vsPrev: "so với 7 ngày trước đó",
    zeroTitle: "Có người tìm nhưng không thấy · 14 ngày",
    zeroHint: "Mỗi dòng là một chỗ trống trong thư viện: Scout sẽ dùng chúng để chọn thứ cần đi tìm (dự kiến P4).",
    topTitle: "Tìm nhiều nhất · 14 ngày",
    results: "kết quả TB",
    none: "Chưa có gì. Các lượt tìm được ghi lại từ bây giờ.",
    jobs: "Số tài nguyên theo nghề",
    unlabelled: "Chưa có nghề",
    runs: "Các lần chạy engine gần nhất",
    cols: { when: "Bắt đầu", trigger: "Kích hoạt", status: "Trạng thái", took: "Mất", added: "Mới", curated: "Đã phân loại", cost: "Chi phí" },
    loops: "Các vòng lặp",
    loopCols: { goal: "Mục tiêu", verifier: "Kiểm tra bằng", stop: "Dừng khi", learns: "Học từ" },
    status: { live: "đang chạy", partial: "một phần", planned: "dự kiến" } as Record<string, string>,
    agents: "Agent và thiết lập chạy",
  },
};

const n = (v: number) => v.toLocaleString("en-US");

function Delta({ now, before, goodWhenUp = true }: { now: number; before: number; goodWhenUp?: boolean }) {
  if (!before && !now) return null;
  const d = now - before;
  if (!d) return <span className="text-muted">=</span>;
  const good = goodWhenUp ? d > 0 : d < 0;
  return <span className={good ? "text-safe" : "text-caution"}>{d > 0 ? `+${n(d)}` : n(d)}</span>;
}

function Kpi({ label, value, note }: { label: string; value: string; note?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {note && <p className="mt-0.5 text-xs tabular-nums">{note}</p>}
    </div>
  );
}

/** The scoreboard: the numbers each loop is measured on, the latest runs, and the loops written out */
export default async function EnginePage({ params }: PageProps<"/[lang]/admin/engine">) {
  const { lang } = (await params) as { lang: Locale };
  const t = T[lang];
  const [board, credits] = await Promise.all([db.scoreboard().catch(() => null as Scoreboard | null), aiCredits()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{t.intro}</p>
      </div>

      {!board ? (
        <p className="rounded-2xl border border-dashed border-caution/60 bg-caution-soft/40 p-4 text-sm">{t.missing}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label={t.kpi.searches} value={n(board.searches.last7)} note={<><Delta now={board.searches.last7} before={board.searches.prev7} /> <span className="text-muted">{t.vsPrev}</span></>} />
            <Kpi
              label={t.kpi.zero}
              value={board.searches.last7 ? `${Math.round((board.searches.zero_last7 / board.searches.last7) * 100)}%` : "—"}
              note={<><span className="text-muted">{n(board.searches.zero_last7)} · </span><Delta now={board.searches.zero_last7} before={board.searches.zero_prev7} goodWhenUp={false} /></>}
            />
            <Kpi label={t.kpi.mcp} value={n(board.searches.mcp_last7)} />
            <Kpi label={t.kpi.credit} value={credits ? `$${credits.balance.toFixed(2)}` : "—"} />
            <Kpi label={t.kpi.published} value={n(board.catalog.published)} />
            <Kpi label={t.kpi.fresh} value={n(board.catalog.new7)} note={<><Delta now={board.catalog.new7} before={board.catalog.new_prev7} /> <span className="text-muted">{t.vsPrev}</span></>} />
            <Kpi label={t.kpi.views} value={n(board.catalog.views)} />
            <Kpi label={t.kpi.opens} value={n(board.catalog.opens)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-line bg-card p-4">
              <h2 className="font-semibold">{t.zeroTitle}</h2>
              <p className="mt-1 text-xs text-muted">{t.zeroHint}</p>
              {board.searches.zero_queries.length ? (
                <ul className="mt-3 divide-y divide-line text-sm">
                  {board.searches.zero_queries.map((x) => (
                    <li key={x.q} className="flex justify-between gap-3 py-1.5">
                      <span className="min-w-0 truncate font-mono text-[13px]">{x.q}</span>
                      <span className="tabular-nums text-muted">{x.n}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">{t.none}</p>
              )}
            </section>
            <section className="rounded-2xl border border-line bg-card p-4">
              <h2 className="font-semibold">{t.topTitle}</h2>
              {board.searches.top_queries.length ? (
                <ul className="mt-3 divide-y divide-line text-sm">
                  {board.searches.top_queries.map((x) => (
                    <li key={x.q} className="flex justify-between gap-3 py-1.5">
                      <span className="min-w-0 truncate font-mono text-[13px]">{x.q}</span>
                      <span className="tabular-nums text-muted">
                        {x.n} · {x.avg_results} {t.results}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">{t.none}</p>
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-line bg-card p-4">
            <h2 className="font-semibold">{t.jobs}</h2>
            <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {JOBS.map((j) => (
                <li key={j.slug} className="flex justify-between gap-3">
                  <span>{j[lang]}</span>
                  <span className="tabular-nums text-muted">{n(board.catalog.jobs[j.slug] ?? 0)}</span>
                </li>
              ))}
              {board.catalog.unlabelled > 0 && (
                <li className="flex justify-between gap-3 text-caution">
                  <span>{t.unlabelled}</span>
                  <span className="tabular-nums">{n(board.catalog.unlabelled)}</span>
                </li>
              )}
            </ul>
          </section>

          <section>
            <div className="mb-2 flex items-end justify-between gap-3">
              <h2 className="font-semibold">{t.runs}</h2>
              <Link href={href(lang, "/admin/agents")} className="text-sm text-accent hover:underline">
                {t.agents} →
              </Link>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-line bg-card">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs text-muted">
                  <tr className="border-b border-line">
                    {Object.values(t.cols).map((c) => (
                      <th key={c} className="px-3 py-2.5 font-medium">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {board.runs.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap px-3 py-2 text-xs tabular-nums">{fmtDateTime(r.started_at, lang)}</td>
                      <td className="px-3 py-2 text-xs">{r.trigger}</td>
                      <td className="px-3 py-2"><StatusPill status={r.status} /></td>
                      <td className="px-3 py-2 text-xs tabular-nums">{duration(r.started_at, r.finished_at)}</td>
                      <td className="px-3 py-2 text-xs tabular-nums">{r.stats?.discovered_new ?? 0}</td>
                      <td className="px-3 py-2 text-xs tabular-nums">{r.stats?.curated ?? 0}</td>
                      <td className="px-3 py-2 text-xs tabular-nums">${(r.stats?.cost_usd ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <section>
        <h2 className="mb-2 font-semibold">{t.loops}</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {LOOPS.map((l) => (
            <article key={l.id} className="rounded-2xl border border-line bg-card p-4 text-sm">
              <header className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{l.name[lang]}</h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    l.status === "live" ? "bg-safe-soft text-safe" : l.status === "partial" ? "bg-caution-soft text-caution" : "bg-soft text-muted",
                  )}
                >
                  {t.status[l.status]}
                </span>
                <span className="ml-auto font-mono text-xs text-muted">{l.where}</span>
              </header>
              <p className="mt-1 text-xs text-muted">{l.trigger[lang]}</p>
              <dl className="mt-3 space-y-2 text-[13px] leading-relaxed">
                {(["goal", "verifier", "stop", "learns"] as const).map((k) => (
                  <div key={k}>
                    <dt className="text-xs font-medium text-muted">{t.loopCols[k]}</dt>
                    <dd>{l[k][lang]}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
