import "server-only";
import { currentUser } from "@/lib/supabase/server";

export const isAdminEmail = (email?: string | null) =>
  !!email &&
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());

export async function requireAdmin() {
  const { user } = await currentUser();
  return isAdminEmail(user?.email) ? user : null;
}
