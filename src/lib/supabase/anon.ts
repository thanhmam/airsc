import { createClient } from "@supabase/supabase-js";

/** Cookie-less client for public reads and token-guarded RPCs (crawler, webhooks, MCP). */
export function anonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
