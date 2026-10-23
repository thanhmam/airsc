"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { dispatchRefresh } from "@/lib/pm/github";

/** Starts the refresh-architecture workflow on GitHub: Claude runs Archify and opens a pull request with the new snapshot */
export async function refreshArchitecture(): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) throw new Error("Forbidden");
  const r = await dispatchRefresh();
  revalidatePath("/[lang]/admin/pm/architecture", "page");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}
