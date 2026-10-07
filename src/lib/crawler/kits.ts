export type KitDef = {
  slug: string;
  icon: string;
  title: string;
  title_vi: string;
  description: string;
  description_vi: string;
  keywords: string[];
};

/** Goal-based kits for vibe coders. Members are picked from the catalog by keyword at crawl time. */
export const KITS: KitDef[] = [
  {
    slug: "beautiful-landing-page",
    icon: "layout",
    title: "Beautiful landing page",
    title_vi: "Landing page đẹp",
    description: "Skills and tools that help your agent design and build a polished, responsive landing page.",
    description_vi: "Skills và công cụ giúp agent thiết kế và dựng landing page đẹp, chạy tốt trên điện thoại.",
    keywords: ["frontend-design", "landing", "tailwind", "ui-design", "web-design", "design"],
  },
  {
    slug: "payments",
    icon: "credit-card",
    title: "Take payments",
    title_vi: "Nhận thanh toán",
    description: "Add checkout, subscriptions and billing with Stripe, Polar and similar providers.",
    description_vi: "Thêm thanh toán, gói đăng ký và hoá đơn với Stripe, Polar và các cổng tương tự.",
    keywords: ["stripe", "payment", "payments", "billing", "polar", "checkout", "lemonsqueezy"],
  },
  {
    slug: "auth",
    icon: "lock",
    title: "Sign-in & accounts",
    title_vi: "Đăng nhập & tài khoản",
    description: "Let users sign up and log in safely: OAuth, magic links, sessions.",
    description_vi: "Cho người dùng đăng ký, đăng nhập an toàn: OAuth, magic link, phiên đăng nhập.",
    keywords: ["auth", "authentication", "oauth", "clerk", "supabase-auth", "login"],
  },
  {
    slug: "database",
    icon: "database",
    title: "Database",
    title_vi: "Cơ sở dữ liệu",
    description: "Give your agent access to Postgres, Supabase and other databases to design and query data.",
    description_vi: "Cho agent làm việc với Postgres, Supabase và các database khác để thiết kế và truy vấn dữ liệu.",
    keywords: ["postgres", "postgresql", "supabase", "database", "sql", "mysql", "sqlite", "neon"],
  },
  {
    slug: "seo",
    icon: "search",
    title: "SEO & growth",
    title_vi: "SEO & tăng trưởng",
    description: "Audit pages, write metadata and track rankings so people can find what you build.",
    description_vi: "Kiểm tra trang, viết metadata và theo dõi thứ hạng để người khác tìm thấy sản phẩm của bạn.",
    keywords: ["seo", "marketing", "analytics", "google-search-console", "content"],
  },
  {
    slug: "deploy",
    icon: "rocket",
    title: "Deploy & hosting",
    title_vi: "Deploy & hosting",
    description: "Ship your app to the internet: Vercel, Cloudflare, Docker and CI helpers.",
    description_vi: "Đưa app lên mạng: Vercel, Cloudflare, Docker và công cụ CI.",
    keywords: ["vercel", "deploy", "deployment", "cloudflare", "docker", "devops", "netlify"],
  },
  {
    slug: "email",
    icon: "mail",
    title: "Email & notifications",
    title_vi: "Email & thông báo",
    description: "Send transactional email and notifications from your app.",
    description_vi: "Gửi email giao dịch và thông báo từ app của bạn.",
    keywords: ["email", "resend", "gmail", "smtp", "notifications", "slack"],
  },
  {
    slug: "dashboard",
    icon: "chart",
    title: "Dashboards & charts",
    title_vi: "Dashboard & biểu đồ",
    description: "Build admin panels, charts and data views your users can read at a glance.",
    description_vi: "Dựng trang quản trị, biểu đồ và màn hình dữ liệu dễ đọc.",
    keywords: ["dashboard", "chart", "charts", "data-visualization", "admin", "analytics"],
  },
  {
    slug: "ai-chatbot",
    icon: "bot",
    title: "AI chatbot",
    title_vi: "Chatbot AI",
    description: "Add an AI assistant, RAG search or agent features to your product.",
    description_vi: "Thêm trợ lý AI, tìm kiếm RAG hoặc tính năng agent vào sản phẩm.",
    keywords: ["chatbot", "rag", "llm", "ai-sdk", "openai", "anthropic", "langchain", "agents"],
  },
  {
    slug: "ui-design",
    icon: "palette",
    title: "UI design system",
    title_vi: "Hệ thống thiết kế UI",
    description: "Figma, shadcn/ui and design-system helpers so every screen looks consistent.",
    description_vi: "Figma, shadcn/ui và công cụ design system để mọi màn hình nhất quán.",
    keywords: ["figma", "shadcn", "design-system", "ui", "components", "css"],
  },
];

type Candidate = {
  full_name: string;
  name: string;
  description: string | null;
  topics: string[];
  stars: number;
  safety: string;
  type: string;
};

export function pickKitMembers(kit: KitDef, all: Candidate[], max = 6): string[] {
  const scored = all
    .filter((r) => r.safety !== "danger")
    .map((r) => {
      const hay = `${r.name} ${r.description ?? ""}`.toLowerCase();
      let score = 0;
      for (const k of kit.keywords) {
        if (r.topics.includes(k)) score += 3;
        if (new RegExp(`\\b${k.replace(/-/g, "[- ]?")}\\b`).test(hay)) score += 2;
      }
      return { r, score: score ? score + Math.log10(r.stars + 1) : 0 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  // Prefer a mix of types so a kit isn't six MCP servers
  const out: string[] = [];
  const perType = new Map<string, number>();
  for (const { r } of scored) {
    if ((perType.get(r.type) ?? 0) >= 3) continue;
    out.push(r.full_name);
    perType.set(r.type, (perType.get(r.type) ?? 0) + 1);
    if (out.length >= max) break;
  }
  return out;
}
