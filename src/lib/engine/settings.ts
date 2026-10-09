/** Content Engine settings, stored in Postgres and edited from /admin (no redeploy) */
export type EngineSettings = {
  enabled: boolean;
  run_hour_vn: number;
  limits: { maxNew: number; maxRefresh: number; maxCurate: number; maxProduce: number; maxDemo: number; maxPages: number; maxPreview?: number };
  models: { curator: string; editor: string; producer: string; previewer?: string };
  budget: { run_usd: number; min_balance_usd: number };
  updated_at?: string;
};

/** Previewer model until one is saved in /admin: a cheap vision model is enough */
export const PREVIEW_DEFAULT = "google/gemini-3-flash";

/** Models offered in the admin picker, with AI Gateway list prices (USD per 1M tokens in/out) */
export const MODEL_CHOICES = [
  { id: "google/gemini-3-flash", label: "Gemini 3 Flash", price: "$0.5 / $3" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", price: "$0.3 / $2.5" },
  { id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5", price: "$1 / $5" },
  { id: "anthropic/claude-sonnet-5.5", label: "Claude Sonnet 5.5", price: "$2 / $10" },
  { id: "anthropic/claude-opus-5.5", label: "Claude Opus 5.5", price: "$4 / $20" },
] as const;
