import "server-only";
import { anonClient } from "@/lib/supabase/anon";

/**
 * Daily limits of the Free tier (Pro is unlimited). `install` = resources whose install options you unlock
 * per day; `mcp` = Airsc MCP tool calls per day. Without an account only the MCP is usable, counted per IP.
 * Start generous and tune from /admin once there is real usage.
 */
export const LIMITS = {
  free: { install: 5, mcp: 30 },
  anon: { install: 2, mcp: 10 },
} as const;

export type Quota = { allowed: boolean; used: number; limit: number | null; pro: boolean; signed_in: boolean; unlocked: boolean };

/** Who is asking: a signed-in user, an Airsc MCP key, or (MCP without a key) a hash of the caller's IP */
export type Who = { user?: string; apiKey?: string; anon?: string };

const OPEN: Quota = { allowed: true, used: 0, limit: null, pro: false, signed_in: false, unlocked: true };

/**
 * Counts one use (unless `consume` is false) and says whether it is allowed. Fails open: if the database
 * cannot be reached the site and the MCP keep working instead of blocking everyone.
 */
export async function quota(kind: "install" | "mcp", who: Who, opts: { slug?: string; consume?: boolean } = {}): Promise<Quota> {
  const { data, error } = await anonClient().rpc("quota_use", {
    p_token: process.env.AIRSC_INGEST_TOKEN!,
    p_kind: kind,
    p_user: who.user ?? null,
    p_api_key: who.apiKey ?? null,
    p_anon: who.anon ?? null,
    p_slug: opts.slug ?? null,
    p_free: LIMITS.free[kind],
    p_anon_limit: LIMITS.anon[kind],
    p_consume: opts.consume ?? true,
  });
  if (error) {
    console.error("quota failed", error.message);
    return OPEN;
  }
  return data as Quota;
}
