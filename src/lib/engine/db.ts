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
  /** moves the post to 'posting' if it is in one of `from`; null when someone else has it */
  claimSocialPost: async (id: number, from: SocialStatus[]) =>
    (await rpc<SocialPost[]>("claim_social_post", { p_id: id, p_from: from }))[0] ?? null,
  setSocialStatus: (id: number, status: "skipped" | "posted" | "failed" | "draft" | "approved") => rpc<void>("set_social_status", { p_id: id, p_status: status }),
  socialPosts: (limit = 14) => rpc<SocialPost[]>("admin_social_posts", { p_limit: limit }),
  /** an existing post for (day, channel, slot) wins unless forced (Write again); returns the row in effect */
  upsertSocial: async (row: SocialDraft, force = false) => (await rpc<SocialPost[]>("social_upsert", { p_row: row, p_force: force }))[0] ?? null,
  /** edits a post that has not gone out; null when it has */
  updateSocial: async (id: number, patch: Partial<Pick<SocialPost, SocialEditable>>) =>
    (await rpc<SocialPost[]>("social_update", { p_id: id, p_patch: patch }))[0] ?? null,
  finishSocial: (id: number, patch: { status: "posted" | "failed"; post_id?: string; post_url?: string; reply_post_id?: string; error?: string | null }) =>
    rpc<void>("social_finish", { p_id: id, p_patch: patch }),
  setSocialMetrics: (rows: ({ id: number } & SocialMetrics)[]) => rpc<number>("social_set_metrics", { p_rows: rows }),
  xHandles: (owners: string[]) => rpc<{ owner: string; handle: string | null; checked_at: string }[]>("x_handles_get", { p_owners: owners }),
  setXHandles: (rows: { owner: string; handle: string | null }[]) => rpc<void>("x_handles_set", { p_rows: rows }),
  addSocialReview: async (row: Omit<SocialReview, "id" | "created_at">) => (await rpc<SocialReview[]>("social_review_add", { p_row: row }))[0],
  socialReviews: (limit = 5) => rpc<SocialReview[]>("social_reviews_list", { p_limit: limit }),
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
  /** idempotent on provider_order_id */
  recordOrder: (row: OrderRecord) => rpc<void>("record_order", { p_row: row }),
  setPro: (userId: string, enabled: boolean) => rpc<boolean>("set_pro", { p_user: userId, p_enabled: enabled }),
  settings: () => rpc<EngineSettings>("get_engine_settings", {}),
  saveSettings: (value: EngineSettings) => rpc<EngineSettings>("set_engine_settings", { p_value: value }),
  cronRanToday: () => rpc<boolean>("cron_ran_today_vn", {}),
  logSearch: (q: string, results: number, source: string, job?: string) =>
    rpc<void>("log_search", { p_q: q, p_results: results, p_source: source, p_job: job ?? null }),
  scoreboard: () => rpc<Scoreboard>("engine_scoreboard", {}),
  navCounts: () =>
    rpc<{ total: number; by_type: Record<string, number>; review: number; queued: number; hidden: number }>("admin_nav_counts", {}),
};

/** engine_scoreboard (migration 20261026000300) */
export type Scoreboard = {
  searches: {
    last7: number;
    prev7: number;
    zero_last7: number;
    zero_prev7: number;
    mcp_last7: number;
    zero_queries: { q: string; n: number }[];
    top_queries: { q: string; n: number; avg_results: number }[];
  };
  catalog: {
    published: number;
    new7: number;
    new_prev7: number;
    hidden: number;
    unclassified: number;
    unlabelled: number;
    views: number;
    opens: number;
    jobs: Record<string, number>;
  };
  runs: { id: number; trigger: string; status: string; stats: Record<string, number>; started_at: string; finished_at: string | null }[];
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

export type SocialStatus = "draft" | "approved" | "posting" | "posted" | "skipped" | "failed";

/** picks: the v1 Today's picks digest; spotlight: one resource; applied: how the admin used one in a project */
export type SocialKind = "picks" | "spotlight" | "applied";

export type SocialMetrics = {
  impressions: number | null;
  likes: number | null;
  reposts: number | null;
  replies: number | null;
  quotes: number | null;
  bookmarks: number | null;
  profile_clicks: number | null;
  link_clicks: number | null;
};

export type SocialEditable = "text" | "reply_text" | "mentions" | "scheduled_at" | "highlight" | "headline" | "card_style" | "image_alt" | "images" | "note";

export type SocialDraft = {
  day: string;
  channel?: string;
  slot: number;
  kind: SocialKind;
  text: string;
  reply_text: string | null;
  highlight: string | null;
  slugs: string[];
  mentions: string[];
  image_alt: string | null;
  images?: string[];
  note?: string | null;
  scheduled_at: string;
  headline?: string | null;
  card_style?: CardStyle | null;
};

/** What the three-day review found (migration 20261022000100) */
export type SocialReview = {
  id: number;
  period_start: string;
  period_end: string;
  stats: Record<string, unknown>;
  summary: string;
  guidance: string | null;
  model: string | null;
  cost_usd: number | null;
  created_at: string;
};

/** One X post (migrations 20261015000100, 20261022000100) */
export type SocialPost = SocialMetrics & {
  id: number;
  day: string;
  channel: string;
  slot: number;
  kind: SocialKind;
  status: SocialStatus;
  text: string;
  /** the first reply, which carries the link (so the post itself has none) */
  reply_text: string | null;
  reply_post_id: string | null;
  /** X handles tagged in `text`; posted as written only once an admin approves the post */
  mentions: string[];
  /** applied posts: the admin's notes and screenshots (Blob URLs) */
  note: string | null;
  images: string[];
  scheduled_at: string | null;
  metrics_at: string | null;
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
