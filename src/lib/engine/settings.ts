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

/** Daily X post about Today's picks (src/lib/social) */
export type SocialSettings = { x_enabled: boolean; x_auto: boolean; x_post_hour_vn: number; x_card_style?: CardStyle };

/** editorial: Sonnet's headline + real result; spotlight: the result full-bleed under the headline; list: the four picks */
export const CARD_STYLES = ["editorial", "spotlight", "list"] as const;
export type CardStyle = (typeof CARD_STYLES)[number];

/** Social copy and card headlines: Sonnet 5.5 thinking hard, since one post a day is public and cheap */
export const SOCIAL_MODEL = "anthropic/claude-sonnet-5.5";

/** Off until turned on in /admin/social; 20:00 Vietnam is 9:00 on the US East Coast */
export const SOCIAL_DEFAULT: Required<SocialSettings> = { x_enabled: false, x_auto: true, x_post_hour_vn: 20, x_card_style: "editorial" };

export const socialSettings = (s: EngineSettings): Required<SocialSettings> => ({ ...SOCIAL_DEFAULT, ...s.social });

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
