import Image from "next/image";
import { db } from "@/lib/engine/db";
import { socialSettings } from "@/lib/engine/settings";
import type { Locale } from "@/lib/i18n";
import { vnDay } from "@/lib/social/compose";
import { xConfigured } from "@/lib/social/x";
import { fmtDate, fmtDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { saveSocialSettings } from "../actions";
import { SocialEditor, type EditorCopy } from "./editor";

const T = {
  en: {
    title: "Social posts",
    intro: "Every day the Content Engine writes an X post about Today's picks, with a card showing the picks and the real result of the best one. It goes out at the hour below unless you skip it.",
    today: "Today's post",
    none: "No draft yet: it is written after the daily run chooses the picks, or now:",
    settings: "Settings",
    enabled: "Post Today's picks on X",
    auto: "Post automatically at the hour below (off: only when you press Post now)",
    hour: "Posting time (Vietnam)",
    save: "Save settings",
    keys: "X API keys",
    keysOk: "set on this deployment",
    keysMissing: "missing on this deployment: posting is off here",
    history: "History",
    cols: ["Day", "Status", "Highlight", "Post"],
    status: { draft: "draft", posting: "posting", posted: "posted", skipped: "skipped", failed: "failed" } as Record<string, string>,
    editor: {
      save: "Save text",
      saved: "Done.",
      postNow: "Post now",
      posted: "Posted:",
      skip: "Skip today",
      regenerate: "Write again",
      generate: "Write today's draft",
      markPosted: "It is on X",
      markFailed: "It is not on X",
      stuck: "This post was being sent when something stopped. Check the account on X, then mark it.",
      confirmPost: "Post this to X now?",
      chars: "characters (X count)",
      notConfigured: "X API keys are not set on this deployment",
    } satisfies EditorCopy,
  },
  vi: {
    title: "Bài đăng mạng xã hội",
    intro: "Mỗi ngày Content Engine viết một bài X về Chọn lọc hôm nay, kèm một ảnh card liệt kê các tài nguyên và kết quả thật của tài nguyên nổi bật nhất. Bài sẽ tự đăng vào giờ bên dưới trừ khi bạn bỏ qua.",
    today: "Bài hôm nay",
    none: "Chưa có bản nháp: bản nháp được viết sau khi lần chạy hằng ngày chọn xong, hoặc viết ngay:",
    settings: "Thiết lập",
    enabled: "Đăng Chọn lọc hôm nay lên X",
    auto: "Tự đăng vào giờ bên dưới (tắt: chỉ đăng khi bạn bấm Đăng ngay)",
    hour: "Giờ đăng (giờ VN)",
    save: "Lưu thiết lập",
    keys: "Khóa X API",
    keysOk: "đã có trên bản triển khai này",
    keysMissing: "chưa có trên bản triển khai này: không thể đăng từ đây",
    history: "Lịch sử",
    cols: ["Ngày", "Trạng thái", "Nổi bật", "Bài đăng"],
    status: { draft: "bản nháp", posting: "đang đăng", posted: "đã đăng", skipped: "bỏ qua", failed: "lỗi" } as Record<string, string>,
    editor: {
      save: "Lưu nội dung",
      saved: "Xong.",
      postNow: "Đăng ngay",
      posted: "Đã đăng:",
      skip: "Bỏ qua hôm nay",
      regenerate: "Viết lại",
      generate: "Viết bản nháp hôm nay",
      markPosted: "Đã lên X",
      markFailed: "Chưa lên X",
      stuck: "Bài này bị dừng giữa lúc đang gửi. Hãy kiểm tra tài khoản X rồi đánh dấu.",
      confirmPost: "Đăng bài này lên X ngay?",
      chars: "ký tự (theo cách X đếm)",
      notConfigured: "Bản triển khai này chưa có khóa X API",
    } satisfies EditorCopy,
  },
};

const TONE: Record<string, string> = {
  posted: "bg-safe-soft text-safe",
  failed: "bg-danger-soft text-danger",
  posting: "bg-caution-soft text-caution",
  draft: "bg-accent-soft text-accent",
  skipped: "bg-soft text-muted",
};

export default async function AdminSocial({ params }: PageProps<"/[lang]/admin/social">) {
  const { lang } = (await params) as { lang: Locale };
  const t = T[lang];
  const day = vnDay();
  const [settings, posts] = await Promise.all([db.settings(), db.socialPosts(14)]);
  const s = socialSettings(settings);
  const configured = xConfigured();
  const today = posts.find((p) => p.day === day && p.channel === "x") ?? null;
  const select = "h-8 rounded-lg border border-line bg-bg px-2 text-sm";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{t.intro}</p>
      </div>

      <section className="rounded-2xl border border-line bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-medium">
            {t.today} · {fmtDate(`${day}T12:00:00+07:00`, lang)}
          </h2>
          {today && <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", TONE[today.status])}>{t.status[today.status]}</span>}
          {today?.post_url && (
            <a href={today.post_url} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
              {today.post_url}
            </a>
          )}
        </div>
        {today?.error && <p className="mb-3 rounded-lg bg-danger-soft p-2 font-mono text-xs text-danger">{today.error}</p>}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            {!today && <p className="mb-3 text-sm text-muted">{t.none}</p>}
            <SocialEditor key={today?.updated_at ?? "none"} day={day} post={today} configured={configured} c={t.editor} />
          </div>
          {today && (
            <div className="flex flex-col gap-2">
              <Image
                src={`/api/social/card/${day}?v=${encodeURIComponent(today.updated_at)}`}
                alt={today.image_alt ?? ""}
                width={1200}
                height={675}
                unoptimized
                className="h-auto w-full rounded-xl border border-line"
              />
              {today.image_alt && <p className="text-xs text-muted">{today.image_alt}</p>}
            </div>
          )}
        </div>
      </section>

      <form action={saveSocialSettings} className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
        <h2 className="text-sm font-medium">{t.settings}</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="x_enabled" defaultChecked={s.x_enabled} className="size-4 accent-[var(--accent)]" />
          {t.enabled}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="x_auto" defaultChecked={s.x_auto} className="size-4 accent-[var(--accent)]" />
          {t.auto}
        </label>
        <label className="flex items-center gap-3 text-sm">
          {t.hour}
          <select name="x_post_hour_vn" defaultValue={s.x_post_hour_vn} className={select}>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>{`${String(h).padStart(2, "0")}:05`}</option>
            ))}
          </select>
        </label>
        <p className="text-sm">
          {t.keys}: <span className={configured ? "text-safe" : "text-caution"}>{configured ? t.keysOk : t.keysMissing}</span>
        </p>
        <button className="h-9 w-fit rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:opacity-90">{t.save}</button>
      </form>

      <section>
        <h2 className="mb-2 text-sm font-medium">{t.history}</h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr className="border-b border-line">
                {t.cols.map((c) => (
                  <th key={c} className="px-3 py-2.5 font-medium">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-soft/60">
                  <td className="whitespace-nowrap px-3 py-2">{fmtDate(`${p.day}T12:00:00+07:00`, lang)}</td>
                  <td className="px-3 py-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", TONE[p.status])}>{t.status[p.status]}</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{p.highlight ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    {p.post_url ? (
                      <a href={p.post_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                        {p.posted_at ? fmtDateTime(p.posted_at, lang) : p.post_url}
                      </a>
                    ) : (
                      <span className="text-muted">{p.error?.slice(0, 120) ?? "—"}</span>
                    )}
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
