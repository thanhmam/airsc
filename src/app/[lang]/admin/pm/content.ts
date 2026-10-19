import type { Locale } from "@/lib/i18n";

/**
 * Product Management pages in /admin/pm. Roadmap, changelog and feature list are kept by hand from the
 * merged PRs and the source; update them in the PR that changes the product.
 */
export type L = { en: string; vi: string };
export const tr = (s: L, lang: Locale) => s[lang];

const en = {
  section: "Product Management",
  tabs: { architecture: "Architecture", stack: "Tech stack", roadmap: "Roadmap", changelog: "Changelog", features: "Features", picks: "Today's picks history" },
  architecture: {
    intro: "Diagrams traced from the source with Archify. Every box links to the file and lines it comes from.",
    traced: "Traced from commit",
    open: "Open full screen",
    titles: { architecture: "System architecture", "content-engine": "Content Engine run", "x-daily-post": "Today's picks to X" } as Record<string, string>,
    descs: {
      architecture: "Request paths, the MCP server, webhooks, crons, the Content Engine and the services they call.",
      "content-engine": "One daily run: discover, curate, build content, then choose the picks and draft the X post.",
      "x-daily-post": "How the picks become a draft, and how the hourly cron claims it, renders the card and posts it.",
    } as Record<string, string>,
  },
  stack: {
    intro: "Versions are read from package.json at build time; conventions come from AGENTS.md, BRAND.md and README.md.",
    conventions: "Project conventions",
    version: "version",
    unused: "in package.json, not used in src",
  },
  roadmap: {
    intro: "The original goals, what shipped, and what is next. Dates are Vietnam time.",
    goals: "Original goals",
    phases: "Phases",
    requests: "Change requests",
    status: { done: "Done", doing: "In progress", next: "Next", idea: "Idea" },
  },
  changelog: { intro: "Merged changes to production, newest first.", direct: "direct to main", open: "open PR" },
  features: { intro: "What the product does today, grouped by area, with the code that implements it.", status: { live: "Live", partial: "Partial", planned: "Planned" } },
  picks: {
    intro: "The four resources the Content Engine chose for the homepage each Vietnam day, and the X post about them.",
    cols: ["Day", "Picks", "X post"],
    card: "Card",
    none: "No picks yet.",
    featured: "on the card",
    status: { draft: "draft", posting: "posting", posted: "posted", skipped: "skipped", failed: "failed" } as Record<string, string>,
    days: "days",
    missing: "removed or hidden",
  },
};

export type PmCopy = typeof en;

const vi: PmCopy = {
  section: "Quản lý sản phẩm",
  tabs: { architecture: "Kiến trúc", stack: "Tech stack", roadmap: "Lộ trình", changelog: "Nhật ký thay đổi", features: "Tính năng", picks: "Lịch sử Chọn lọc hôm nay" },
  architecture: {
    intro: "Sơ đồ vẽ từ source bằng Archify. Mỗi khối có link tới file và dòng code tương ứng.",
    traced: "Vẽ từ commit",
    open: "Mở toàn màn hình",
    titles: { architecture: "Kiến trúc hệ thống", "content-engine": "Một lần chạy Content Engine", "x-daily-post": "Chọn lọc hôm nay lên X" },
    descs: {
      architecture: "Đường đi của request, MCP server, webhook, cron, Content Engine và các dịch vụ được gọi.",
      "content-engine": "Một lần chạy mỗi ngày: tìm, phân loại, làm nội dung, rồi chọn Chọn lọc hôm nay và viết nháp bài X.",
      "x-daily-post": "Cách Chọn lọc hôm nay thành bản nháp, và cách cron hằng giờ nhận bài, vẽ card và đăng lên X.",
    },
  },
  stack: {
    intro: "Phiên bản đọc từ package.json lúc build; quy ước lấy từ AGENTS.md, BRAND.md và README.md.",
    conventions: "Quy ước dự án",
    version: "phiên bản",
    unused: "có trong package.json, chưa dùng trong src",
  },
  roadmap: {
    intro: "Mục tiêu ban đầu, những gì đã ra mắt và việc tiếp theo. Ngày theo giờ Việt Nam.",
    goals: "Mục tiêu ban đầu",
    phases: "Các giai đoạn",
    requests: "Các lần cập nhật yêu cầu",
    status: { done: "Xong", doing: "Đang làm", next: "Tiếp theo", idea: "Ý tưởng" },
  },
  changelog: { intro: "Các thay đổi đã lên production, mới nhất trước.", direct: "commit thẳng vào main", open: "PR đang mở" },
  features: { intro: "Sản phẩm đang làm được gì, theo từng mảng, kèm code thực hiện.", status: { live: "Đang chạy", partial: "Một phần", planned: "Dự kiến" } },
  picks: {
    intro: "Bốn tài nguyên Content Engine chọn cho trang chủ mỗi ngày (giờ VN), và bài X về chúng.",
    cols: ["Ngày", "Chọn lọc", "Bài X"],
    card: "Card",
    none: "Chưa có Chọn lọc nào.",
    featured: "trên card",
    status: { draft: "nháp", posting: "đang đăng", posted: "đã đăng", skipped: "bỏ qua", failed: "lỗi" },
    days: "ngày",
    missing: "đã gỡ hoặc ẩn",
  },
};

export const pmCopy = (lang: Locale) => (lang === "vi" ? vi : en);

// ---------------------------------------------------------------- tech stack

export type StackItem = { name: string; pkg?: string; role: L; unused?: boolean };
export type StackGroup = { title: L; items: StackItem[] };

export const STACK: StackGroup[] = [
  {
    title: { en: "App", vi: "Ứng dụng" },
    items: [
      { name: "Next.js (App Router)", pkg: "next", role: { en: "Pages, route handlers, server actions; EN at /, VI at /vi via src/proxy.ts", vi: "Trang, route handler, server action; EN ở /, VI ở /vi qua src/proxy.ts" } },
      { name: "React", pkg: "react", role: { en: "UI, server components by default", vi: "Giao diện, mặc định là server component" } },
      { name: "TypeScript", pkg: "typescript", role: { en: "Whole codebase", vi: "Toàn bộ code" } },
      { name: "Zod", pkg: "zod", role: { en: "Schemas for AI output and inputs", vi: "Schema cho kết quả AI và dữ liệu vào" } },
    ],
  },
  {
    title: { en: "UI and brand", vi: "Giao diện và thương hiệu" },
    items: [
      { name: "Tailwind CSS", pkg: "tailwindcss", role: { en: "Styling with the tokens in src/app/globals.css (light and dark)", vi: "Style bằng token trong src/app/globals.css (sáng và tối)" } },
      { name: "Geist / Geist Mono", role: { en: "The only typefaces; headings font-semibold (BRAND.md)", vi: "Font duy nhất; tiêu đề font-semibold (BRAND.md)" } },
      { name: "lucide-react", pkg: "lucide-react", role: { en: "Icons", vi: "Icon" } },
      { name: "Motion", pkg: "motion", role: { en: "Homepage animation", vi: "Hiệu ứng trang chủ" } },
      { name: "react-markdown + remark-gfm", pkg: "react-markdown", role: { en: "Guides and README excerpts", vi: "Bài hướng dẫn và trích README" } },
      { name: "Remotion Player", pkg: "@remotion/player", role: { en: "Slideshow of real results on resource pages", vi: "Slideshow kết quả thật trên trang tài nguyên" } },
    ],
  },
  {
    title: { en: "Data and auth", vi: "Dữ liệu và đăng nhập" },
    items: [
      { name: "Supabase Postgres", pkg: "@supabase/supabase-js", role: { en: "Resources, kits, guides, picks, social posts; RLS for public reads, token-guarded RPCs for writes", vi: "Tài nguyên, kit, hướng dẫn, chọn lọc, bài đăng; RLS cho đọc công khai, RPC có token cho ghi" } },
      { name: "Supabase Auth (@supabase/ssr)", pkg: "@supabase/ssr", role: { en: "Magic link, Google and GitHub sign-in; session refreshed in proxy.ts", vi: "Đăng nhập magic link, Google, GitHub; làm mới phiên trong proxy.ts" } },
    ],
  },
  {
    title: { en: "AI and automation", vi: "AI và tự động hóa" },
    items: [
      { name: "AI SDK + Vercel AI Gateway", pkg: "ai", role: { en: "All model calls; Sonnet 5.5 / Opus 5.5 with a Gemini fallback, cost per call, balance check", vi: "Mọi lần gọi model; Sonnet 5.5 / Opus 5.5, dự phòng Gemini, ghi chi phí, kiểm tra số dư" } },
      { name: "Vercel Workflow", pkg: "workflow", role: { en: "The Content Engine as a durable, checkpointed run", vi: "Content Engine chạy bền vững, có checkpoint" } },
      { name: "Vercel Sandbox", pkg: "@vercel/sandbox", role: { en: "Demo agent boots MCP servers and records their tools", vi: "Agent Demo khởi động MCP server và ghi lại danh sách tool" } },
      { name: "Vercel Blob", pkg: "@vercel/blob", role: { en: "Preview images copied from READMEs", vi: "Ảnh xem trước chép từ README" } },
      { name: "Vercel Cron", role: { en: "Hourly /api/cron/pipeline and /api/cron/social (vercel.ts)", vi: "/api/cron/pipeline và /api/cron/social mỗi giờ (vercel.ts)" } },
    ],
  },
  {
    title: { en: "Integrations", vi: "Tích hợp" },
    items: [
      { name: "MCP (mcp-handler)", pkg: "mcp-handler", role: { en: "Airsc MCP server at /api/mcp: 5 tools, Streamable HTTP, CORS", vi: "MCP server của Airsc ở /api/mcp: 5 tool, Streamable HTTP, CORS" } },
      { name: "X API v2", role: { en: "Daily post with card (OAuth 1.0a, src/lib/social/x.ts)", vi: "Bài đăng hằng ngày kèm card (OAuth 1.0a, src/lib/social/x.ts)" } },
      { name: "next/og + sharp", pkg: "sharp", role: { en: "Renders the X card PNG", vi: "Vẽ ảnh card PNG cho X" } },
      { name: "Ko-fi webhook", role: { en: "Donations and the supporters list", vi: "Ủng hộ và danh sách người ủng hộ" } },
      { name: "Polar.sh", pkg: "@polar-sh/sdk", role: { en: "Pro membership: checkout, billing portal and the customer.state_changed webhook", vi: "Gói Pro: thanh toán, cổng quản lý và webhook customer.state_changed" } },
    ],
  },
  {
    title: { en: "Hosting", vi: "Hạ tầng" },
    items: [
      { name: "Vercel (sin1)", role: { en: "Production on push to main, previews per branch", vi: "Production khi push lên main, preview cho từng nhánh" } },
      { name: "pnpm", role: { en: "Package manager", vi: "Trình quản lý package" } },
    ],
  },
];

export const CONVENTIONS: L[] = [
  { en: "Logo only through <Logo /> and the files in public/brand; never redrawn with text or CSS", vi: "Logo chỉ dùng <Logo /> và file trong public/brand; không vẽ lại bằng chữ hay CSS" },
  { en: "Colours through tokens (bg-accent, text-muted, border-line…), raw hex only for always-dark panels", vi: "Màu dùng token (bg-accent, text-muted, border-line…), mã hex chỉ cho panel luôn tối" },
  { en: "Violet #5A3DF0, Violet 400 #8F7BFF, Ink #111113, Paper #FAFAF7", vi: "Violet #5A3DF0, Violet 400 #8F7BFF, Ink #111113, Paper #FAFAF7" },
  { en: "Every user-facing string in English and Vietnamese", vi: "Mọi chuỗi hiển thị đều có tiếng Anh và tiếng Việt" },
  { en: "Work on a branch and check the Vercel preview; merging to main deploys production", vi: "Làm trên nhánh và kiểm tra preview Vercel; merge vào main là deploy production" },
  { en: "Admin times in Vietnam time; X keys set for Production only", vi: "Giờ trong admin theo giờ Việt Nam; khóa X chỉ đặt cho Production" },
];

// ---------------------------------------------------------------- roadmap

export type Status = "done" | "doing" | "next" | "idea";

export const GOALS: L[] = [
  { en: "A safety-checked library of AI agent resources for vibe coders: Claude skills, MCP servers, Claude Code plugins, subagents, Cursor rules", vi: "Thư viện tài nguyên AI agent đã kiểm tra an toàn cho vibe coder: Claude skill, MCP server, plugin Claude Code, subagent, Cursor rule" },
  { en: "Content that runs itself: find, check, classify and explain resources in English and Vietnamese every day", vi: "Nội dung tự vận hành: mỗi ngày tự tìm, kiểm tra, phân loại và giải thích tài nguyên bằng tiếng Anh và tiếng Việt" },
  { en: "Agents can use the library directly through an MCP server", vi: "Agent dùng thư viện trực tiếp qua MCP server" },
  { en: "Sustainable at low cost: started as credits (10 free a week, packs, Full-time Access), changed at launch to free with donations", vi: "Bền vững với chi phí thấp: ban đầu là credit (10 lượt miễn phí/tuần, gói, Full-time Access), khi ra mắt đổi sang miễn phí kèm ủng hộ" },
];

export type Phase = { title: L; when: string; status: Status; items: L[] };

export const PHASES: Phase[] = [
  {
    title: { en: "MVP", vi: "MVP" },
    when: "2026-10-07",
    status: "done",
    items: [
      { en: "Catalog with safety scan, one-click install, kits and guides", vi: "Thư viện có quét an toàn, cài một chạm, kit và hướng dẫn" },
      { en: "Content Engine: Scout, Analyst, Curator, Producer, Demo, Editor with a budget brake", vi: "Content Engine: Scout, Analyst, Curator, Producer, Demo, Editor, có phanh ngân sách" },
      { en: "Airsc MCP server, admin console, EN/VI, free model with Ko-fi", vi: "MCP server Airsc, trang admin, EN/VI, mô hình miễn phí với Ko-fi" },
    ],
  },
  {
    title: { en: "Brand and homepage", vi: "Thương hiệu và trang chủ" },
    when: "2026-10-08",
    status: "done",
    items: [
      { en: "Search-first homepage with the Today's picks stage and illustrated kits", vi: "Trang chủ ưu tiên tìm kiếm, sân khấu Chọn lọc hôm nay và kit minh họa" },
      { en: "Logo kit and BRAND.md; pinned donate bar and supporters list", vi: "Bộ logo và BRAND.md; thanh ủng hộ ghim và danh sách người ủng hộ" },
    ],
  },
  {
    title: { en: "Real results", vi: "Kết quả thật" },
    when: "2026-10-09",
    status: "done",
    items: [
      { en: "Previewer agent: the author's own README images, stored in Blob", vi: "Agent Previewer: ảnh README của chính tác giả, lưu trên Blob" },
      { en: "Slideshow of real results replaces the animated explainer", vi: "Slideshow kết quả thật thay cho video giải thích" },
    ],
  },
  {
    title: { en: "Daily content and distribution", vi: "Nội dung hằng ngày và phân phối" },
    when: "2026-10-14 → 2026-10-15",
    status: "done",
    items: [
      { en: "Today's picks chosen daily by the Content Engine", vi: "Content Engine chọn Chọn lọc hôm nay mỗi ngày" },
      { en: "Daily X post with a card: three styles, light and dark, Sonnet headline, connection test", vi: "Bài X hằng ngày kèm card: ba style, sáng/tối, tiêu đề do Sonnet viết, nút kiểm tra kết nối" },
      { en: "Multi-word search, MCP CORS for browser clients, xAI marketplace submission text", vi: "Tìm kiếm nhiều từ, CORS cho MCP chạy trên trình duyệt, nội dung nộp lên marketplace của xAI" },
    ],
  },
  {
    title: { en: "Operations", vi: "Vận hành" },
    when: "2026-10-16",
    status: "doing",
    items: [
      { en: "Engine at 8:00 and X post at 8:30 Vietnam time (PR #9)", vi: "Engine lúc 8:00 và đăng X lúc 8:30 giờ VN (PR #9)" },
      { en: "Product Management in admin: architecture, stack, roadmap, changelog, features, picks history", vi: "Quản lý sản phẩm trong admin: kiến trúc, stack, lộ trình, changelog, tính năng, lịch sử chọn lọc" },
    ],
  },
  {
    title: { en: "Next", vi: "Tiếp theo" },
    when: "",
    status: "next",
    items: [
      { en: "30-second vertical short (Remotion, 3 hooks × EN/VI): ready on branch feat/airsc-short-video", vi: "Video dọc 30 giây (Remotion, 3 hook × EN/VI): đã có trên nhánh feat/airsc-short-video" },
      { en: "Listing on the xAI marketplace (Grok Bot, Cursor) from docs/marketplaces/xai-grok.md", vi: "Lên marketplace của xAI (Grok Bot, Cursor) theo docs/marketplaces/xai-grok.md" },
      { en: "Bring README up to date: no Polar checkout or credits, engine hour is a setting", vi: "Cập nhật README: không còn Polar checkout hay credit, giờ chạy engine là một thiết lập" },
    ],
  },
  {
    title: { en: "Ideas", vi: "Ý tưởng" },
    when: "",
    status: "idea",
    items: [
      { en: "Schedule or remove /api/cron/crawl (exists, not in vercel.ts)", vi: "Lên lịch hoặc gỡ /api/cron/crawl (có route, chưa có trong vercel.ts)" },
    ],
  },
];

export type Request = { when: string; text: L; ref?: string };

/** What was asked, in order: the requests behind each change */
export const REQUESTS: Request[] = [
  { when: "2026-10-07", ref: "#1", text: { en: "Launch free: show the GitHub source directly, take Ko-fi donations instead of payments", vi: "Ra mắt miễn phí: hiện thẳng source GitHub, nhận ủng hộ Ko-fi thay cho thanh toán" } },
  { when: "2026-10-08", text: { en: "Pin the donate bar and list supporters with masked emails", vi: "Ghim thanh ủng hộ và hiện danh sách người ủng hộ với email đã che" } },
  { when: "2026-10-08", text: { en: "Redesign the homepage around search and Today's picks; adopt the logo kit", vi: "Thiết kế lại trang chủ quanh tìm kiếm và Chọn lọc hôm nay; dùng bộ logo mới" } },
  { when: "2026-10-09", ref: "#2", text: { en: "Show real results instead of generated explainers", vi: "Hiện kết quả thật thay cho video giải thích tự tạo" } },
  { when: "2026-10-14", ref: "#3", text: { en: "Let the Content Engine choose Today's picks every day", vi: "Để Content Engine tự chọn Chọn lọc hôm nay mỗi ngày" } },
  { when: "2026-10-15", ref: "#4 #5", text: { en: "Post Today's picks to X daily, with art-directed card styles", vi: "Đăng Chọn lọc hôm nay lên X mỗi ngày, card có art direction và nhiều style" } },
  { when: "2026-10-15", ref: "#6", text: { en: "Debug the X 401: test the connection from admin, trim pasted keys", vi: "Xử lý lỗi X 401: kiểm tra kết nối từ admin, bỏ khoảng trắng khi dán khóa" } },
  { when: "2026-10-15", ref: "#7 #8", text: { en: "Submit to the xAI marketplace; fix multi-word search and MCP CORS", vi: "Nộp lên marketplace xAI; sửa tìm kiếm nhiều từ và CORS của MCP" } },
  { when: "2026-10-16", ref: "#9", text: { en: "Run the engine and post to X at 8:30 in the morning (Vietnam)", vi: "Chạy engine và đăng X lúc 8:30 sáng (giờ VN)" } },
  { when: "2026-10-16", text: { en: "Add Product Management to admin", vi: "Thêm phần Quản lý sản phẩm vào admin" } },
];

// ---------------------------------------------------------------- changelog

export type Change = { when: string; pr?: number; open?: boolean; title: L; items: L[] };

export const CHANGELOG: Change[] = [
  {
    when: "2026-10-16",
    pr: 9,
    open: true,
    title: { en: "X post at :30", vi: "Đăng X vào phút :30" },
    items: [{ en: "Social cron at :30 so the post can go out at 8:30, after an 8:00 engine run", vi: "Cron đăng bài chạy phút :30 để đăng lúc 8:30, sau lần chạy engine lúc 8:00" }],
  },
  {
    when: "2026-10-15",
    pr: 8,
    title: { en: "MCP server: CORS for browser clients", vi: "MCP server: CORS cho client chạy trên trình duyệt" },
    items: [{ en: "Grok, Cursor web views and the MCP Inspector can call /api/mcp", vi: "Grok, web view của Cursor và MCP Inspector gọi được /api/mcp" }],
  },
  {
    when: "2026-10-15",
    pr: 7,
    title: { en: "Multi-word search; xAI marketplace submission", vi: "Tìm kiếm nhiều từ; nộp marketplace xAI" },
    items: [
      { en: "Queries with several words fall back to matching any word", vi: "Truy vấn nhiều từ chuyển sang khớp bất kỳ từ nào khi cần" },
      { en: "Submission text in docs/marketplaces/xai-grok.md", vi: "Nội dung nộp ở docs/marketplaces/xai-grok.md" },
    ],
  },
  {
    when: "2026-10-15",
    pr: 6,
    title: { en: "X: test the connection, trim pasted keys", vi: "X: kiểm tra kết nối, bỏ khoảng trắng của khóa" },
    items: [{ en: "Test X connection in /admin/social calls GET /2/users/me and explains 401/403", vi: "Nút kiểm tra kết nối X trong /admin/social gọi GET /2/users/me và giải thích lỗi 401/403" }],
  },
  {
    when: "2026-10-15",
    pr: 5,
    title: { en: "X card: Sonnet headline, three styles", vi: "Card X: tiêu đề Sonnet, ba style" },
    items: [
      { en: "Editorial, spotlight and list styles; light theme by default", vi: "Ba style biên tập, spotlight, danh sách; mặc định nền sáng" },
      { en: "Art direction (featured pick, headline) editable in /admin/social", vi: "Chỉnh art direction (tài nguyên nổi bật, tiêu đề) trong /admin/social" },
    ],
  },
  {
    when: "2026-10-15",
    pr: 4,
    title: { en: "Post Today's picks to X every day", vi: "Đăng Chọn lọc hôm nay lên X mỗi ngày" },
    items: [{ en: "Draft written by the engine, posted by the hourly social cron; /admin/social to edit, skip or post now", vi: "Engine viết nháp, cron hằng giờ đăng bài; /admin/social để sửa, bỏ qua hoặc đăng ngay" }],
  },
  {
    when: "2026-10-14",
    pr: 3,
    title: { en: "Today's picks chosen daily by the Content Engine", vi: "Content Engine chọn Chọn lọc hôm nay mỗi ngày" },
    items: [{ en: "Four safe resources with a preview, quality 80+, not repeated recently (daily_picks)", vi: "Bốn tài nguyên an toàn có ảnh xem trước, điểm 80+, không lặp gần đây (daily_picks)" }],
  },
  {
    when: "2026-10-09",
    title: { en: "Previewer: author's own images, cheaper vision call", vi: "Previewer: chỉ ảnh của tác giả, gọi vision rẻ hơn" },
    items: [{ en: "Safe-only queue of the top 300 resources", vi: "Hàng đợi chỉ gồm 300 tài nguyên an toàn hàng đầu" }],
  },
  {
    when: "2026-10-09",
    pr: 2,
    title: { en: "Real-result previews", vi: "Xem trước kết quả thật" },
    items: [
      { en: "Previewer agent (README images) and Airsc runs", vi: "Agent Previewer (ảnh README) và các lần chạy thử của Airsc" },
      { en: "Auto-playing slideshow replaces the Producer explainer; admin \"Has slideshow\" stage", vi: "Slideshow tự chạy thay cho video của Producer; bộ lọc \"Có slideshow\" trong admin" },
    ],
  },
  {
    when: "2026-10-08",
    title: { en: "Homepage redesign, logo kit, donate bar", vi: "Thiết kế lại trang chủ, bộ logo, thanh ủng hộ" },
    items: [
      { en: "Search-first hero, Today's picks stage, illustrated kits", vi: "Hero ưu tiên tìm kiếm, sân khấu Chọn lọc hôm nay, kit minh họa" },
      { en: "Logo kit and BRAND.md; pinned donate bar with supporters", vi: "Bộ logo và BRAND.md; thanh ủng hộ ghim kèm danh sách người ủng hộ" },
    ],
  },
  {
    when: "2026-10-07",
    pr: 1,
    title: { en: "Airsc MVP", vi: "Airsc MVP" },
    items: [
      { en: "Library, Content Engine, MCP server, admin console", vi: "Thư viện, Content Engine, MCP server, trang admin" },
      { en: "Free model: GitHub source shown directly, /go/[slug] counts opens, Ko-fi webhook", vi: "Mô hình miễn phí: hiện thẳng source GitHub, /go/[slug] đếm lượt mở, webhook Ko-fi" },
    ],
  },
];

// ---------------------------------------------------------------- features

export type Feature = { name: L; desc: L; status: "live" | "partial" | "planned"; code: string };
export type FeatureGroup = { title: L; items: Feature[] };

export const FEATURES: FeatureGroup[] = [
  {
    title: { en: "Public site", vi: "Trang công khai" },
    items: [
      { name: { en: "Search", vi: "Tìm kiếm" }, desc: { en: "Full-text with multi-word fallback, type and safe-only filters, instant dropdown", vi: "Toàn văn, khớp nhiều từ, lọc theo loại và chỉ an toàn, gợi ý tức thì" }, status: "live", code: "src/lib/data.ts · /browse · /api/search" },
      { name: { en: "Resource page", vi: "Trang tài nguyên" }, desc: { en: "Safety rating, one-click install, EN/VI summary, use cases, prompts, real-result slideshow, verified MCP tools", vi: "Mức an toàn, cài một chạm, tóm tắt EN/VI, use case, prompt, slideshow kết quả thật, tool MCP đã kiểm chứng" }, status: "live", code: "/r/[slug]" },
      { name: { en: "Open on GitHub", vi: "Mở trên GitHub" }, desc: { en: "Counts opens (and history for signed-in users), then redirects", vi: "Đếm lượt mở (và lưu lịch sử khi đã đăng nhập), rồi chuyển hướng" }, status: "live", code: "/go/[slug]" },
      { name: { en: "Homepage", vi: "Trang chủ" }, desc: { en: "Search-first hero, Today's picks stage, kits, new this week", vi: "Hero tìm kiếm, sân khấu Chọn lọc hôm nay, kit, mới trong tuần" }, status: "live", code: "src/app/[lang]/page.tsx" },
      { name: { en: "Kits", vi: "Kit" }, desc: { en: "11 goal-based bundles (landing page, payments, auth, SEO…), rebuilt every run", vi: "11 bộ theo mục tiêu (landing page, thanh toán, đăng nhập, SEO…), dựng lại mỗi lần chạy" }, status: "live", code: "/kits · src/lib/crawler/kits.ts" },
      { name: { en: "Guides", vi: "Hướng dẫn" }, desc: { en: "Best-of pages per category and a weekly digest, written by the Editor", vi: "Trang tổng hợp tốt nhất theo danh mục và bản tin tuần, do Editor viết" }, status: "live", code: "/guides" },
      { name: { en: "English and Vietnamese", vi: "Tiếng Anh và tiếng Việt" }, desc: { en: "EN at /, VI at /vi, every string in both", vi: "EN ở /, VI ở /vi, mọi chuỗi đều có hai thứ tiếng" }, status: "live", code: "src/proxy.ts · src/lib/i18n.ts" },
      { name: { en: "Accounts", vi: "Tài khoản" }, desc: { en: "Magic link, Google, GitHub; personal airsc_ key for MCP; open history", vi: "Magic link, Google, GitHub; khóa airsc_ riêng cho MCP; lịch sử mở" }, status: "live", code: "/login · /account" },
      { name: { en: "Pricing", vi: "Bảng giá" }, desc: { en: "Free and Pro ($5 once, for life) via Polar; the old Support page redirects here, the Ko-fi webhook still records gifts", vi: "Miễn phí và Pro ($5 một lần, trọn đời) qua Polar; trang Ủng hộ cũ chuyển về đây, webhook Ko-fi vẫn ghi nhận quà tặng" }, status: "live", code: "/pricing · /api/webhooks/polar · /api/webhooks/kofi" },
    ],
  },
  {
    title: { en: "For agents", vi: "Cho agent" },
    items: [
      { name: { en: "Airsc MCP server", vi: "MCP server Airsc" }, desc: { en: "search_resources, get_resource, list_kits, get_kit, install_resource; no key needed, CORS on", vi: "search_resources, get_resource, list_kits, get_kit, install_resource; không cần khóa, bật CORS" }, status: "live", code: "/api/mcp · /mcp" },
      { name: { en: "xAI marketplace", vi: "Marketplace xAI" }, desc: { en: "Submission prepared for Grok Bot and Cursor", vi: "Đã chuẩn bị hồ sơ cho Grok Bot và Cursor" }, status: "partial", code: "docs/marketplaces/xai-grok.md" },
    ],
  },
  {
    title: { en: "Content Engine", vi: "Content Engine" },
    items: [
      { name: { en: "Daily run", vi: "Chạy hằng ngày" }, desc: { en: "Durable workflow at the hour set in /admin; presets and limits per run", vi: "Workflow bền vững vào giờ đặt trong /admin; có preset và giới hạn mỗi lần chạy" }, status: "live", code: "src/workflows/content-engine.ts" },
      { name: { en: "Seven agents", vi: "Bảy agent" }, desc: { en: "Scout, Analyst, Curator, Producer, Demo, Previewer, Editor", vi: "Scout, Analyst, Curator, Producer, Demo, Previewer, Editor" }, status: "live", code: "src/lib/engine/agents" },
      { name: { en: "Publish gate", vi: "Cổng đăng" }, desc: { en: "Relevant, quality 40+ and not danger, otherwise hidden with a reason", vi: "Đúng chủ đề, điểm 40+ và không nguy hiểm, nếu không thì ẩn kèm lý do" }, status: "live", code: "curator.ts gate()" },
      { name: { en: "Budget brake", vi: "Phanh ngân sách" }, desc: { en: "Skips AI when the gateway balance is low, stops at the run cap", vi: "Bỏ qua AI khi số dư thấp, dừng khi chạm trần mỗi lần chạy" }, status: "live", code: "content-engine.ts" },
      { name: { en: "Today's picks", vi: "Chọn lọc hôm nay" }, desc: { en: "Four picks per Vietnam day, history keeps them from repeating", vi: "Bốn tài nguyên mỗi ngày, lịch sử giúp không lặp lại" }, status: "live", code: "src/lib/engine/picks.ts" },
    ],
  },
  {
    title: { en: "Distribution", vi: "Phân phối" },
    items: [
      { name: { en: "Daily X post", vi: "Bài X hằng ngày" }, desc: { en: "Sonnet copy, card in three styles, auto at the set hour, never posted twice", vi: "Sonnet viết bài, card ba style, tự đăng đúng giờ, không bao giờ đăng trùng" }, status: "live", code: "src/lib/social · /api/cron/social" },
      { name: { en: "Short video", vi: "Video ngắn" }, desc: { en: "30 s vertical promo in Remotion, on a branch", vi: "Video dọc 30 giây bằng Remotion, đang ở nhánh riêng" }, status: "planned", code: "feat/airsc-short-video" },
    ],
  },
  {
    title: { en: "Admin", vi: "Admin" },
    items: [
      { name: { en: "Overview", vi: "Tổng quan" }, desc: { en: "KPIs, views, GitHub opens, AI cost charts, top viewed", vi: "KPI, lượt xem, lượt mở GitHub, biểu đồ chi phí AI, xem nhiều nhất" }, status: "live", code: "/admin" },
      { name: { en: "Resources", vi: "Tài nguyên" }, desc: { en: "Filters by type, status, stage; publish, hide, redo", vi: "Lọc theo loại, trạng thái, bước; đăng, ẩn, làm lại" }, status: "live", code: "/admin/resources" },
      { name: { en: "Agents & costs", vi: "Agent & chi phí" }, desc: { en: "Runs and logs, run now, limits, models, budget, run hour", vi: "Các lần chạy và log, chạy ngay, giới hạn, model, ngân sách, giờ chạy" }, status: "live", code: "/admin/agents" },
      { name: { en: "Social posts", vi: "Bài đăng mạng xã hội" }, desc: { en: "Today's draft and card, settings, connection test, history", vi: "Nháp và card hôm nay, thiết lập, kiểm tra kết nối, lịch sử" }, status: "live", code: "/admin/social" },
      { name: { en: "Product Management", vi: "Quản lý sản phẩm" }, desc: { en: "This section", vi: "Phần này" }, status: "live", code: "/admin/pm" },
    ],
  },
];
