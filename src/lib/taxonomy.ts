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
  { slug: "agent-workflow", en: "Agent workflow & memory", vi: "Quy trình & bộ nhớ agent" },
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
export const categoryLabel = (slug: string | null | undefined, lang: "en" | "vi") =>
  CATEGORIES.find((c) => c.slug === slug)?.[lang] ?? null;
