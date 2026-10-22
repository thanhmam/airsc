/** Content Engine settings, stored in Postgres and edited from /admin (no redeploy) */
export type EngineSettings = {
  enabled: boolean;
  run_hour_vn: number;
  limits: { maxNew: number; maxRefresh: number; maxCurate: number; maxProduce: number; maxDemo: number; maxPages: number; maxPreview?: number };
  models: { curator: string; editor: string; producer: string; previewer?: string };
  budget: { run_usd: number; min_balance_usd: number };
  social?: SocialSettings;
  updated_at?: string;
};

/**
 * X posts (src/lib/social). Each day the engine drafts one spotlight for each hour in `x_slots_vn`
 * (Vietnam time, posted at :30); "applied" posts are added by hand. `x_guidance` is the writing guidance
 * the three-day review rewrites (editable in /admin/social). `x_post_hour_vn` is the v1 hour, now unused.
 */
export type SocialSettings = {
  x_enabled: boolean;
  x_auto: boolean;
  x_post_hour_vn?: number;
  x_slots_vn?: number[];
  x_guidance?: string;
  x_card_style?: CardStyle;
  x_card_theme?: CardTheme;
};

/** editorial: Sonnet's headline + real result; spotlight: the result full-bleed under the headline; list: the four picks */
export const CARD_STYLES = ["editorial", "spotlight", "list"] as const;
export type CardStyle = (typeof CARD_STYLES)[number];

/** light: the site's light theme (default, easier to read in the timeline); dark: the always-dark panel */
export const CARD_THEMES = ["light", "dark"] as const;
export type CardTheme = (typeof CARD_THEMES)[number];

/** Social copy, card headlines and the three-day review: Sonnet 5.5 thinking hard, since every post is public and cheap */
export const SOCIAL_MODEL = "anthropic/claude-sonnet-5.5";

/** Off until turned on in /admin/social; 20:30 and 22:30 Vietnam are the US East Coast morning */
export const SOCIAL_DEFAULT: Required<SocialSettings> = {
  x_enabled: false,
  x_auto: true,
  x_post_hour_vn: 20,
  x_slots_vn: [20, 22],
  x_guidance: "",
  x_card_style: "editorial",
  x_card_theme: "light",
};

/** At most this many engine-drafted spotlights a day (applied posts come on top) */
export const MAX_SLOTS = 3;

export const socialSettings = (s: EngineSettings): Required<SocialSettings> => {
  const v = { ...SOCIAL_DEFAULT, ...s.social };
  const slots = [...new Set((v.x_slots_vn ?? []).filter((h) => Number.isInteger(h) && h >= 0 && h <= 23))].sort((a, b) => a - b);
  return { ...v, x_slots_vn: slots.slice(0, MAX_SLOTS) };
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
