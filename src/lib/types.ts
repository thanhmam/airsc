export type ResourceType = "skill" | "mcp" | "agent" | "rule" | "plugin";
export type Safety = "safe" | "caution" | "danger";

export type SafetyNote = {
  level: Exclude<Safety, "safe">;
  code: string;
  file?: string;
  en: string;
  vi: string;
};

export type McpConfig = {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
};

export type InstallInfo = {
  kind: ResourceType | "manual";
  /** MCP server entry name + config, used for Cursor deeplink and Claude desktop config */
  mcp?: { name: string; config: McpConfig };
  /** Paths inside the repo that hold the installable pieces (skill folders, agent files, rule files) */
  paths?: string[];
  commands?: { label: string; cmd: string }[];
};

export type Resource = {
  id: string;
  slug: string;
  type: ResourceType;
  name: string;
  full_name: string;
  owner: string;
  repo_url: string;
  homepage: string | null;
  description: string | null;
  description_vi: string | null;
  summary: string | null;
  summary_vi: string | null;
  readme_excerpt: string | null;
  stars: number;
  forks: number;
  license: string | null;
  license_ok: boolean;
  topics: string[];
  language: string | null;
  default_branch: string;
  pushed_at: string | null;
  version: string | null;
  safety: Safety;
  safety_notes: SafetyNote[];
  install: InstallInfo;
  npm_package: string | null;
  downloads: number;
  crawled_at: string;
  // Content Engine fields
  status: "published" | "pending" | "hidden";
  category: string | null;
  tags: string[];
  level: "beginner" | "intermediate" | "advanced" | null;
  quality: number | null;
  quality_notes: string | null;
  use_cases: Bilingual[];
  prompts: Bilingual[];
  showcase: { en: ShowcaseScene[]; vi: ShowcaseScene[]; model?: string } | null;
  demo: {
    kind: "mcp_tools";
    ok: boolean;
    tools?: { name: string; description?: string }[];
    command?: string;
    error?: string;
    verified_at: string;
  } | null;
  sources: string[];
  first_seen_at: string;
};

export type Bilingual = { en: string; vi: string };

export type ShowcaseScene = {
  kind: "hook" | "problem" | "ask" | "agent" | "result" | "cta";
  title: string;
  lines: string[];
};

export type GuidePageRow = {
  slug: string;
  kind: "category" | "digest" | "kit" | "topic";
  title: string;
  title_vi: string;
  description: string;
  description_vi: string;
  body: string;
  body_vi: string;
  resource_slugs: string[];
  showcase: { picks: { slug: string; why_en: string; why_vi: string }[]; model?: string } | null;
  generated_at: string;
};

export type Kit = {
  id: string;
  slug: string;
  title: string;
  title_vi: string;
  description: string;
  description_vi: string;
  icon: string;
  keywords: string[];
  position: number;
};

export type Credits = {
  fulltime: boolean;
  founding: boolean;
  weekly_limit: number;
  weekly_left: number;
  paid_credits: number;
  resets_at: string;
};

export const RESOURCE_TYPES: ResourceType[] = ["skill", "mcp", "plugin", "agent", "rule"];
