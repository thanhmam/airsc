import Link from "next/link";
import { Activity, Bot, Clapperboard, FileText, FlaskConical, Images, Info, Radar, ScanSearch, Square } from "lucide-react";
import { aiCredits } from "@/lib/engine/credits";
import { db } from "@/lib/engine/db";
import { MODEL_CHOICES, PREVIEW_DEFAULT } from "@/lib/engine/settings";
import { href, type Locale } from "@/lib/i18n";
import { fmtDateTime, VN_TZ } from "@/lib/time";
import { cn } from "@/lib/utils";
import { cancelRun, runPreset, saveSettings } from "../actions";
import { duration, StatusPill, type Run } from "./shared";

const T = {
  en: {
    title: "Agents & costs",
    idle: "No agent is running",
    running: "Running",
    current: "Current step",
    elapsed: "running for",
    stop: "Stop run",
    next: "Next scheduled run",
    off: "Scheduled runs are turned off",
    quick: "Run now",
    presets: {
      full: ["Full run", "All 7 agents with the saved limits"],
      discover: ["Find & classify", "Scout + Analyst + Curator"],
      curate: ["Curator only", "Classify resources waiting for agents"],
      demo: ["Demo only", "Verify MCP servers in the sandbox"],
      preview: ["Previewer only", "Find real-result images in READMEs"],
      editor: ["Editor only", "Write or refresh guide pages"],
      produce: ["Producer only", "Make explainer videos"],
    },
    agents: "Agents · last 30 days",
    perItem: "per item",
    done: "done",
    disabled: "off",
    settings: "Settings",
    enabled: "Run automatically every day",
    hour: "Time (Vietnam)",
    limits: "Limits per run",
    models: "Models",
    modelHelp: {
      curator: "Reads each new repo, decides if it belongs in the library, scores quality 0-100, picks a category and writes the English and Vietnamese summaries. Runs on every resource, so it is the biggest cost: pick a cheap, fast model.",
      editor: "Writes the guide pages (best resources per category) and the weekly digest, choosing and explaining the top picks. Few pages per day, and the text is public, so a stronger model is worth it.",
      producer: "Writes the 6-scene explainer video script and example prompts for each resource. Currently turned off (limit 0).",
      previewer: "Looks at up to 6 images from each README and keeps the ones that show the resource really working (screenshots, demos, generated output). Needs a vision model; a cheap one is enough.",
    } as Record<string, string>,
    budget: "Budget",
    runCap: "Stop AI agents when a run has spent (USD)",
    minBalance: "Skip AI agents when AI credit is below (USD)",
    save: "Save settings",
    saved: "Last saved",
    credit: "AI credit left",
    runs: "Runs",
    cols: ["Started (VN)", "Trigger", "Status", "Duration", "Cost", "Results"],
    lim: {
      maxNew: "Scout: new repos",
      maxRefresh: "Scout: updated repos",
      maxCurate: "Curator: resources",
      maxProduce: "Producer: videos (0 = off)",
      maxDemo: "Demo: MCP servers",
      maxPreview: "Previewer: resources",
      maxPages: "Editor: guide pages",
    } as Record<string, string>,
  },
  vi: {
    title: "Agent & chi phí",
    idle: "Không có agent nào đang chạy",
    running: "Đang chạy",
    current: "Bước hiện tại",
    elapsed: "đã chạy",
    stop: "Dừng lần chạy",
    next: "Lần chạy tự động tiếp theo",
    off: "Lịch chạy tự động đang tắt",
    quick: "Chạy ngay",
    presets: {
      full: ["Chạy đầy đủ", "Cả 7 agent theo giới hạn đã lưu"],
      discover: ["Tìm & phân loại", "Scout + Analyst + Curator"],
      curate: ["Chỉ Curator", "Phân loại tài nguyên đang chờ agent"],
      demo: ["Chỉ Demo", "Chạy thử MCP server trong sandbox"],
      preview: ["Chỉ Previewer", "Tìm ảnh kết quả thật trong README"],
      editor: ["Chỉ Editor", "Viết hoặc làm mới trang hướng dẫn"],
      produce: ["Chỉ Producer", "Tạo video giới thiệu"],
    },
    agents: "Các agent · 30 ngày qua",
    perItem: "mỗi mục",
    done: "đã xử lý",
    disabled: "đang tắt",
    settings: "Thiết lập",
    enabled: "Tự động chạy mỗi ngày",
    hour: "Giờ chạy (giờ VN)",
    limits: "Giới hạn mỗi lần chạy",
    models: "Model",
    modelHelp: {
      curator: "Đọc từng repo mới, quyết định có đưa vào thư viện không, chấm điểm chất lượng 0-100, chọn danh mục và viết tóm tắt tiếng Anh và tiếng Việt. Chạy cho mọi tài nguyên nên tốn nhất: nên chọn model rẻ và nhanh.",
      editor: "Viết các trang hướng dẫn (tài nguyên tốt nhất theo danh mục) và bản tin tuần, chọn và giải thích các lựa chọn hàng đầu. Mỗi ngày chỉ vài trang và nội dung hiển thị công khai nên đáng dùng model mạnh hơn.",
      producer: "Viết kịch bản video giới thiệu 6 cảnh và các câu lệnh mẫu cho từng tài nguyên. Hiện đang tắt (giới hạn 0).",
      previewer: "Xem tối đa 6 ảnh trong README của mỗi tài nguyên và giữ lại ảnh cho thấy tài nguyên chạy thật (ảnh chụp màn hình, demo, kết quả tạo ra). Cần model đọc được ảnh; model rẻ là đủ.",
    },
    budget: "Ngân sách",
    runCap: "Dừng agent AI khi một lần chạy đã tiêu (USD)",
    minBalance: "Bỏ qua agent AI khi credit còn dưới (USD)",
    save: "Lưu thiết lập",
    saved: "Lưu lần cuối",
    credit: "Credit AI còn lại",
    runs: "Các lần chạy",
    cols: ["Bắt đầu (giờ VN)", "Kích hoạt", "Trạng thái", "Thời gian", "Chi phí", "Kết quả"],
    lim: {
      maxNew: "Scout: repo mới",
      maxRefresh: "Scout: repo cập nhật",
      maxCurate: "Curator: tài nguyên",
      maxProduce: "Producer: video (0 = tắt)",
      maxDemo: "Demo: MCP server",
      maxPreview: "Previewer: tài nguyên",
      maxPages: "Editor: trang hướng dẫn",
    },
  },
};

const withinDays = (iso: string, days: number) => Date.now() - new Date(iso).getTime() < days * 86_400_000;

/** Next run at HH:00 Vietnam time (today if still ahead and not yet run, else tomorrow) */
function nextRun(hour: number, ranToday: boolean, lang: string) {
  const vnNow = new Date(new Date().toLocaleString("en-US", { timeZone: VN_TZ }));
  const target = new Date(vnNow);
  target.setHours(hour, 0, 0, 0);
  if (ranToday || target <= vnNow) target.setDate(target.getDate() + 1);
  return `${String(hour).padStart(2, "0")}:00 · ${target.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", { weekday: "long", day: "numeric", month: "numeric" })}`;
}

export default async function AdminAgents({ params }: PageProps<"/[lang]/admin/agents">) {
  const { lang } = (await params) as { lang: Locale };
  const t = T[lang];
  const [runs, credits, settings, ranToday] = await Promise.all([
    db.runs(40) as Promise<Run[]>,
    aiCredits(),
    db.settings(),
    db.cronRanToday(),
  ]);
  const running = runs.find((r) => r.status === "running");
  const recent = runs.filter((r) => withinDays(r.started_at, 30));
  const sum = (k: string) => recent.reduce((s, r) => s + Number(r.stats[k] ?? 0), 0);
  // average cost only over runs that recorded this agent's cost
  const perItem = (countKey: string, costKey: string) => {
    const tracked = recent.filter((r) => r.stats[costKey] !== undefined);
    const n = tracked.reduce((s, r) => s + Number(r.stats[countKey] ?? 0), 0);
    const c = tracked.reduce((s, r) => s + Number(r.stats[costKey] ?? 0), 0);
    return n > 0 ? c / n : null;
  };

  const agents = [
    { name: "Scout", icon: Radar, desc: lang === "vi" ? "Tìm repo mới và repo vừa cập nhật" : "Finds new and updated repos", count: sum("discovered_new") + sum("refresh"), cost: 0, model: "GitHub · MCP Registry · npm", off: settings.limits.maxNew === 0 },
    { name: "Analyst", icon: ScanSearch, desc: lang === "vi" ? "Đọc file, quét an toàn, cấu hình cài" : "Reads files, safety scan, install config", count: sum("analysed"), cost: 0, model: "GitHub API", off: false },
    { name: "Curator", icon: Bot, desc: lang === "vi" ? "Phân loại, chấm điểm, tóm tắt EN/VI, đăng hoặc lọc bỏ" : "Classifies, scores, summarises, publishes or filters", count: sum("curated"), cost: sum("cost_curator"), unit: perItem("curated", "cost_curator"), model: settings.models.curator, off: settings.limits.maxCurate === 0 },
    { name: "Producer", icon: Clapperboard, desc: lang === "vi" ? "Kịch bản video + câu lệnh mẫu" : "Explainer video script + prompts", count: sum("produced"), cost: sum("cost_producer"), unit: perItem("produced", "cost_producer"), model: settings.models.producer, off: settings.limits.maxProduce === 0 },
    { name: "Demo", icon: FlaskConical, desc: lang === "vi" ? "Chạy thật MCP server trong sandbox" : "Runs MCP servers in a sandbox", count: sum("demos_tried"), extra: `${sum("demos_verified")} ✓`, cost: 0, model: "Vercel Sandbox", off: settings.limits.maxDemo === 0 },
    { name: "Previewer", icon: Images, desc: lang === "vi" ? "Ảnh kết quả thật từ README" : "Real-result images from READMEs", count: sum("previewed"), extra: `${sum("previews_found")} 🖼`, cost: sum("cost_previewer"), unit: perItem("previewed", "cost_previewer"), model: settings.models.previewer ?? PREVIEW_DEFAULT, off: (settings.limits.maxPreview ?? 40) === 0 },
    { name: "Editor", icon: FileText, desc: lang === "vi" ? "Viết trang hướng dẫn, bản tin tuần" : "Writes guides and the weekly digest", count: sum("pages"), cost: sum("cost_editor"), unit: perItem("pages", "cost_editor"), model: settings.models.editor, off: settings.limits.maxPages === 0 },
  ];
  const input = "h-8 w-24 rounded-lg border border-line bg-bg px-2 text-right text-sm tabular-nums";
  const select = "h-8 rounded-lg border border-line bg-bg px-2 text-sm";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>

      {/* Live status */}
      <section className={cn("flex flex-wrap items-center gap-4 rounded-2xl border p-4", running ? "border-accent bg-accent-soft/40" : "border-line bg-card")}>
        <Activity className={cn("size-5", running ? "animate-pulse text-accent" : "text-muted")} aria-hidden />
        {running ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {t.running} · {running.trigger} · {t.elapsed} {duration(running.started_at, null)}
              </p>
              <p className="truncate text-sm text-muted">
                {t.current}: {running.log.at(-1)?.msg ?? "…"}
              </p>
            </div>
            <Link href={href(lang, `/admin/agents/runs/${running.id}`)} className="text-sm text-accent hover:underline">
              Log →
            </Link>
            <form action={cancelRun.bind(null, running.run_id)}>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-danger/50 px-3 py-1.5 text-sm text-danger hover:bg-danger-soft">
                <Square className="size-3.5" aria-hidden /> {t.stop}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1">
            <p className="font-medium">{t.idle}</p>
            <p className="text-sm text-muted">{settings.enabled ? `${t.next}: ${nextRun(settings.run_hour_vn, ranToday, lang)}` : t.off}</p>
          </div>
        )}
        <div className="text-right text-sm">
          <p className="text-xs text-muted">{t.credit}</p>
          <p className="text-lg font-semibold tabular-nums">{credits ? `$${credits.balance.toFixed(2)}` : "—"}</p>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-2 text-sm font-medium">{t.quick}</h2>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {(Object.keys(t.presets) as (keyof typeof t.presets)[]).map((p) => (
            <form key={p} action={runPreset.bind(null, p)}>
              <button
                disabled={!!running}
                className="w-full rounded-xl border border-line bg-card p-3 text-left transition hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="block text-sm font-medium">{t.presets[p][0]}</span>
                <span className="block text-xs text-muted">{t.presets[p][1]}</span>
              </button>
            </form>
          ))}
        </div>
      </section>

      {/* Agent cards */}
      <section>
        <h2 className="mb-2 text-sm font-medium">{t.agents}</h2>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((a) => (
            <div key={a.name} className={cn("rounded-xl border border-line bg-card p-3", a.off && "opacity-60")}>
              <div className="flex items-center gap-2">
                <a.icon className="size-4 text-accent" aria-hidden />
                <span className="font-medium">{a.name}</span>
                {a.off && <span className="rounded-full bg-soft px-1.5 text-[11px] text-muted">{t.disabled}</span>}
              </div>
              <p className="mt-1 text-xs text-muted">{a.desc}</p>
              <p className="mt-2 truncate font-mono text-[11px] text-muted">{a.model}</p>
              <div className="mt-2 flex items-baseline justify-between text-sm">
                <span>
                  <b className="tabular-nums">{a.count.toLocaleString()}</b> <span className="text-xs text-muted">{t.done}</span>
                  {"extra" in a && a.extra ? <span className="ml-1.5 text-xs text-safe">{a.extra}</span> : null}
                </span>
                <span className="text-right">
                  <b className="tabular-nums">${a.cost.toFixed(2)}</b>
                  {"unit" in a && typeof a.unit === "number" && (
                    <span className="block text-[11px] text-muted">
                      ${a.unit.toFixed(4)} {t.perItem}
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Settings */}
      <form action={saveSettings} className="grid gap-4 rounded-2xl border border-line bg-card p-4 lg:grid-cols-3">
        <div className="space-y-3">
          <h2 className="text-sm font-medium">{t.settings}</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="enabled" defaultChecked={settings.enabled} className="size-4 accent-[var(--accent)]" />
            {t.enabled}
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            {t.hour}
            <select name="run_hour_vn" defaultValue={settings.run_hour_vn} className={select}>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{`${String(h).padStart(2, "0")}:00`}</option>
              ))}
            </select>
          </label>
          <p className="pt-1 text-xs font-medium text-muted">{t.budget}</p>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>{t.runCap}</span>
            <input name="run_usd" type="number" step="0.1" min={0} defaultValue={settings.budget.run_usd} className={input} />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>{t.minBalance}</span>
            <input name="min_balance_usd" type="number" step="0.1" min={0} defaultValue={settings.budget.min_balance_usd} className={input} />
          </label>
        </div>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-xs font-medium text-muted">{t.limits}</legend>
          {(["maxNew", "maxRefresh", "maxCurate", "maxProduce", "maxDemo", "maxPreview", "maxPages"] as const).map((k) => (
            <label key={k} className="flex items-center justify-between gap-3 text-sm">
              {t.lim[k]}
              <input name={k} type="number" min={0} defaultValue={settings.limits[k] ?? 40} className={input} />
            </label>
          ))}
        </fieldset>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted">{t.models}</p>
          {(["curator", "editor", "producer", "previewer"] as const).map((k) => (
            <label key={k} className="flex flex-col gap-1 text-sm">
              <span className="group relative inline-flex w-fit items-center gap-1.5 capitalize">
                {k}
                <button
                  type="button"
                  aria-label={t.modelHelp[k]}
                  className="rounded-full text-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Info className="size-3.5" aria-hidden />
                </button>
                <span
                  role="tooltip"
                  className="pointer-events-none invisible absolute bottom-full left-0 z-20 mb-2 w-72 rounded-xl border border-line bg-fg p-3 text-xs font-normal normal-case leading-relaxed text-bg opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
                >
                  {t.modelHelp[k]}
                </span>
              </span>
              <select name={`model_${k}`} defaultValue={settings.models[k] ?? PREVIEW_DEFAULT} className={select}>
                {MODEL_CHOICES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} · {m.price}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button className="mt-auto h-9 rounded-lg bg-accent text-sm font-medium text-accent-fg hover:opacity-90">{t.save}</button>
          {settings.updated_at && (
            <p className="text-right text-[11px] text-muted">
              {t.saved}: {fmtDateTime(settings.updated_at, lang)}
            </p>
          )}
        </div>
      </form>

      {/* Runs */}
      <section>
        <h2 className="mb-2 text-sm font-medium">{t.runs}</h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr className="border-b border-line">
                {t.cols.map((c, i) => (
                  <th key={c} className={cn("px-3 py-2.5 font-medium", i === 4 && "text-right")}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-soft/60">
                  <td className="whitespace-nowrap px-3 py-2">
                    <Link href={href(lang, `/admin/agents/runs/${r.id}`)} className="hover:text-accent">
                      {fmtDateTime(r.started_at, lang)}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{r.trigger}</td>
                  <td className="px-3 py-2"><StatusPill status={r.status} /></td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{duration(r.started_at, r.finished_at)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.stats.cost_usd !== undefined ? `$${Number(r.stats.cost_usd).toFixed(3)}` : "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted">
                    {Object.entries(r.stats).filter(([k]) => !k.startsWith("cost")).map(([k, v]) => `${k.replace(/_/g, " ")} ${v}`).join(" · ") || "…"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
