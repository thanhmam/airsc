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
};

export const runFor = (slug: string): AirscRun | undefined => AIRSC_RUNS[slug];

/** First image for a resource card: our own run first, then the README pick */
export const cardThumb = (slug: string, previews: Preview[] | null | undefined): Preview | undefined =>
  AIRSC_RUNS[slug]?.images[0] ?? previews?.[0];
