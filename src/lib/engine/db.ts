import { anonClient } from "@/lib/supabase/anon";
import type { Resource } from "@/lib/types";
import type { CardStyle, EngineSettings } from "./settings";

/** Token-guarded RPCs used by the content agents (never exposed to browsers) */
const token = () => {
  const t = process.env.AIRSC_INGEST_TOKEN;
  if (!t) throw new Error("AIRSC_INGEST_TOKEN is not set");
  return t;
};

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await anonClient().rpc(fn, { p_token: token(), ...args });
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

export type AgentFilter = "unclassified" | "unproduced" | "undemoed" | "review" | "all";

export const db = {
  seen: () => rpc<string[]>("agent_seen", {}),
  markSeen: (names: string[]) => rpc<number>("mark_seen", { p_names: names }),
  known: () => rpc<{ full_name: string; pushed_at: string | null; crawled_at: string }[]>("agent_known", {}),
  list: (filter: AgentFilter, limit = 200) =>
    rpc<Resource[]>("agent_resources", { p_filter: filter, p_limit: limit }),
  byNames: (names: string[]) => rpc<Resource[]>("agent_resources_by_names", { p_names: names }),
  ingest: (rows: Record<string, unknown>[]) => rpc<number>("ingest_resources", { p_rows: rows }),
  patch: (rows: ({ full_name: string } & Record<string, unknown>)[]) => rpc<number>("patch_resources", { p_rows: rows }),
  ingestKits: (kits: unknown[]) => rpc<number>("ingest_kits", { p_kits: kits }),
  upsertPages: (pages: unknown[]) => rpc<number>("upsert_pages", { p_pages: pages }),
  logRun: (id: number | null, patch: Record<string, unknown>) =>
    rpc<number>("log_pipeline_run", { p_id: id, p_patch: patch }),
  runs: (limit = 20) => rpc<Record<string, unknown>[]>("admin_pipeline_runs", { p_limit: limit }),
  setStatus: (slug: string, status: "published" | "pending" | "hidden") =>
    rpc<void>("set_resource_status", { p_slug: slug, p_status: status }),
  requeue: (slug: string, stage: "curate" | "produce" | "demo") => rpc<void>("admin_requeue", { p_slug: slug, p_stage: stage }),
  previewQueue: (limit: number) =>
    rpc<{ full_name: string; slug: string; default_branch: string }[]>("agent_preview_queue", { p_limit: limit }),
  setPreviews: (rows: { full_name: string; previews: unknown[] }[]) => rpc<number>("set_previews", { p_rows: rows }),
  resetPreviews: (slug: string) => rpc<void>("reset_previews", { p_slug: slug }),
  /** first call of the Vietnam day wins; returns the picks in effect */
  setDailyPicks: (slugs: string[]) => rpc<string[]>("set_daily_picks", { p_slugs: slugs }),
  /** first draft of the day wins unless forced (Regenerate); returns the row in effect */
  saveSocialDraft: async (d: { day: string; channel: string; text: string; highlight: string | null; slugs: string[]; image_alt: string }, force = false) =>
    (
      await rpc<SocialPost[]>("save_social_draft", {
        p_day: d.day,
        p_channel: d.channel,
        p_text: d.text,
        p_highlight: d.highlight,
        p_slugs: d.slugs,
        p_image_alt: d.image_alt,
        p_force: force,
      })
    )[0],
  updateSocialText: (id: number, text: string) => rpc<void>("update_social_text", { p_id: id, p_text: text }),
  /** moves the post to 'posting' if it is in one of `from`; null when someone else has it */
  claimSocialPost: async (id: number, from: SocialStatus[]) =>
    (await rpc<SocialPost[]>("claim_social_post", { p_id: id, p_from: from }))[0] ?? null,
  finishSocialPost: (id: number, status: "posted" | "failed", r: { post_id?: string; post_url?: string; error?: string }) =>
    rpc<void>("finish_social_post", { p_id: id, p_status: status, p_post_id: r.post_id ?? null, p_post_url: r.post_url ?? null, p_error: r.error ?? null }),
  setSocialStatus: (id: number, status: "skipped" | "posted" | "failed" | "draft") => rpc<void>("set_social_status", { p_id: id, p_status: status }),
  socialPosts: (limit = 14) => rpc<SocialPost[]>("admin_social_posts", { p_limit: limit }),
  socialPost: async (day: string, channel = "x") => (await rpc<SocialPost[]>("get_social_post", { p_day: day, p_channel: channel }))[0] ?? null,
  /** card art direction for a post that has not gone out yet; null when it already has */
  setSocialCard: async (id: number, c: { highlight: string | null; headline: string; card_style: CardStyle; image_alt: string }) =>
    (
      await rpc<SocialPost[]>("set_social_card", {
        p_id: id,
        p_highlight: c.highlight,
        p_headline: c.headline,
        p_card_style: c.card_style,
        p_image_alt: c.image_alt,
      })
    )[0] ?? null,
  adminResources: (f: AdminFilter) =>
    rpc<{ total: number; rows: AdminResourceRow[] }>("admin_resources", {
      p_q: f.q ?? null,
      p_type: f.type ?? null,
      p_status: f.status ?? null,
      p_category: f.category ?? null,
      p_safety: f.safety ?? null,
      p_stage: f.stage ?? null,
      p_sort: f.sort ?? "stars",
      p_limit: f.limit ?? 50,
      p_offset: f.offset ?? 0,
    }),
  overview: () => rpc<AdminOverview>("admin_overview", {}),
  donations: () => rpc<{ count: number; usd: number; count_30d: number }>("admin_donations", {}),
  adminUsers: (f: { q?: string; filter?: string; sort?: string; limit?: number; offset?: number }) =>
    rpc<{ total: number; rows: AdminUserRow[] }>("admin_users", {
      p_q: f.q ?? null,
      p_filter: f.filter ?? "all",
      p_sort: f.sort ?? "newest",
      p_limit: f.limit ?? 50,
      p_offset: f.offset ?? 0,
    }),
  adminPayments: (f: { status?: string; limit?: number; offset?: number }) =>
    rpc<{ total: number; rows: AdminPaymentRow[] }>("admin_payments", {
      p_status: f.status ?? "all",
      p_limit: f.limit ?? 50,
      p_offset: f.offset ?? 0,
    }),
  adminBilling: () => rpc<AdminBilling>("admin_billing", {}),
  /** saved-resource alerts (migration 20261020000200): turn the day's changes into notifications, then email them */
  generateNotifications: (proOnly: boolean) => rpc<number>("generate_notifications", { p_pro_only: proOnly }),
  pendingDigests: () => rpc<Digest[]>("pending_digests", {}),
  markNotificationsEmailed: (ids: number[]) => rpc<void>("mark_notifications_emailed", { p_ids: ids }),
  setEmailAlertsFor: (userId: string, on: boolean) => rpc<void>("set_email_alerts_for", { p_user: userId, p_on: on }),
  /** idempotent on provider_order_id */
  recordOrder: (row: OrderRecord) => rpc<void>("record_order", { p_row: row }),
  setPro: (userId: string, enabled: boolean) => rpc<boolean>("set_pro", { p_user: userId, p_enabled: enabled }),
  settings: () => rpc<EngineSettings>("get_engine_settings", {}),
  saveSettings: (value: EngineSettings) => rpc<EngineSettings>("set_engine_settings", { p_value: value }),
  cronRanToday: () => rpc<boolean>("cron_ran_today_vn", {}),
  navCounts: () =>
    rpc<{ total: number; by_type: Record<string, number>; review: number; queued: number; hidden: number }>("admin_nav_counts", {}),
};

export type AdminFilter = {
  q?: string;
  type?: string;
  status?: string;
  category?: string;
  safety?: string;
  stage?: string;
  sort?: string;
  limit?: number;
  offset?: number;
};

export type SocialStatus = "draft" | "posting" | "posted" | "skipped" | "failed";

/** One announcement of Today's picks on a social channel (migration 20261015000100) */
export type SocialPost = {
  id: number;
  day: string;
  channel: string;
  status: SocialStatus;
  text: string;
  highlight: string | null;
  /** big line on the card, written by Sonnet for the highlight (editable in /admin/social) */
  headline: string | null;
  card_style: CardStyle | null;
  slugs: string[];
  image_alt: string | null;
  post_id: string | null;
  post_url: string | null;
  error: string | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminResourceRow = {
  slug: string;
  name: string;
  full_name: string;
  repo_url: string;
  type: string;
  status: "published" | "pending" | "hidden";
  hidden_reason: "not_relevant" | "low_quality" | "danger" | "manual" | null;
  category: string | null;
  safety: "safe" | "caution" | "danger";
  quality: number | null;
  quality_notes: string | null;
  stars: number;
  views: number;
  downloads: number;
  sources: string[];
  first_seen_at: string;
  classified_at: string | null;
  produced_at: string | null;
  demoed_at: string | null;
  demo_ok: "true" | "false" | null;
  demo_error: string | null;
  demo_tools: number;
};

/** One Polar order as stored in public.orders (migration 20261019000400); amounts in cents, USD */
export type OrderRecord = {
  provider_order_id: string;
  user_id: string | null;
  email: string | null;
  product: string;
  amount_cents: number;
  refunded_cents: number;
  currency: string;
  status: "paid" | "partially_refunded" | "refunded";
  created_at: string;
};

/** One user's alerts waiting to be emailed */
export type Digest = {
  user_id: string;
  email: string;
  locale: "en" | "vi" | null;
  items: { id: number; slug: string; name: string; kind: "update" | "safety"; old: string | null; new: string | null; at: string }[];
};

export type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string | null;
  fulltime: boolean;
  fulltime_at: string | null;
  founding: boolean;
  downloads: number;
  has_key: boolean;
  orders: number;
  paid_cents: number;
};

export type AdminPaymentRow = Omit<OrderRecord, "created_at"> & { id: number; created_at: string };

export type AdminBilling = {
  revenue: { gross: number; refunded: number; net: number; orders: number; orders_30d: number; net_30d: number; payers: number };
  users: { total: number; new_7d: number; pro: number; new_pro_30d: number; pro_without_order: number };
  by_product: { product: string; orders: number; net: number }[];
  daily: { day: string; revenue: number; signups: number; pro: number }[];
};

export type AdminOverview = {
  resources: {
    total: number; published: number; pending: number; queued: number; hidden: number; unclassified: number;
    with_video: number; demo_ok: number; new_7d: number; by_type: Record<string, number>;
  };
  traffic: { views_7d: number; views_30d: number; downloads_7d: number; downloads_30d: number };
  users: { total: number; new_7d: number; fulltime: number };
  revenue: { orders: number; usd: number; orders_30d: number };
  daily: { day: string; views: number; downloads: number; cost: number }[];
  top_viewed: { slug: string; name: string; type: string; views: number; downloads: number }[];
};
