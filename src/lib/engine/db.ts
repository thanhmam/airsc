import { anonClient } from "@/lib/supabase/anon";
import type { Resource } from "@/lib/types";
import type { EngineSettings } from "./settings";

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
