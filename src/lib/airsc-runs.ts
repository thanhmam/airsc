import type { Bilingual, Preview } from "@/lib/types";

/**
 * Layer-2 previews: resources we installed ourselves and ran on the Airsc codebase.
 * Images live in public/runs/<slug>/; the full transcript and inputs are in the commit that added them.
 */
export type AirscRun = {
  /** what we asked the agent to do */
  task: Bilingual;
  /** agent + model that ran it, e.g. "Claude Code · Opus 5.5" */
  agent: string;
  /** YYYY-MM-DD */
  date: string;
  images: Preview[];
};

const img = (slug: string, file: string, width: number, height: number, caption: Bilingual, source: string): Preview => ({
  src: `/runs/${slug}/${file}.webp`,
  thumb: `/runs/${slug}/${file}-thumb.webp`,
  width,
  height,
  kind: "run",
  animated: false,
  caption,
  source,
});

export const AIRSC_RUNS: Record<string, AirscRun> = {
  "tt-a1i-archify": {
    task: {
      en: "Read the Airsc repository and diagram the system architecture and the daily Content Engine run, with links to the source lines.",
      vi: "Đọc repo Airsc và vẽ kiến trúc hệ thống cùng luồng chạy hằng ngày của Content Engine, có link tới từng dòng code.",
    },
    agent: "Claude Code · Opus 5.5",
    date: "2026-10-09",
    images: [
      img("tt-a1i-archify", "airsc-architecture", 1600, 1262, {
        en: "Airsc architecture: request paths, MCP, Ko-fi webhook and the Content Engine with its services",
        vi: "Kiến trúc Airsc: luồng request, MCP, webhook Ko-fi và Content Engine cùng các dịch vụ",
      }, "Diagrams/airsc-architecture.json"),
      img("tt-a1i-archify", "content-engine-workflow", 1600, 1043, {
        en: "One Content Engine run: Scout → Curator → publish gate → Producer → Demo → Editor, with budget and hide branches",
        vi: "Một lần chạy Content Engine: Scout → Curator → cổng đăng → Producer → Demo → Editor, kèm nhánh ngân sách và ẩn",
      }, "Diagrams/content-engine-workflow.json"),
    ],
  },
  "cathrynlavery-diagram-design": {
    task: {
      en: "Draw how the Airsc Previewer turns README images into resource previews, in the Airsc brand colours.",
      vi: "Vẽ cách Previewer của Airsc biến ảnh trong README thành ảnh xem trước cho tài nguyên, theo màu thương hiệu Airsc.",
    },
    agent: "Claude Code · Opus 5.5",
    date: "2026-10-09",
    images: [
      img("cathrynlavery-diagram-design", "previewer-data-flow", 1600, 968, {
        en: "Data flow: README → pre-filter → vision judge → WebP → Blob + Postgres → card. Passed the skill's own self-check and geometry check.",
        vi: "Luồng dữ liệu: README → lọc sơ bộ → model vision chấm → WebP → Blob + Postgres → thẻ. Đạt bước tự kiểm tra và kiểm tra hình học của skill.",
      }, "type-data-flow"),
    ],
  },
  "zarazhangrui-frontend-slides": {
    task: {
      en: "Start a pitch deck for Airsc: short, speaker-led. Show three title-slide styles to choose from.",
      vi: "Bắt đầu một deck giới thiệu Airsc: ngắn, để thuyết trình. Đưa ra ba phong cách slide mở đầu để chọn.",
    },
    agent: "Claude Code · Opus 5.5",
    date: "2026-10-09",
    images: [
      img("zarazhangrui-frontend-slides", "style-c", 1600, 900, {
        en: "Style C, a custom design in the Airsc brand: real safety labels from the catalog",
        vi: "Phong cách C, thiết kế riêng theo thương hiệu Airsc: nhãn an toàn thật lấy từ thư viện",
      }, "style-c"),
      img("zarazhangrui-frontend-slides", "style-b", 1600, 900, {
        en: "Style B, the 8-Bit Orbit template, with a real scan result for n8n-mcp",
        vi: "Phong cách B, mẫu 8-Bit Orbit, kèm kết quả quét thật của n8n-mcp",
      }, "style-b"),
      img("zarazhangrui-frontend-slides", "style-a", 1600, 900, {
        en: "Style A, the Swiss Modern preset",
        vi: "Phong cách A, preset Swiss Modern",
      }, "style-a"),
    ],
  },
  "blader-humanizer": {
    task: {
      en: "Rewrite five summaries that the Airsc Curator wrote with AI, using only facts from each repo.",
      vi: "Viết lại năm câu tóm tắt mà Curator của Airsc viết bằng AI, chỉ dùng thông tin có trong từng repo.",
    },
    agent: "Claude Code · Opus 5.5",
    date: "2026-10-09",
    images: [
      img("blader-humanizer", "before-after", 1600, 1120, {
        en: "Before and after, with each AI tell marked by the pattern number from the skill",
        vi: "Trước và sau, mỗi dấu hiệu văn AI được đánh số theo mẫu trong skill",
      }, "Curator summaries"),
    ],
  },
  "coreyhaines31-marketingskills": {
    task: {
      en: "Run the seo-audit skill on airsc.vercel.app: technical and on-page, as a browser and as Googlebot.",
      vi: "Chạy skill seo-audit trên airsc.vercel.app: kỹ thuật và on-page, dưới vai trình duyệt và Googlebot.",
    },
    agent: "Claude Code · Opus 5.5",
    date: "2026-10-09",
    images: [
      img("coreyhaines31-marketingskills", "seo-audit", 1600, 1180, {
        en: "SEO audit of Airsc: 8 findings with evidence, fix and impact, plus an action plan",
        vi: "Audit SEO của Airsc: 8 vấn đề kèm bằng chứng, cách sửa, mức ảnh hưởng và kế hoạch xử lý",
      }, "seo-audit"),
    ],
  },
};

export const runFor = (slug: string): AirscRun | undefined => AIRSC_RUNS[slug];

/** First image for a resource card: our own run first, then the README pick */
export const cardThumb = (slug: string, previews: Preview[] | null | undefined): Preview | undefined =>
  AIRSC_RUNS[slug]?.images[0] ?? previews?.[0];
