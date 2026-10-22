import Image from "next/image";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { db, type SocialPost } from "@/lib/engine/db";
import { CARD_STYLES, CARD_THEMES, MAX_SLOTS, socialSettings } from "@/lib/engine/settings";
import type { Locale } from "@/lib/i18n";
import { RUN_PRESETS } from "@/lib/social/applied";
import { loadResources, vnDay } from "@/lib/social/compose";
import { engagementRate } from "@/lib/social/metrics";
import { lastTwoPeriods } from "@/lib/social/review";
import { xConfigured } from "@/lib/social/x";
import { anonClient } from "@/lib/supabase/anon";
import { fmtDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { draftToday, refreshSocialMetrics, reviewSocialNow, saveSocialSettings } from "../actions";
import { ActionButton } from "./action-button";
import { AppliedForm, type AppliedCopy } from "./applied-form";
import { CardControls, type CardCopy } from "./card-controls";
import { PostEditor, type EditorCopy } from "./editor";
import { XCheck, type XCheckCopy } from "./x-check";

const T = {
  en: {
    title: "X posts",
    intro:
      "Each day the engine drafts one spotlight (one resource, its author tagged, the link in the first reply) for each posting hour below. Add applied posts, how you used a resource in a real project, with the form further down. A post that tags someone goes out with the tag only once you approve it; without approval an automatic spotlight goes out without the @. Numbers are read from X every few hours and reviewed every three days.",
    queue: "Queue",
    queueEmpty: "Nothing waiting. The day's spotlights are drafted after the engine run, or now:",
    draftToday: "Draft today's spotlights",
    drafted: "Drafted.",
    kind: { picks: "Today's picks", spotlight: "Spotlight", applied: "Applied" } as Record<string, string>,
    at: "at",
    status: { draft: "draft", approved: "approved", posting: "posting", posted: "posted", skipped: "skipped", failed: "failed" } as Record<string, string>,
    performance: "Performance",
    perfIntro: "Views and engagement of the posts that went out. Engagement = likes, reposts, replies, quotes and bookmarks per view.",
    refresh: "Read the numbers now",
    refreshed: "Updated",
    last3: "Last 3 days",
    prev3: "3 days before",
    medianViews: "median views",
    medianEr: "median engagement",
    cols: ["Posted", "Kind", "Post", "Views", "Likes", "Reposts", "Replies", "Saves", "Link clicks", "Profile", "Eng."],
    reviews: "Three-day reviews",
    reviewsIntro: "Every three days Sonnet reads the numbers and the posts, writes what worked, and rewrites the writing guidance the next drafts follow (editable in Settings).",
    reviewNow: "Review now",
    reviewed: "Reviewed.",
    noReviews: "No review yet: the first one runs at the next hourly check.",
    guidanceUsed: "Guidance it set",
    settings: "Settings",
    enabled: "Post on X",
    auto: "Post spotlight drafts automatically at their hour, without @mentions, when nobody approved them",
    slots: "Spotlight hours (Vietnam, :30)",
    slotOff: "off",
    guidance: "Writing guidance (the last review sets it; your edits stay until the next review)",
    save: "Save settings",
    keys: "X API keys",
    keysOk: "set on this deployment",
    keysMissing: "missing on this deployment: posting is off here",
    defaultStyle: "Card style for new spotlights",
    defaultTheme: "Card colours",
    editor: {
      post: "Post",
      reply: "First reply",
      replyHint: "the link goes here, so the post itself is not held back for having one",
      save: "Save text",
      saved: "Done.",
      approve: "Approve",
      approveHint: "Goes out at its hour as written, @mentions included",
      unapprove: "Back to draft",
      postNow: "Post now",
      posted: "Posted:",
      skip: "Skip",
      rewrite: "Write again",
      rewriteOther: "or another resource's slug",
      time: "Goes out at",
      tags: "Tags",
      tagsAuto: "Approve to keep the tag; if it goes out on its own, the @ is dropped.",
      markPosted: "It is on X",
      markFailed: "It is not on X",
      stuck: "This post was being sent when something stopped. Check the account on X, then mark it.",
      confirmPost: "Post this to X now, as written?",
      chars: "characters (X count)",
      fits: "shows in full, no Show more",
      notConfigured: "X API keys are not set on this deployment",
    } satisfies EditorCopy,
    check: {
      test: "Test X connection",
      ok: "Connected as",
      fail: "Failed:",
      hint401:
        "401 = X does not accept these keys. In the X developer app, check that all four come from the same app; if you regenerated any key or token after adding it to Vercel, the old one no longer works: copy the new values into Vercel (no spaces), then redeploy.",
      hint403: "403 = the keys work but cannot write: set the app to Read and write, regenerate the Access Token and Secret, update Vercel, redeploy.",
    } satisfies XCheckCopy,
    card: {
      style: "Style",
      styles: { editorial: "Editorial", spotlight: "Spotlight", list: "List" },
      theme: "Colours",
      themes: { light: "Light", dark: "Dark" },
      headline: "Card headline",
      headlineHint: "best under 48",
      save: "Save card",
      working: "Rendering…",
      saved: "Card updated.",
    } satisfies CardCopy,
    applied: {
      title: "New applied post",
      intro:
        "How you used a resource in a real project: the problem, what you did, what changed. Write the notes in Vietnamese or English; Sonnet turns them into a first-person post in English, which waits in the queue for your approval.",
      preset: "Start from a run Airsc already did on its own code",
      presetNone: "None, my own notes",
      resource: "Resource",
      resourceHint: "slug, as in /r/<slug>",
      project: "Project",
      projectHint: "default Airsc",
      notes: "Notes",
      notesHint: "the problem, what you did, the result, your takeaway",
      images: "Screenshots",
      imagesHint: "up to 4: the diagram, the before and after, the output",
      day: "Day",
      hour: "Goes out at",
      submit: "Write the draft",
      working: "Sonnet is writing…",
      done: "Draft added to the queue.",
    } satisfies AppliedCopy,
  },
  vi: {
    title: "Bài đăng X",
    intro:
      "Mỗi ngày engine viết nháp một bài spotlight (một tài nguyên, tag tác giả, link nằm ở reply đầu tiên) cho mỗi giờ đăng bên dưới. Bài applied, tức cách bạn dùng một tài nguyên trong dự án thật, thì tạo bằng form phía dưới. Bài có tag ai đó chỉ giữ tag khi bạn duyệt; nếu không ai duyệt, spotlight tự đăng sẽ bỏ dấu @. Số liệu được đọc từ X vài giờ một lần và được đánh giá mỗi ba ngày.",
    queue: "Hàng đợi",
    queueEmpty: "Chưa có bài nào chờ. Spotlight trong ngày được viết sau lần chạy engine, hoặc viết ngay:",
    draftToday: "Viết nháp spotlight hôm nay",
    drafted: "Đã viết.",
    kind: { picks: "Chọn lọc hôm nay", spotlight: "Spotlight", applied: "Applied" } as Record<string, string>,
    at: "lúc",
    status: { draft: "bản nháp", approved: "đã duyệt", posting: "đang đăng", posted: "đã đăng", skipped: "bỏ qua", failed: "lỗi" } as Record<string, string>,
    performance: "Hiệu quả",
    perfIntro: "Lượt xem và tương tác của các bài đã đăng. Tương tác = like, repost, reply, quote và bookmark trên mỗi lượt xem.",
    refresh: "Đọc số liệu ngay",
    refreshed: "Đã cập nhật",
    last3: "3 ngày gần nhất",
    prev3: "3 ngày trước đó",
    medianViews: "trung vị lượt xem",
    medianEr: "trung vị tương tác",
    cols: ["Đăng lúc", "Loại", "Bài", "Xem", "Like", "Repost", "Reply", "Lưu", "Bấm link", "Hồ sơ", "Tương tác"],
    reviews: "Đánh giá ba ngày",
    reviewsIntro: "Mỗi ba ngày Sonnet đọc số liệu và nội dung bài, viết ra điều gì hiệu quả, rồi viết lại hướng dẫn viết mà các bản nháp sau sẽ theo (sửa được ở Thiết lập).",
    reviewNow: "Đánh giá ngay",
    reviewed: "Đã đánh giá.",
    noReviews: "Chưa có đánh giá: lần đầu chạy ở lượt kiểm tra hằng giờ tiếp theo.",
    guidanceUsed: "Hướng dẫn được đặt",
    settings: "Thiết lập",
    enabled: "Đăng lên X",
    auto: "Tự đăng spotlight nháp đúng giờ, bỏ @mention, khi không ai duyệt",
    slots: "Giờ đăng spotlight (giờ VN, phút 30)",
    slotOff: "tắt",
    guidance: "Hướng dẫn viết (lần đánh giá gần nhất đặt; bạn sửa thì giữ đến lần đánh giá sau)",
    save: "Lưu thiết lập",
    keys: "Khóa X API",
    keysOk: "đã có trên bản triển khai này",
    keysMissing: "chưa có trên bản triển khai này: không thể đăng từ đây",
    defaultStyle: "Style ảnh cho spotlight mới",
    defaultTheme: "Tông màu ảnh",
    editor: {
      post: "Bài đăng",
      reply: "Reply đầu tiên",
      replyHint: "link để ở đây, để bài chính không bị giảm tiếp cận vì có link",
      save: "Lưu nội dung",
      saved: "Xong.",
      approve: "Duyệt",
      approveHint: "Đăng đúng giờ, giữ nguyên nội dung và @mention",
      unapprove: "Về bản nháp",
      postNow: "Đăng ngay",
      posted: "Đã đăng:",
      skip: "Bỏ qua",
      rewrite: "Viết lại",
      rewriteOther: "hoặc slug của tài nguyên khác",
      time: "Đăng lúc",
      tags: "Tag",
      tagsAuto: "Duyệt để giữ tag; nếu bài tự đăng, dấu @ sẽ bị bỏ.",
      markPosted: "Đã lên X",
      markFailed: "Chưa lên X",
      stuck: "Bài này bị dừng giữa lúc đang gửi. Hãy kiểm tra tài khoản X rồi đánh dấu.",
      confirmPost: "Đăng bài này lên X ngay, đúng như đang viết?",
      chars: "ký tự (theo cách X đếm)",
      fits: "hiện đủ, không bị Show more",
      notConfigured: "Bản triển khai này chưa có khóa X API",
    } satisfies EditorCopy,
    check: {
      test: "Kiểm tra kết nối X",
      ok: "Đã kết nối với",
      fail: "Lỗi:",
      hint401:
        "401 = X không chấp nhận bộ khóa này. Trong app trên X developer, kiểm tra cả 4 khóa cùng một app; nếu bạn đã tạo lại (regenerate) khóa hoặc token sau khi thêm vào Vercel thì khóa cũ hết hiệu lực: chép giá trị mới vào Vercel (không có dấu cách), rồi redeploy.",
      hint403: "403 = khóa đúng nhưng không có quyền ghi: đặt app là Read and write, tạo lại Access Token và Secret, cập nhật Vercel, redeploy.",
    } satisfies XCheckCopy,
    card: {
      style: "Style",
      styles: { editorial: "Biên tập", spotlight: "Tràn viền", list: "Danh sách" },
      theme: "Tông màu",
      themes: { light: "Sáng", dark: "Tối" },
      headline: "Headline trên ảnh",
      headlineHint: "nên dưới 48",
      save: "Lưu ảnh",
      working: "Đang vẽ…",
      saved: "Đã cập nhật ảnh.",
    } satisfies CardCopy,
    applied: {
      title: "Bài applied mới",
      intro:
        "Cách bạn dùng một tài nguyên trong dự án thật: vấn đề, bạn đã làm gì, kết quả thay đổi ra sao. Ghi chú bằng tiếng Việt hay tiếng Anh đều được; Sonnet viết thành bài tiếng Anh ở ngôi thứ nhất, rồi bài nằm trong hàng đợi chờ bạn duyệt.",
      preset: "Bắt đầu từ một lần Airsc đã chạy trên chính code của mình",
      presetNone: "Không, ghi chú của tôi",
      resource: "Tài nguyên",
      resourceHint: "slug, như trong /r/<slug>",
      project: "Dự án",
      projectHint: "mặc định Airsc",
      notes: "Ghi chú",
      notesHint: "vấn đề, bạn đã làm gì, kết quả, bài học",
      images: "Ảnh chụp",
      imagesHint: "tối đa 4: sơ đồ, trước và sau, kết quả",
      day: "Ngày",
      hour: "Đăng lúc",
      submit: "Viết bản nháp",
      working: "Sonnet đang viết…",
      done: "Đã thêm bản nháp vào hàng đợi.",
    } satisfies AppliedCopy,
  },
};

const TONE: Record<string, string> = {
  posted: "bg-safe-soft text-safe",
  failed: "bg-danger-soft text-danger",
  posting: "bg-caution-soft text-caution",
  approved: "bg-safe-soft text-safe",
  draft: "bg-accent-soft text-accent",
  skipped: "bg-soft text-muted",
};

const num = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US"));
const firstLine = (t: string) => t.split("\n").find((l) => l.trim()) ?? "";

export default async function AdminSocial({ params }: PageProps<"/[lang]/admin/social">) {
  const { lang } = (await params) as { lang: Locale };
  const t = T[lang];
  const today = vnDay();
  const [settings, posts, reviews, resources, presetRows] = await Promise.all([
    db.settings(),
    db.socialPosts(200),
    db.socialReviews(3),
    anonClient()
      .from("resources")
      .select("slug,name")
      .order("stars", { ascending: false })
      .limit(600)
      .then((r) => (r.data ?? []) as { slug: string; name: string }[]),
    loadResources(RUN_PRESETS.map((p) => p.slug)),
  ]);
  const s = socialSettings(settings);
  const configured = xConfigured();

  const queue = posts
    .filter((p) => p.day >= today && p.channel === "x" && (p.status !== "posted" || p.day === today))
    .sort((a, b) => (a.scheduled_at ?? a.created_at).localeCompare(b.scheduled_at ?? b.created_at));
  const sent = posts.filter((p) => p.status === "posted" && p.posted_at).sort((a, b) => b.posted_at!.localeCompare(a.posted_at!));
  const { last: last3, previous: prev3 } = lastTwoPeriods(sent);
  const presets = RUN_PRESETS.flatMap((p) => {
    const r = presetRows.find((x) => x.slug === p.slug);
    return r ? [{ ...p, name: r.name }] : [];
  });
  const select = "h-8 rounded-lg border border-line bg-bg px-2 text-sm";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{t.intro}</p>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-medium">{t.queue}</h2>
          <ActionButton action={draftToday} label={t.draftToday} done={t.drafted} />
        </div>
        {!queue.length && <p className="text-sm text-muted">{t.queueEmpty}</p>}
        {queue.map((p) => (
          <QueueItem key={p.id} post={p} lang={lang} configured={configured} defaults={{ style: s.x_card_style, theme: s.x_card_theme }} t={t} />
        ))}
      </section>

      <AppliedForm presets={presets} resources={resources} today={today} c={t.applied} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-medium">{t.performance}</h2>
          <ActionButton action={refreshSocialMetrics} label={t.refresh} done={t.refreshed} />
        </div>
        <p className="max-w-3xl text-sm text-muted">{t.perfIntro}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: t.last3, v: last3 },
            { label: t.prev3, v: prev3 },
          ].map(({ label, v }) => (
            <div key={label} className="rounded-2xl border border-line bg-card p-4">
              <p className="text-xs text-muted">
                {label} · {v.posts} posts
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {num(v.median_views)} <span className="text-sm font-normal text-muted">{t.medianViews}</span>
              </p>
              <p className="text-sm tabular-nums text-muted">
                {v.median_engagement_pct === null ? "—" : `${v.median_engagement_pct}%`} {t.medianEr} · {v.likes} likes · {v.reposts} reposts · {v.link_clicks} link clicks
              </p>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr className="border-b border-line">
                {t.cols.map((c, i) => (
                  <th key={c} className={cn("px-3 py-2.5 font-medium", i > 2 && "text-right")}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sent.slice(0, 40).map((p) => {
                const er = engagementRate(p);
                return (
                  <tr key={p.id} className="hover:bg-soft/60">
                    <td className="whitespace-nowrap px-3 py-2 text-xs">
                      <a href={p.post_url ?? "#"} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                        {fmtDateTime(p.posted_at!, lang)}
                      </a>
                    </td>
                    <td className="px-3 py-2 text-xs">{t.kind[p.kind]}</td>
                    <td className="max-w-[340px] truncate px-3 py-2 text-xs" title={p.text}>
                      {firstLine(p.text)}
                    </td>
                    {[p.impressions, p.likes, p.reposts, p.replies, p.bookmarks, p.link_clicks, p.profile_clicks].map((v, i) => (
                      <td key={i} className="px-3 py-2 text-right tabular-nums">
                        {num(v)}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right tabular-nums">{er === null ? "—" : `${er.toFixed(1)}%`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-medium">{t.reviews}</h2>
          <ActionButton action={reviewSocialNow} label={t.reviewNow} done={t.reviewed} />
        </div>
        <p className="max-w-3xl text-sm text-muted">{t.reviewsIntro}</p>
        {!reviews.length && <p className="text-sm text-muted">{t.noReviews}</p>}
        {reviews.map((r) => (
          <article key={r.id} className="rounded-2xl border border-line bg-card p-4">
            <p className="text-xs text-muted">
              {fmtDateTime(r.period_start, lang)} → {fmtDateTime(r.period_end, lang)} · {r.model}
            </p>
            <div className="prose-readme mt-2 text-sm">
              <Markdown remarkPlugins={[remarkGfm]} skipHtml>
                {r.summary}
              </Markdown>
            </div>
            {r.guidance && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-muted">{t.guidanceUsed}</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-soft p-3 font-mono text-xs">{r.guidance}</pre>
              </details>
            )}
          </article>
        ))}
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
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {t.slots}
          {Array.from({ length: MAX_SLOTS }, (_, i) => (
            <select key={i} name="x_slot" defaultValue={s.x_slots_vn[i] ?? ""} className={select}>
              <option value="">{t.slotOff}</option>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{`${String(h).padStart(2, "0")}:30`}</option>
              ))}
            </select>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-sm">
          {t.guidance}
          <textarea
            name="x_guidance"
            defaultValue={s.x_guidance}
            rows={6}
            className="w-full rounded-xl border border-line bg-bg p-3 font-mono text-xs leading-relaxed outline-none focus:border-accent"
          />
        </label>
        <label className="flex items-center gap-3 text-sm">
          {t.defaultStyle}
          <select name="x_card_style" defaultValue={s.x_card_style} className={select}>
            {CARD_STYLES.map((k) => (
              <option key={k} value={k}>
                {t.card.styles[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-3 text-sm">
          {t.defaultTheme}
          <select name="x_card_theme" defaultValue={s.x_card_theme} className={select}>
            {CARD_THEMES.map((k) => (
              <option key={k} value={k}>
                {t.card.themes[k]}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm">
          {t.keys}: <span className={configured ? "text-safe" : "text-caution"}>{configured ? t.keysOk : t.keysMissing}</span>
        </p>
        {configured && <XCheck c={t.check} />}
        <button className="h-9 w-fit rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:opacity-90">{t.save}</button>
      </form>
    </div>
  );
}

function QueueItem({
  post,
  lang,
  configured,
  defaults,
  t,
}: {
  post: SocialPost;
  lang: Locale;
  configured: boolean;
  defaults: Parameters<typeof CardControls>[0]["defaults"];
  t: (typeof T)["en"];
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{t.kind[post.kind]}</span>
        {post.highlight && <span className="font-mono text-xs text-muted">{post.highlight}</span>}
        {post.scheduled_at && (
          <span className="text-muted">
            · {t.at} {fmtDateTime(post.scheduled_at, lang)}
          </span>
        )}
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", TONE[post.status])}>{t.status[post.status]}</span>
        {post.post_url && (
          <a href={post.post_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
            {post.post_url}
          </a>
        )}
      </div>
      {post.error && <p className="mb-3 rounded-lg bg-danger-soft p-2 font-mono text-xs text-danger">{post.error}</p>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <PostEditor key={post.updated_at} post={post} configured={configured} c={t.editor} />
        {post.kind === "applied" ? (
          <div className="flex flex-wrap content-start gap-2">
            {post.images.map((u) => (
              <a key={u} href={u} target="_blank" rel="noreferrer">
                <Image src={u} alt={post.image_alt ?? ""} width={320} height={200} unoptimized className="h-40 w-auto rounded-lg border border-line" />
              </a>
            ))}
            {post.note && <p className="w-full whitespace-pre-wrap text-xs text-muted">{post.note}</p>}
          </div>
        ) : (
          <CardControls key={post.updated_at} post={post} defaults={defaults} c={t.card} />
        )}
      </div>
    </div>
  );
}
