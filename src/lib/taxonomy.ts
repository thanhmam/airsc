/** Categories as a vibe coder thinks about them (what they want to build), not by tech type */
export const CATEGORIES = [
  { slug: "ui-design", en: "UI & design", vi: "Giao diện & thiết kế" },
  { slug: "web-apps", en: "Building web & mobile apps", vi: "Làm web & app" },
  { slug: "database-backend", en: "Database & backend", vi: "Database & backend" },
  { slug: "auth-security", en: "Auth & security", vi: "Đăng nhập & bảo mật" },
  { slug: "payments", en: "Payments & commerce", vi: "Thanh toán & bán hàng" },
  { slug: "deploy-devops", en: "Deploy & DevOps", vi: "Deploy & vận hành" },
  { slug: "testing-debugging", en: "Testing & debugging", vi: "Kiểm thử & sửa lỗi" },
  { slug: "code-quality", en: "Code review & quality", vi: "Review & chất lượng code" },
  // what used to be one "agent workflow & memory" bucket (42% of the catalog), split by what it does for the agent
  { slug: "agent-method", en: "Planning & engineering method", vi: "Phương pháp: kế hoạch, spec, TDD" },
  { slug: "agent-memory", en: "Agent memory & context", vi: "Bộ nhớ & ngữ cảnh cho agent" },
  { slug: "agent-teams", en: "Multi-agent teams", vi: "Đội agent & điều phối" },
  { slug: "code-search", en: "Code search & understanding", vi: "Tìm & hiểu code" },
  { slug: "agent-runtime", en: "Agent runtimes, CLIs & routers", vi: "Runtime, CLI & router cho agent" },
  { slug: "agent-setup", en: "Agent setup, rules & hooks", vi: "Cấu hình, rule & hook cho agent" },
  { slug: "mcp-infra", en: "MCP SDKs, gateways & proxies", vi: "SDK, gateway & proxy MCP" },
  { slug: "collections", en: "Skill & plugin collections", vi: "Bộ sưu tập skill & plugin" },
  { slug: "ai-apps", en: "AI & LLM features", vi: "Tính năng AI & LLM" },
  { slug: "browser-data", en: "Browser automation & web data", vi: "Tự động trình duyệt & dữ liệu web" },
  { slug: "integrations", en: "Integrations & automation", vi: "Kết nối & tự động hoá" },
  { slug: "docs-content", en: "Docs, writing & content", vi: "Tài liệu & nội dung" },
  { slug: "marketing-seo", en: "Marketing & SEO", vi: "Marketing & SEO" },
  { slug: "data-analytics", en: "Data & analytics", vi: "Dữ liệu & phân tích" },
  { slug: "media", en: "Images, video & audio", vi: "Ảnh, video & âm thanh" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];

/** Retired slugs still stored on rows until the next reclassification (migration 20261026000200 moves them) */
const LEGACY_CATEGORIES: Record<string, { en: string; vi: string }> = {
  "agent-workflow": { en: "Agent workflow & memory", vi: "Quy trình & bộ nhớ agent" },
};

export const categoryLabel = (slug: string | null | undefined, lang: "en" | "vi") =>
  CATEGORIES.find((c) => c.slug === slug)?.[lang] ?? (slug ? LEGACY_CATEGORIES[slug]?.[lang] : undefined) ?? null;

/**
 * Jobs: who a resource helps and with what work. A resource has one main job and at most one more.
 * This is the "by profession" view of the catalog (/for/<job>); categories stay the technical view.
 */
export const JOBS = [
  { slug: "engineering", en: "Software development", vi: "Lập trình", hint: { en: "Build, test and ship software with an agent", vi: "Xây, kiểm thử và ship phần mềm cùng agent" } },
  { slug: "office", en: "Office work & automation", vi: "Văn phòng & tự động hoá", hint: { en: "Email, documents, spreadsheets, notes and workflows", vi: "Email, tài liệu, bảng tính, ghi chú và luồng tự động" } },
  { slug: "content", en: "Content & video", vi: "Nội dung & video", hint: { en: "Writing, slides, video, audio and social posts", vi: "Viết, slide, video, âm thanh và bài mạng xã hội" } },
  { slug: "marketing", en: "Marketing & SEO", vi: "Marketing & SEO", hint: { en: "Positioning, SEO, ads and growth", vi: "Định vị, SEO, quảng cáo và tăng trưởng" } },
  { slug: "sales", en: "Sales & customer support", vi: "Bán hàng & CSKH", hint: { en: "Finding leads, outreach, shopping and support bots", vi: "Tìm khách hàng, tiếp cận, mua sắm và bot chăm sóc khách" } },
  { slug: "data", en: "Data & analytics", vi: "Dữ liệu & phân tích", hint: { en: "Collect, clean, query and chart data", vi: "Thu thập, làm sạch, truy vấn và vẽ biểu đồ dữ liệu" } },
  { slug: "research", en: "Research & learning", vi: "Nghiên cứu & học tập", hint: { en: "Deep research, papers, citations and studying", vi: "Nghiên cứu sâu, bài báo, trích dẫn và học tập" } },
  { slug: "design", en: "Design", vi: "Thiết kế", hint: { en: "UI, diagrams, 3D and brand", vi: "Giao diện, sơ đồ, 3D và thương hiệu" } },
  { slug: "product", en: "Product & startups", vi: "Sản phẩm & khởi nghiệp", hint: { en: "Validate ideas, write PRDs, plan launches", vi: "Kiểm chứng ý tưởng, viết PRD, lên kế hoạch ra mắt" } },
  { slug: "finance", en: "Finance & accounting", vi: "Tài chính & kế toán", hint: { en: "Financial analysis, markets, tax and bookkeeping", vi: "Phân tích tài chính, thị trường, thuế và sổ sách" } },
  { slug: "security", en: "Security", vi: "Bảo mật", hint: { en: "Audits, scanning skills before install, reverse engineering", vi: "Audit, quét skill trước khi cài, dịch ngược" } },
  { slug: "legal-hr", en: "Legal, HR & careers", vi: "Pháp lý, nhân sự & việc làm", hint: { en: "Law, compliance, patents, hiring and job search", vi: "Luật, tuân thủ, bằng sáng chế, tuyển dụng và tìm việc" } },
] as const;

export type JobSlug = (typeof JOBS)[number]["slug"];
export const JOB_SLUGS = JOBS.map((j) => j.slug) as [JobSlug, ...JobSlug[]];
export const jobLabel = (slug: string | null | undefined, lang: "en" | "vi") => JOBS.find((j) => j.slug === slug)?.[lang] ?? null;

/** Industries: only when a resource is made for one field. Shown as tags, not as a menu */
export const INDUSTRIES = [
  { slug: "science", en: "Science & AI research", vi: "Khoa học & nghiên cứu AI" },
  { slug: "games-3d", en: "Games & 3D", vi: "Game & 3D" },
  { slug: "fintech", en: "Markets & crypto", vi: "Thị trường & crypto" },
  { slug: "entertainment", en: "Music, film & stories", vi: "Âm nhạc, phim & truyện" },
  { slug: "hardware", en: "IoT, robots & hardware", vi: "IoT, robot & phần cứng" },
  { slug: "education", en: "Education", vi: "Giáo dục" },
  { slug: "health", en: "Health & medicine", vi: "Y tế & sức khoẻ" },
  { slug: "manufacturing", en: "Manufacturing & CAD", vi: "Sản xuất & CAD" },
  { slug: "law", en: "Law", vi: "Luật" },
  { slug: "ecommerce", en: "E-commerce", vi: "Thương mại điện tử" },
  { slug: "real-estate", en: "Real estate & architecture", vi: "Bất động sản & kiến trúc" },
  { slug: "travel", en: "Travel", vi: "Du lịch" },
  { slug: "public-data", en: "Government & public data", vi: "Dữ liệu công" },
] as const;

export type IndustrySlug = (typeof INDUSTRIES)[number]["slug"];
export const INDUSTRY_SLUGS = INDUSTRIES.map((i) => i.slug) as [IndustrySlug, ...IndustrySlug[]];
export const industryLabel = (slug: string | null | undefined, lang: "en" | "vi") => INDUSTRIES.find((i) => i.slug === slug)?.[lang] ?? null;
