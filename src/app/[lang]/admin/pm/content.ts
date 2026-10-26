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
    intro: "Diagrams traced from the source with Archify, kept as dated snapshots. Every box links to the file and lines it comes from, and every earlier version stays in the history below.",
    traced: "Traced from commit",
    open: "Open full screen",
    version: "Version",
    latest: "latest",
    history: "History",
    historyIntro: "Every update adds a snapshot; an older one is never changed or removed.",
    olderNotice: "You are looking at an older snapshot.",
    backToLatest: "Back to the latest",
    fresh: "Up to date: nothing structural has changed since these diagrams were traced.",
    stale: "These diagrams are out of date",
    staleBody: "Since they were traced: {commits} commits and {prs} merged pull requests. Structural changes: {signals}.",
    unknown: "Could not reach GitHub to compare with main. Try again in a few minutes.",
    update: "Update architecture",
    updating: "Starting…",
    started: "Started. Claude runs Archify on the repository and opens a pull request in about 15 minutes; merge it to publish the new snapshot.",
    lastRun: "Last update run",
    runs: { queued: "queued", in_progress: "running", success: "done", failure: "failed", cancelled: "cancelled" } as Record<string, string>,
    notConfigured: "Starting it from here is not set up yet (needs GITHUB_DISPATCH_TOKEN, see docs/architecture-snapshots.md). Meanwhile run this in Claude Code:",
    diagrams: "diagrams",
  },
  stack: {
    intro: "Versions are read from package.json at build time. The core stack is locked in stack.lock.json: the build fails if a core package is added, removed or moved to another major version without updating the lock in the same change.",
    conventions: "Project conventions",
    version: "version",
    unused: "in package.json, not used in src",
    core: "core",
    coreHint: "locked: changing it needs a decision",
    lockTitle: "Locked core stack",
    lockIntro: "Changing one of these means changing how the product is built. Do not let an agent do it on its own: write the reason in docs/decisions, update stack.lock.json and the list below in the same pull request.",
    lockedBy: "locked at major",
    unlisted: "In package.json but not described above",
    unlistedIntro: "Add each to the list above with its role, and to stack.lock.json (core or extra).",
    noneUnlisted: "Every package in package.json is described above.",
    checked: "Checked at every build",
  },
  roadmap: {
    intro: "The original goals, what shipped, and what is next. Dates are Vietnam time.",
    goals: "Original goals",
    phases: "Phases",
    requests: "Change requests",
    status: { done: "Done", doing: "In progress", next: "Next", idea: "Idea" },
  },
  changelog: {
    intro: "Merged changes to production, newest first. Every pull request adds its entry here (AGENTS.md); a check on GitHub fails a pull request that changes the product without touching this file.",
    direct: "direct to main",
    open: "open PR",
    missingTitle: "Merged pull requests missing from the changelog",
    missingBody: "Add an entry for each one in src/app/[lang]/admin/pm/content.ts (CHANGELOG), and the roadmap and features if they changed.",
    allIn: "Every merged pull request has an entry.",
    unknown: "Could not reach GitHub to compare with the merged pull requests.",
  },
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
    intro: "Sơ đồ vẽ từ source bằng Archify, lưu thành các bản chụp theo ngày. Mỗi khối có link tới file và dòng code tương ứng, và mọi phiên bản trước đó vẫn nằm trong lịch sử bên dưới.",
    traced: "Vẽ từ commit",
    open: "Mở toàn màn hình",
    version: "Phiên bản",
    latest: "mới nhất",
    history: "Lịch sử",
    historyIntro: "Mỗi lần cập nhật thêm một bản chụp; bản cũ không bao giờ bị sửa hay xóa.",
    olderNotice: "Bạn đang xem một bản chụp cũ.",
    backToLatest: "Về bản mới nhất",
    fresh: "Còn mới: chưa có thay đổi cấu trúc nào kể từ khi vẽ các sơ đồ này.",
    stale: "Các sơ đồ này đã cũ",
    staleBody: "Kể từ lúc vẽ: {commits} commit và {prs} pull request đã merge. Thay đổi cấu trúc: {signals}.",
    unknown: "Không kết nối được GitHub để so sánh với main. Hãy thử lại sau vài phút.",
    update: "Cập nhật kiến trúc",
    updating: "Đang khởi động…",
    started: "Đã bắt đầu. Claude chạy Archify trên repo và mở một pull request sau khoảng 15 phút; merge pull request đó để đăng bản chụp mới.",
    lastRun: "Lần cập nhật gần nhất",
    runs: { queued: "đang chờ", in_progress: "đang chạy", success: "xong", failure: "lỗi", cancelled: "đã hủy" },
    notConfigured: "Chưa thiết lập để bắt đầu từ đây (cần GITHUB_DISPATCH_TOKEN, xem docs/architecture-snapshots.md). Trong lúc đó hãy chạy lệnh này trong Claude Code:",
    diagrams: "sơ đồ",
  },
  stack: {
    intro: "Phiên bản đọc từ package.json lúc build. Core stack được khóa trong stack.lock.json: build sẽ lỗi nếu thêm, bỏ hoặc nâng major một package core mà không cập nhật file khóa trong cùng thay đổi.",
    conventions: "Quy ước dự án",
    version: "phiên bản",
    unused: "có trong package.json, chưa dùng trong src",
    core: "core",
    coreHint: "đã khóa: muốn đổi phải có quyết định",
    lockTitle: "Core stack đã khóa",
    lockIntro: "Đổi một trong những thứ này là đổi cách xây sản phẩm. Đừng để agent tự làm: ghi lý do vào docs/decisions, cập nhật stack.lock.json và danh sách bên dưới trong cùng một pull request.",
    lockedBy: "khóa ở major",
    unlisted: "Có trong package.json nhưng chưa được mô tả ở trên",
    unlistedIntro: "Thêm từng package vào danh sách trên kèm vai trò, và vào stack.lock.json (core hoặc extra).",
    noneUnlisted: "Mọi package trong package.json đều đã được mô tả ở trên.",
    checked: "Kiểm tra ở mỗi lần build",
  },
  roadmap: {
    intro: "Mục tiêu ban đầu, những gì đã ra mắt và việc tiếp theo. Ngày theo giờ Việt Nam.",
    goals: "Mục tiêu ban đầu",
    phases: "Các giai đoạn",
    requests: "Các lần cập nhật yêu cầu",
    status: { done: "Xong", doing: "Đang làm", next: "Tiếp theo", idea: "Ý tưởng" },
  },
  changelog: {
    intro: "Các thay đổi đã lên production, mới nhất trước. Mỗi pull request thêm mục của nó vào đây (AGENTS.md); một bước kiểm tra trên GitHub sẽ báo lỗi pull request nào đổi sản phẩm mà không đụng tới file này.",
    direct: "commit thẳng vào main",
    open: "PR đang mở",
    missingTitle: "Pull request đã merge nhưng chưa có trong changelog",
    missingBody: "Thêm mục cho từng cái vào src/app/[lang]/admin/pm/content.ts (CHANGELOG), và cả lộ trình, tính năng nếu có đổi.",
    allIn: "Mọi pull request đã merge đều có mục.",
    unknown: "Không kết nối được GitHub để so với các pull request đã merge.",
  },
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

/** `pkg` is the package whose version is shown; `also` lists other packages this entry describes, so none is reported as undescribed */
export type StackItem = { name: string; pkg?: string; also?: string[]; role: L; unused?: boolean };
export type StackGroup = { title: L; items: StackItem[] };

export const STACK: StackGroup[] = [
  {
    title: { en: "App", vi: "Ứng dụng" },
    items: [
      { name: "Next.js (App Router)", pkg: "next", role: { en: "Pages, route handlers, server actions; EN at /, VI at /vi via src/proxy.ts", vi: "Trang, route handler, server action; EN ở /, VI ở /vi qua src/proxy.ts" } },
      { name: "React", pkg: "react", also: ["react-dom"], role: { en: "UI, server components by default", vi: "Giao diện, mặc định là server component" } },
      { name: "TypeScript", pkg: "typescript", also: ["@types/node", "@types/react", "@types/react-dom"], role: { en: "Whole codebase", vi: "Toàn bộ code" } },
      { name: "server-only", pkg: "server-only", role: { en: "Keeps server code (keys, database tokens) out of client bundles", vi: "Giữ code phía server (khóa, token database) không lọt vào bundle client" } },
      { name: "Zod", pkg: "zod", role: { en: "Schemas for AI output and inputs", vi: "Schema cho kết quả AI và dữ liệu vào" } },
    ],
  },
  {
    title: { en: "UI and brand", vi: "Giao diện và thương hiệu" },
    items: [
      { name: "Tailwind CSS", pkg: "tailwindcss", also: ["@tailwindcss/postcss"], role: { en: "Styling with the tokens in src/app/globals.css (light and dark)", vi: "Style bằng token trong src/app/globals.css (sáng và tối)" } },
      { name: "Geist / Geist Mono", role: { en: "The only typefaces; headings font-semibold (BRAND.md)", vi: "Font duy nhất; tiêu đề font-semibold (BRAND.md)" } },
      { name: "lucide-react", pkg: "lucide-react", role: { en: "Icons", vi: "Icon" } },
      { name: "clsx + tailwind-merge", pkg: "clsx", also: ["tailwind-merge"], role: { en: "Conditional class names (cn helper)", vi: "Ghép class theo điều kiện (hàm cn)" } },
      { name: "Motion", pkg: "motion", role: { en: "Homepage animation", vi: "Hiệu ứng trang chủ" } },
      { name: "react-markdown + remark-gfm", pkg: "react-markdown", also: ["remark-gfm"], role: { en: "Guides and README excerpts", vi: "Bài hướng dẫn và trích README" } },
      { name: "Remotion", pkg: "@remotion/player", also: ["remotion"], role: { en: "Slideshow of real results on resource pages", vi: "Slideshow kết quả thật trên trang tài nguyên" } },
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
      { name: "Vercel Cron", role: { en: "Hourly /api/cron/pipeline and /api/cron/social, and /api/cron/social?task=post every five minutes to send posts at their set minute (vercel.ts)", vi: "/api/cron/pipeline và /api/cron/social mỗi giờ, và /api/cron/social?task=post mỗi năm phút để đăng bài đúng phút đã đặt (vercel.ts)" } },
    ],
  },
  {
    title: { en: "Integrations", vi: "Tích hợp" },
    items: [
      { name: "MCP (mcp-handler)", pkg: "mcp-handler", also: ["@modelcontextprotocol/server"], role: { en: "Airsc MCP server at /api/mcp: 5 tools, Streamable HTTP, CORS", vi: "MCP server của Airsc ở /api/mcp: 5 tool, Streamable HTTP, CORS" } },
      { name: "X API v2", role: { en: "Posts with an image and a link reply, and the numbers of each post (OAuth 1.0a, src/lib/social/x.ts)", vi: "Đăng bài kèm ảnh và reply chứa link, đọc số liệu từng bài (OAuth 1.0a, src/lib/social/x.ts)" } },
      { name: "GitHub API", role: { en: "Crawler, the X handle of each resource's author, and the admin's comparison of main with the diagrams and the changelog (public reads)", vi: "Crawler, tài khoản X của tác giả từng tài nguyên, và việc admin so sánh main với sơ đồ và changelog (chỉ đọc công khai)" } },
      { name: "next/og + sharp", pkg: "sharp", role: { en: "Renders the X card PNG", vi: "Vẽ ảnh card PNG cho X" } },
      { name: "Ko-fi webhook", role: { en: "Donations and the supporters list", vi: "Ủng hộ và danh sách người ủng hộ" } },
      { name: "Polar.sh", pkg: "@polar-sh/sdk", role: { en: "Pro membership: checkout, billing portal and the customer.state_changed webhook", vi: "Gói Pro: thanh toán, cổng quản lý và webhook customer.state_changed" } },
    ],
  },
  {
    title: { en: "Hosting", vi: "Hạ tầng" },
    items: [
      { name: "Vercel (sin1)", role: { en: "Production on push to main, previews per branch; the build runs the stack check first", vi: "Production khi push lên main, preview cho từng nhánh; build chạy kiểm tra stack trước" } },
      { name: "pnpm", role: { en: "Package manager", vi: "Trình quản lý package" } },
    ],
  },
  {
    title: { en: "Tooling and guardrails", vi: "Công cụ và rào chắn" },
    items: [
      { name: "ESLint", pkg: "eslint", also: ["eslint-config-next"], role: { en: "Lint with the Next.js config", vi: "Lint với cấu hình của Next.js" } },
      { name: "tsx", pkg: "tsx", role: { en: "Runs the scripts (crawl, rescore, dry runs)", vi: "Chạy các script (crawl, rescore, chạy thử)" } },
      { name: "@vercel/config", pkg: "@vercel/config", role: { en: "Typed vercel.ts: regions and crons", vi: "vercel.ts có kiểu: vùng và cron" } },
      { name: "Stack lock", role: { en: "stack.lock.json and scripts/check-stack.mjs: the build fails when the core stack drifts (docs/decisions)", vi: "stack.lock.json và scripts/check-stack.mjs: build lỗi khi core stack bị lệch (docs/decisions)" } },
      { name: "Playwright MCP", role: { en: "Drives a browser for scripts/mobile-audit.mjs and scripts/brand-drift.mjs (npx, no package; server in .mcp.json)", vi: "Điều khiển trình duyệt cho scripts/mobile-audit.mjs và scripts/brand-drift.mjs (npx, không thêm package; server trong .mcp.json)" } },
      { name: "design-dna", role: { en: "Claude Code skill in .claude/skills; its CIE ΔE colour maths measures brand drift against BRAND.md", vi: "Skill của Claude Code trong .claude/skills; phép tính màu CIE ΔE đo độ lệch thương hiệu so với BRAND.md" } },
      { name: "Archify + Claude Code", role: { en: "Architecture snapshots (/refresh-architecture, docs/architecture-snapshots.md)", vi: "Các bản chụp kiến trúc (/refresh-architecture, docs/architecture-snapshots.md)" } },
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
    when: "2026-10-16 → 2026-10-19",
    status: "done",
    items: [
      { en: "Engine at 8:00 and X post at 8:30 Vietnam time (PR #9)", vi: "Engine lúc 8:00 và đăng X lúc 8:30 giờ VN (PR #9)" },
      { en: "Product Management in admin: architecture, stack, roadmap, changelog, features, picks history (PR #10)", vi: "Quản lý sản phẩm trong admin: kiến trúc, stack, lộ trình, changelog, tính năng, lịch sử chọn lọc (PR #10)" },
      { en: "The engine survives repos renamed in case (PR #11)", vi: "Engine không còn lỗi khi repo đổi chữ hoa/thường (PR #11)" },
    ],
  },
  {
    title: { en: "Pro and tiers", vi: "Gói Pro và các bậc" },
    when: "2026-10-19",
    status: "done",
    items: [
      { en: "Pro membership through Polar, with revenue, users and payments in admin (PR #13 to #16)", vi: "Gói Pro qua Polar, kèm doanh thu, người dùng và thanh toán trong admin (PR #13 đến #16)" },
      { en: "Free and Pro: daily install and MCP limits, the whole-kit prompt for Pro, launch price from Polar (PR #17, #18)", vi: "Free và Pro: giới hạn cài đặt và MCP theo ngày, prompt cài cả kit cho Pro, giá ra mắt lấy từ Polar (PR #17, #18)" },
    ],
  },
  {
    title: { en: "X distribution v2", vi: "Phân phối X v2" },
    when: "2026-10-22 → 2026-10-23",
    status: "doing",
    items: [
      { en: "The first digests reached 27 to 72 views, so: one resource per post, authors tagged, applied stories, a link in the reply, numbers read back, a review every three days (PR #20 to #22)", vi: "Các bài tổng hợp đầu tiên chỉ đạt 27 đến 72 lượt xem, nên: mỗi bài một tài nguyên, tag tác giả, bài applied, link ở reply, đọc lại số liệu, đánh giá mỗi ba ngày (PR #20 đến #22)" },
      { en: "Goal to check after a week: median views per post above 300 and authors reposting", vi: "Mục tiêu kiểm tra sau một tuần: trung vị lượt xem mỗi bài trên 300 và tác giả repost" },
    ],
  },
  {
    title: { en: "Guardrails", vi: "Rào chắn" },
    when: "2026-10-23",
    status: "doing",
    items: [
      { en: "Architecture snapshots with history and an out-of-date notice; a locked core stack (PR #23); the GitHub workflows that check the changelog on every pull request and refresh the architecture from the admin (PR #24)", vi: "Bản chụp kiến trúc có lịch sử và thông báo khi đã cũ; khóa core stack (PR #23); các workflow GitHub kiểm tra changelog ở mỗi pull request và cập nhật kiến trúc từ admin (PR #24)" },
    ],
  },
  {
    title: { en: "Autonomous engine (loop engineering)", vi: "Cỗ máy tự động (loop engineering)" },
    when: "2026-10-26",
    status: "doing",
    items: [
      { en: "P0 Jobs and playbooks: the catalog by profession, step-by-step playbooks with a recommended pick and alternatives per step", vi: "P0 Nghề và lộ trình: thư viện theo nghề, lộ trình từng bước có lựa chọn khuyên dùng và thay thế cho mỗi bước" },
      { en: "P1 Signals and scoreboard (search log and /admin/engine done; clicks and installs per resource next)", vi: "P1 Tín hiệu và scoreboard: nhật ký tìm kiếm, click và lượt cài theo tài nguyên, /admin/engine với sức khoẻ từng vòng" },
      { en: "P2 Evals: golden cases per agent, code graders first, a CI check on every prompt or model change", vi: "P2 Eval: bộ case chuẩn cho từng agent, chấm bằng code trước, kiểm tra CI cho mọi thay đổi prompt hoặc model" },
      { en: "P3 Memory, run journal and a daily planner", vi: "P3 Bộ nhớ, nhật ký run và bộ lập kế hoạch hằng ngày" },
      { en: "P4 Discovery and ranking that learn from yield and real use", vi: "P4 Discovery và xếp hạng tự học từ hiệu suất và hành vi thật" },
      { en: "P5 Playbooks that maintain themselves; emerging topics", vi: "P5 Lộ trình tự bảo trì; phát hiện chủ đề mới nổi" },
      { en: "P6 Daily radar page; the three-day review for every kind of content", vi: "P6 Trang Radar hằng ngày; review 3 ngày cho mọi loại nội dung" },
      { en: "P7 Self-improvement harness: Claude Code works through engine/backlog.json once a week and opens a pull request", vi: "P7 Harness tự cải tiến: Claude Code làm theo engine/backlog.json mỗi tuần và mở pull request" },
    ],
  },
  {
    title: { en: "Next", vi: "Tiếp theo" },
    when: "",
    status: "next",
    items: [
      { en: "Grow reach on X first (it is the distribution channel); only then add affiliate links for tools the library needs", vi: "Làm X có tiếp cận trước (đó là kênh phân phối); sau đó mới thêm link affiliate cho các công cụ mà thư viện cần" },
      { en: "A custom domain and web analytics, so visits from X can be measured", vi: "Tên miền riêng và web analytics, để đo được lượt truy cập đến từ X" },
      { en: "Bring README up to date: it still describes credits and Full-time Access; the tiers are now Free and Pro", vi: "Cập nhật README: vẫn còn mô tả credit và Full-time Access; hiện là Free và Pro" },
      { en: "Listing on the xAI marketplace (Grok Bot, Cursor) from docs/marketplaces/xai-grok.md", vi: "Lên marketplace của xAI (Grok Bot, Cursor) theo docs/marketplaces/xai-grok.md" },
      { en: "30-second vertical short (Remotion, 3 hooks × EN/VI): ready on branch feat/airsc-short-video", vi: "Video dọc 30 giây (Remotion, 3 hook × EN/VI): đã có trên nhánh feat/airsc-short-video" },
    ],
  },
  {
    title: { en: "Ideas", vi: "Ý tưởng" },
    when: "",
    status: "idea",
    items: [
      { en: "Tutorials and applied posts as a section of the site (/learn), in English and Vietnamese", vi: "Hướng dẫn và bài applied thành một mục của site (/learn), song ngữ" },
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
  { when: "2026-10-19", ref: "#13 #16", text: { en: "Sell a Pro membership through Polar; see users, payments and revenue in admin", vi: "Bán gói Pro qua Polar; xem người dùng, thanh toán và doanh thu trong admin" } },
  { when: "2026-10-19", ref: "#17 #18", text: { en: "A pricing page with Free and Pro, daily limits for Free and a launch price", vi: "Trang bảng giá với Free và Pro, giới hạn theo ngày cho Free và giá ra mắt" } },
  { when: "2026-10-22", ref: "#20", text: { en: "The daily posts reach almost nobody: one resource per post, tag the authors, show how a resource is used in the real project, measure it and review every three days", vi: "Các bài hằng ngày gần như không ai thấy: mỗi bài một tài nguyên, tag tác giả, kể cách dùng tài nguyên trong dự án thật, đo kết quả và đánh giá mỗi ba ngày" } },
  { when: "2026-10-22", ref: "#21 #22", text: { en: "Split the X admin into sub-pages, keep every open post in the queue, schedule by hour and minute, list all posts with their numbers", vi: "Tách admin X thành các trang con, giữ mọi bài chưa xong trong hàng đợi, hẹn giờ theo giờ và phút, liệt kê mọi bài kèm số liệu" } },
  { when: "2026-10-23", ref: "#23", text: { en: "Keep the architecture current with a history, stop the core stack changing by accident, and make sure the changelog and roadmap are updated with every change", vi: "Giữ kiến trúc luôn mới và có lịch sử, ngăn core stack bị đổi ngoài ý muốn, và bảo đảm changelog, lộ trình luôn được cập nhật theo mỗi thay đổi" } },
];

// ---------------------------------------------------------------- changelog

/** `pr` is the pull request; `also` lists others the same entry covers, so the admin does not call them missing */
export type Change = { when: string; pr?: number; also?: number[]; open?: boolean; title: L; items: L[] };

export const CHANGELOG: Change[] = [
  {
    when: "2026-10-26",
    pr: 29,
    open: true,
    title: { en: "Engine scoreboard and search signals", vi: "Scoreboard của cỗ máy và tín hiệu tìm kiếm" },
    items: [
      { en: "Every search (instant dropdown, Browse, the MCP server) is recorded with how many results it had (table search_log, migration 20261026000300); the write happens after the response and never blocks or breaks a search", vi: "Mỗi lượt tìm (gợi ý nhanh, Khám phá, MCP server) được ghi lại cùng số kết quả (bảng search_log, migration 20261026000300); việc ghi diễn ra sau khi trả lời và không bao giờ chặn hay làm hỏng lượt tìm" },
      { en: "/admin/engine: searches and the share with no result against the week before, what people looked for and did not find, resources per job, the latest engine runs, AI credit", vi: "/admin/engine: số lượt tìm và tỷ lệ không ra kết quả so với tuần trước, thứ người ta tìm mà không thấy, số tài nguyên theo nghề, các lần chạy engine gần nhất, credit AI" },
      { en: "The six loops that run Airsc written down with a trigger, a goal a machine can check, a verifier, stop rules and what each learns (src/lib/loops/specs.ts), shown on the same page with how much of each exists today", vi: "Sáu vòng lặp vận hành Airsc được viết rõ: kích hoạt, mục tiêu máy kiểm tra được, cách kiểm tra, điều kiện dừng và thứ mỗi vòng học được (src/lib/loops/specs.ts), hiện trên cùng trang kèm mức đã có đến đâu" },
    ],
  },
  {
    when: "2026-10-26",
    pr: 27,
    open: true,
    title: { en: "Jobs: the catalog sorted by the work it helps with", vi: "Nghề: thư viện chia theo công việc mà tài nguyên hỗ trợ" },
    items: [
      { en: "Twelve jobs (software development, office work, content, marketing, sales and support, data, research, design, product, finance, security, legal and HR) and thirteen industries; every published resource labelled (migration 20261026000100)", vi: "Mười hai nghề (lập trình, văn phòng, nội dung, marketing, bán hàng và CSKH, dữ liệu, nghiên cứu, thiết kế, sản phẩm, tài chính, bảo mật, pháp lý và nhân sự) và mười ba lĩnh vực; mọi tài nguyên đang hiển thị đều được gắn nhãn (migration 20261026000100)" },
      { en: "The Curator labels new resources with their jobs and industries", vi: "Curator gắn nghề và lĩnh vực cho tài nguyên mới" },
      { en: "Browse: a By job filter", vi: "Khám phá: bộ lọc Theo nghề" },
      { en: "The agent workflow category (511 resources, 42% of the catalog) splits into eight: planning method, memory, multi-agent teams, code search, runtimes, setup and rules, MCP infrastructure, collections (migration 20261026000200, applied after deploy)", vi: "Danh mục quy trình agent (511 tài nguyên, 42% thư viện) tách thành tám: phương pháp, bộ nhớ, đội agent, tìm code, runtime, cấu hình và rule, hạ tầng MCP, bộ sưu tập (migration 20261026000200, áp sau khi deploy)" },
    ],
  },
  {
    when: "2026-10-25",
    pr: 26,
    open: true,
    title: { en: "Playwright MCP and design-dna on Airsc itself: phone audit, brand drift", vi: "Playwright MCP và design-dna chạy trên chính Airsc: audit điện thoại, độ lệch thương hiệu" },
    items: [
      { en: "scripts/mobile-audit.mjs drives the Playwright MCP server over stdio (no package added) and checks ten public pages at 390 px. Before: 170 tap targets under 40 px, 1 text field that makes iOS zoom in. After: 45 and 0. No page was wider than the screen before or after. Cost: the sticky header is 12 px taller on phones (131 to 143)", vi: "scripts/mobile-audit.mjs điều khiển Playwright MCP server qua stdio (không thêm package) và kiểm tra mười trang công khai ở 390 px. Trước: 170 vùng bấm dưới 40 px, 1 ô nhập khiến iOS phóng to. Sau: 45 và 0. Không trang nào rộng hơn màn hình, cả trước lẫn sau. Cái giá: header cố định cao thêm 12 px trên điện thoại (131 lên 143)" },
      { en: "design-dna installed as a project skill. scripts/brand-drift.mjs uses its CIE ΔE maths to compare every painted colour on nine pages with the tokens: 10 colours outside the tokens became 5, painted elements off brand 46 became 14 (2.6% to 0.8%); the always-dark panels now use panel-accent, panel-muted, panel-raised and panel-line tokens, written in BRAND.md. The violet on those panels is now Violet 400 as BRAND.md says (contrast on the panel 8.0 to 5.9)", vi: "Cài design-dna làm skill của dự án. scripts/brand-drift.mjs dùng phép tính CIE ΔE của nó để so mọi màu được vẽ trên chín trang với các token: 10 màu ngoài token còn 5, phần tử lệch thương hiệu từ 46 còn 14 (2,6% còn 0,8%); các panel luôn tối giờ dùng token panel-accent, panel-muted, panel-raised, panel-line, ghi trong BRAND.md. Màu tím trên các panel đó nay là Violet 400 như BRAND.md quy định (độ tương phản trên panel từ 8,0 còn 5,9)" },
      { en: "Both runs added to the resource pages (Airsc runs) and to the applied-post presets in the admin", vi: "Cả hai lần chạy được thêm vào trang tài nguyên (Airsc runs) và vào preset bài applied trong admin" },
    ],
  },
  {
    when: "2026-10-25",
    pr: 25,
    title: { en: "Admin on phones", vi: "Admin trên điện thoại" },
    items: [
      { en: "The admin fits a phone screen: the long row of menu links no longer widens every page, so phones stopped showing it zoomed out like the desktop", vi: "Admin vừa màn hình điện thoại: hàng link menu dài không còn kéo rộng mọi trang, nên điện thoại không còn hiện thu nhỏ như bản desktop" },
      { en: "On phones the menu is one button naming the current page, with the pages of its group (Queue, All posts, New applied post, reviews, settings) as tabs under it", vi: "Trên điện thoại, menu là một nút ghi tên trang đang mở, kèm các trang cùng nhóm (Hàng đợi, Tất cả bài đăng, Viết bài applied, đánh giá, thiết lập) thành tab ngay bên dưới" },
      { en: "Queue on phones: the post and reply fields grow with their text, the actions are two columns of larger buttons, and fields are 16px so the phone does not zoom in when one is tapped", vi: "Hàng đợi trên điện thoại: ô bài đăng và reply giãn theo nội dung, các nút thao tác xếp hai cột và to hơn, ô nhập cỡ chữ 16px để điện thoại không tự phóng to khi bấm vào" },
      { en: "All posts on phones: one card per post with its numbers, instead of the wide table", vi: "Tất cả bài đăng trên điện thoại: mỗi bài một thẻ kèm số liệu, thay cho bảng rộng" },
    ],
  },
  {
    when: "2026-10-23",
    pr: 24,
    title: { en: "GitHub workflows: changelog check and architecture refresh", vi: "Workflow GitHub: kiểm tra changelog và cập nhật kiến trúc" },
    items: [
      { en: "Product docs: a pull request that changes src/, a migration, vercel.ts or package.json without touching the changelog fails (label no-changelog for the exceptions), and package.json must match stack.lock.json", vi: "Product docs: pull request đổi src/, migration, vercel.ts hoặc package.json mà không sửa changelog sẽ lỗi (nhãn no-changelog cho ngoại lệ), và package.json phải khớp stack.lock.json" },
      { en: "Refresh architecture: Claude runs Archify and opens a pull request with a new snapshot; started from the admin (needs ANTHROPIC_API_KEY on GitHub and GITHUB_DISPATCH_TOKEN on Vercel)", vi: "Refresh architecture: Claude chạy Archify và mở pull request với bản chụp mới; bắt đầu từ admin (cần ANTHROPIC_API_KEY trên GitHub và GITHUB_DISPATCH_TOKEN trên Vercel)" },
    ],
  },
  {
    when: "2026-10-23",
    pr: 23,
    title: { en: "Guardrails: architecture snapshots, locked core stack, changelog check", vi: "Rào chắn: bản chụp kiến trúc, khóa core stack, kiểm tra changelog" },
    items: [
      { en: "Architecture diagrams are dated snapshots with a history; the page says when main has moved past them and the nav shows a badge; /refresh-architecture in Claude Code adds a new snapshot (the Update architecture button starts the same recipe on GitHub once the workflow is added)", vi: "Sơ đồ kiến trúc là các bản chụp theo ngày, có lịch sử; trang báo khi main đã đi xa hơn sơ đồ và menu hiện huy hiệu; /refresh-architecture trong Claude Code thêm bản chụp mới (nút Cập nhật kiến trúc chạy cùng quy trình đó trên GitHub khi workflow được thêm vào)" },
      { en: "stack.lock.json locks the core packages by major version and scripts/check-stack.mjs fails the build when package.json drifts; the Tech stack page shows the lock and any package nobody described", vi: "stack.lock.json khóa các package core theo major và scripts/check-stack.mjs làm build lỗi khi package.json bị lệch; trang Tech stack hiện file khóa và mọi package chưa được mô tả" },
      { en: "Changelog: the page lists merged pull requests that have no entry and the nav shows a badge; PRs #10 to #22 backfilled; a pull request template with the checklist", vi: "Changelog: trang liệt kê các pull request đã merge mà chưa có mục và menu hiện huy hiệu; đã bổ sung PR #10 đến #22; có mẫu pull request kèm checklist" },
      { en: "Rules in AGENTS.md; decisions in docs/decisions", vi: "Quy tắc trong AGENTS.md; quyết định trong docs/decisions" },
    ],
  },
  {
    when: "2026-10-23",
    pr: 22,
    title: { en: "X admin: Queue, All posts, post detail, hour and minute", vi: "Admin X: Hàng đợi, Tất cả bài đăng, chi tiết bài, giờ và phút" },
    items: [
      { en: "The queue keeps every open post, flags overdue ones and moves a leftover post to today when given a new time", vi: "Hàng đợi giữ mọi bài chưa xong, đánh dấu bài quá giờ và chuyển bài tồn sang hôm nay khi đặt giờ mới" },
      { en: "All posts with numbers and a detail page per post; queue cards in two balanced columns; hour and minute in blocks of five, sent by a cron every five minutes", vi: "Tất cả bài đăng kèm số liệu và trang chi tiết từng bài; thẻ hàng đợi hai cột cân đối; giờ và phút theo bước năm phút, cron năm phút một lần để đăng" },
    ],
  },
  {
    when: "2026-10-22",
    pr: 21,
    title: { en: "Admin: X posts split into sub-pages", vi: "Admin: bài đăng X tách thành các trang con" },
    items: [{ en: "Queue, New applied post, Performance, Three-day reviews and Settings, each a sub-item in the nav", vi: "Hàng đợi, Viết bài applied, Hiệu quả, Đánh giá ba ngày và Thiết lập, mỗi mục là một sub-item trong menu" }],
  },
  {
    when: "2026-10-22",
    pr: 20,
    title: { en: "X posts v2: spotlights, applied stories, metrics, three-day review", vi: "Bài X v2: spotlight, bài applied, số liệu, đánh giá ba ngày" },
    items: [
      { en: "One resource per post with its author tagged, a scan line from the scanner and the link in the first reply; applied posts written from your notes and an image", vi: "Mỗi bài một tài nguyên, tag tác giả, dòng kết quả quét lấy từ scanner và link ở reply đầu tiên; bài applied viết từ ghi chú và ảnh của bạn" },
      { en: "A tag goes out only after approval (X forbids automated mentions); views, likes and clicks are read back from X; every three days Sonnet reviews them and rewrites the writing guidance", vi: "Tag chỉ được đăng sau khi duyệt (X cấm mention tự động); số liệu xem, like, bấm được đọc lại từ X; mỗi ba ngày Sonnet đánh giá và viết lại hướng dẫn viết" },
      { en: "Writing rules in docs/x-posts.md and src/lib/social/rules.ts", vi: "Quy tắc viết ở docs/x-posts.md và src/lib/social/rules.ts" },
    ],
  },
  {
    when: "2026-10-19",
    pr: 18,
    also: [17],
    title: { en: "Free and Pro tiers, pricing page", vi: "Gói Free và Pro, trang bảng giá" },
    items: [
      { en: "Free: 5 install unlocks a day and 30 Airsc MCP calls a day (10 without a key); Pro: unlimited and the whole-kit prompt; limits in src/lib/quota.ts, counted per Vietnam day, failing open", vi: "Free: 5 lượt mở cài đặt mỗi ngày và 30 lần gọi MCP mỗi ngày (10 nếu không có khóa); Pro: không giới hạn và prompt cài cả kit; giới hạn ở src/lib/quota.ts, tính theo ngày Việt Nam, lỗi thì mở" },
      { en: "/pricing with Free and Pro ($5, launch price and seats read from Polar); /support redirects to it", vi: "/pricing với Free và Pro ($5, giá ra mắt và số suất đọc từ Polar); /support chuyển về đó" },
    ],
  },
  {
    when: "2026-10-19",
    pr: 16,
    title: { en: "Admin: users, payments and revenue", vi: "Admin: người dùng, thanh toán và doanh thu" },
    items: [
      { en: "Business section: Revenue, Users (give or remove Pro by hand) and Payments (sync from Polar)", vi: "Mục Kinh doanh: Doanh thu, Người dùng (cấp hoặc gỡ Pro thủ công) và Thanh toán (đồng bộ từ Polar)" },
      { en: "The Polar webhook records orders and refunds in public.orders", vi: "Webhook Polar ghi đơn hàng và hoàn tiền vào public.orders" },
    ],
  },
  {
    when: "2026-10-19",
    pr: 15,
    also: [14],
    title: { en: "Polar: trimmed env values, set_pro server-side only", vi: "Polar: bỏ khoảng trắng của biến môi trường, set_pro chỉ ở server" },
    items: [
      { en: "Pasted Polar values are trimmed; a stray space no longer causes 401", vi: "Giá trị Polar dán vào được bỏ khoảng trắng; không còn lỗi 401 vì thừa dấu cách" },
      { en: "set_pro cannot be called by a signed-in user (the PUBLIC grant is revoked too)", vi: "Người dùng đã đăng nhập không gọi được set_pro (cũng đã thu hồi quyền PUBLIC)" },
    ],
  },
  {
    when: "2026-10-19",
    pr: 13,
    title: { en: "Pro membership through Polar", vi: "Gói Pro qua Polar" },
    items: [
      { en: "Checkout and billing portal as server actions; the Polar webhook re-reads the customer state and sets Pro through the set_pro RPC", vi: "Thanh toán và cổng quản lý là server action; webhook Polar đọc lại trạng thái khách hàng và đặt Pro qua RPC set_pro" },
      { en: "Pro section on the account page", vi: "Mục Pro trong trang tài khoản" },
    ],
  },
  {
    when: "2026-10-19",
    pr: 11,
    title: { en: "Engine: repos renamed in case no longer fail the run", vi: "Engine: repo đổi chữ hoa/thường không còn làm hỏng lần chạy" },
    items: [
      { en: "Unique index on lower(full_name); ingest takes the new spelling and keeps the slug", vi: "Index duy nhất trên lower(full_name); ingest nhận cách viết mới và giữ nguyên slug" },
      { en: "If a batch fails, rows go in one by one and the bad ones are logged", vi: "Nếu cả lô lỗi, từng dòng được nhập riêng và dòng lỗi được ghi log" },
    ],
  },
  {
    when: "2026-10-16",
    pr: 10,
    title: { en: "Admin: Product Management", vi: "Admin: Quản lý sản phẩm" },
    items: [
      { en: "Architecture (Archify diagrams), Tech stack, Roadmap, Changelog, Features and Today's picks history", vi: "Kiến trúc (sơ đồ Archify), Tech stack, Lộ trình, Changelog, Tính năng và Lịch sử chọn lọc hôm nay" },
    ],
  },
  {
    when: "2026-10-16",
    pr: 9,
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
      { name: { en: "Pricing", vi: "Bảng giá" }, desc: { en: "Free (5 install unlocks and 30 MCP calls a day) and Pro ($5 once, for life, unlimited) via Polar; launch price and seats read from Polar; the old Support page redirects here", vi: "Miễn phí (5 lượt mở cài đặt và 30 lần gọi MCP mỗi ngày) và Pro ($5 một lần, trọn đời, không giới hạn) qua Polar; giá ra mắt và số suất đọc từ Polar; trang Ủng hộ cũ chuyển về đây" }, status: "live", code: "/pricing · /api/webhooks/polar · /api/webhooks/kofi" },
    ],
  },
  {
    title: { en: "For agents", vi: "Cho agent" },
    items: [
      { name: { en: "Airsc MCP server", vi: "MCP server Airsc" }, desc: { en: "search_resources, get_resource, list_kits, get_kit, install_resource; works without a key (10 calls a day per IP), 30 with a key, unlimited on Pro; CORS on", vi: "search_resources, get_resource, list_kits, get_kit, install_resource; dùng được không cần khóa (10 lần mỗi ngày theo IP), 30 lần nếu có khóa, Pro không giới hạn; bật CORS" }, status: "live", code: "/api/mcp · /mcp" },
      { name: { en: "xAI marketplace", vi: "Marketplace xAI" }, desc: { en: "Submission prepared for Grok Bot and Cursor", vi: "Đã chuẩn bị hồ sơ cho Grok Bot và Cursor" }, status: "partial", code: "docs/marketplaces/xai-grok.md" },
    ],
  },
  {
    title: { en: "Content Engine", vi: "Content Engine" },
    items: [
      { name: { en: "Engine scoreboard", vi: "Scoreboard cỗ máy" }, desc: { en: "Searches and what was not found, catalog growth, resources per job, latest runs and the written-out loops with their goals and verifiers", vi: "Lượt tìm và thứ không tìm thấy, tăng trưởng thư viện, tài nguyên theo nghề, các lần chạy gần nhất và các vòng lặp được viết rõ cùng mục tiêu và cách kiểm tra" }, status: "live", code: "/admin/engine · src/lib/loops/specs.ts · src/lib/engine/signals.ts" },
      { name: { en: "Jobs and industries", vi: "Nghề và lĩnh vực" }, desc: { en: "Every resource carries the jobs it helps with and, when it has one, its field; the Curator sets them; Browse filters by job", vi: "Mỗi tài nguyên có nghề mà nó hỗ trợ và lĩnh vực nếu có; Curator gắn; Khám phá lọc được theo nghề" }, status: "live", code: "src/lib/taxonomy.ts · src/lib/engine/agents/curator.ts · /browse?job=" },
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
      { name: { en: "X posts", vi: "Bài đăng X" }, desc: { en: "Spotlights (one resource, author tagged after approval, link in the reply) and applied stories; scheduled by hour and minute; never posted twice; views and clicks read back every few hours", vi: "Spotlight (một tài nguyên, tag tác giả sau khi duyệt, link ở reply) và bài applied; hẹn theo giờ và phút; không bao giờ đăng trùng; số liệu xem và bấm được đọc lại vài giờ một lần" }, status: "live", code: "src/lib/social · /api/cron/social" },
      { name: { en: "Three-day review", vi: "Đánh giá ba ngày" }, desc: { en: "Sonnet compares the last three days with the three before and rewrites the writing guidance", vi: "Sonnet so sánh ba ngày gần nhất với ba ngày trước và viết lại hướng dẫn viết" }, status: "live", code: "src/lib/social/review.ts · docs/x-posts.md" },
      { name: { en: "Short video", vi: "Video ngắn" }, desc: { en: "30 s vertical promo in Remotion, on a branch", vi: "Video dọc 30 giây bằng Remotion, đang ở nhánh riêng" }, status: "planned", code: "feat/airsc-short-video" },
    ],
  },
  {
    title: { en: "Admin", vi: "Admin" },
    items: [
      { name: { en: "Overview", vi: "Tổng quan" }, desc: { en: "KPIs, views, GitHub opens, AI cost charts, top viewed", vi: "KPI, lượt xem, lượt mở GitHub, biểu đồ chi phí AI, xem nhiều nhất" }, status: "live", code: "/admin" },
      { name: { en: "Resources", vi: "Tài nguyên" }, desc: { en: "Filters by type, status, stage; publish, hide, redo", vi: "Lọc theo loại, trạng thái, bước; đăng, ẩn, làm lại" }, status: "live", code: "/admin/resources" },
      { name: { en: "Agents & costs", vi: "Agent & chi phí" }, desc: { en: "Runs and logs, run now, limits, models, budget, run hour", vi: "Các lần chạy và log, chạy ngay, giới hạn, model, ngân sách, giờ chạy" }, status: "live", code: "/admin/agents" },
      { name: { en: "Social posts", vi: "Bài đăng mạng xã hội" }, desc: { en: "Queue, all posts with numbers and a page each, new applied post, three-day reviews, settings, connection test", vi: "Hàng đợi, mọi bài kèm số liệu và trang riêng, viết bài applied, đánh giá ba ngày, thiết lập, kiểm tra kết nối" }, status: "live", code: "/admin/social" },
      { name: { en: "Revenue, users, payments", vi: "Doanh thu, người dùng, thanh toán" }, desc: { en: "Net revenue, Pro conversion, give or remove Pro by hand, orders from Polar", vi: "Doanh thu ròng, tỷ lệ lên Pro, cấp hoặc gỡ Pro thủ công, đơn hàng từ Polar" }, status: "live", code: "/admin/billing · /admin/users · /admin/payments" },
      { name: { en: "Product Management", vi: "Quản lý sản phẩm" }, desc: { en: "Architecture snapshots with history and an out-of-date notice, Tech stack with the locked core, roadmap, changelog with a missing-PR check, features, picks history", vi: "Bản chụp kiến trúc có lịch sử và thông báo khi đã cũ, Tech stack kèm phần core đã khóa, lộ trình, changelog có kiểm tra PR còn thiếu, tính năng, lịch sử chọn lọc" }, status: "live", code: "/admin/pm" },
    ],
  },
  {
    title: { en: "Guardrails", vi: "Rào chắn" },
    items: [
      { name: { en: "Architecture snapshots", vi: "Bản chụp kiến trúc" }, desc: { en: "Archify diagrams kept per date; the admin compares main with the commit they were traced from; /refresh-architecture or the Update architecture button (once the keys are set) adds a snapshot", vi: "Sơ đồ Archify lưu theo ngày; admin so main với commit đã vẽ; /refresh-architecture hoặc nút Cập nhật kiến trúc (khi đã đặt khóa) thêm bản chụp mới" }, status: "live", code: "src/lib/pm · .github/workflows/refresh-architecture.yml · .claude/commands/refresh-architecture.md" },
      { name: { en: "Stack lock", vi: "Khóa stack" }, desc: { en: "The build fails when a core package is added, removed or moved to another major", vi: "Build lỗi khi thêm, bỏ hoặc nâng major một package core" }, status: "live", code: "stack.lock.json · scripts/check-stack.mjs" },
      { name: { en: "Phone audit and brand drift", vi: "Audit điện thoại và độ lệch thương hiệu" }, desc: { en: "Two scripts that drive a browser through the Playwright MCP server: tap targets, zoom-on-focus fields, overflow and console errors at 390 px; every painted colour against the BRAND.md tokens", vi: "Hai script điều khiển trình duyệt qua Playwright MCP server: vùng bấm, ô nhập gây phóng to, tràn ngang và lỗi console ở 390 px; mọi màu được vẽ so với token trong BRAND.md" }, status: "live", code: "scripts/mobile-audit.mjs · scripts/brand-drift.mjs · .mcp.json" },
      { name: { en: "Changelog check", vi: "Kiểm tra changelog" }, desc: { en: "A pull request that changes the product must update the changelog (the check fails otherwise); the admin lists merged pull requests with no entry", vi: "Pull request đổi sản phẩm phải cập nhật changelog (nếu không bước kiểm tra sẽ lỗi); admin liệt kê các pull request đã merge mà chưa có mục" }, status: "live", code: ".github/workflows/pm-docs.yml · /admin/pm/changelog" },
    ],
  },
];
