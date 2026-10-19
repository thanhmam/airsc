import "server-only";
import { currentUser } from "@/lib/supabase/server";

/** Who is looking and whether they are on Pro (profiles.fulltime, set by the Polar webhook) */
export async function currentPlan() {
  const { supabase, user } = await currentUser();
  if (!user) return { user: null, pro: false };
  const { data } = await supabase.from("profiles").select("fulltime").maybeSingle();
  return { user, pro: !!data?.fulltime };
}
