"use server";

import { revalidatePath } from "next/cache";
import { getRun } from "workflow/api";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/engine/db";
import { MODEL_CHOICES, type EngineSettings } from "@/lib/engine/settings";
import { startEngine, type Preset } from "@/lib/engine/start";

async function guard() {
  if (!(await requireAdmin())) throw new Error("Forbidden");
}

const refresh = () => revalidatePath("/[lang]/admin", "layout");

export async function setStatus(slug: string, status: "published" | "pending" | "hidden") {
  await guard();
  await db.setStatus(slug, status);
  refresh();
}

export async function requeue(slug: string, stage: "curate" | "produce" | "demo") {
  await guard();
  await db.requeue(slug, stage);
  refresh();
}

export async function runPreset(preset: Preset) {
  await guard();
  await startEngine(preset, "manual");
  refresh();
}

export async function cancelRun(runId: string) {
  await guard();
  await getRun(runId).cancel({ cancelReason: "Stopped from /admin" });
  // the workflow is gone, so close its log row here
  const runs = (await db.runs(10)) as { id: number; run_id: string; status: string }[];
  const row = runs.find((r) => r.run_id === runId && r.status === "running");
  if (row) await db.logRun(row.id, { status: "failed", log: [{ at: new Date().toISOString(), msg: "cancelled from /admin" }] });
  refresh();
}

const clamp = (v: FormDataEntryValue | null, min: number, max: number, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && v !== null && v !== "" ? Math.min(max, Math.max(min, n)) : fallback;
};
const model = (v: FormDataEntryValue | null, fallback: string) =>
  MODEL_CHOICES.some((m) => m.id === v) ? String(v) : fallback;

export async function saveSettings(form: FormData) {
  await guard();
  const cur = await db.settings();
  const next: EngineSettings = {
    enabled: form.get("enabled") === "on",
    run_hour_vn: clamp(form.get("run_hour_vn"), 0, 23, cur.run_hour_vn),
    limits: {
      maxNew: clamp(form.get("maxNew"), 0, 500, cur.limits.maxNew),
      maxRefresh: clamp(form.get("maxRefresh"), 0, 500, cur.limits.maxRefresh),
      maxCurate: clamp(form.get("maxCurate"), 0, 2000, cur.limits.maxCurate),
      maxProduce: clamp(form.get("maxProduce"), 0, 500, cur.limits.maxProduce),
      maxDemo: clamp(form.get("maxDemo"), 0, 100, cur.limits.maxDemo),
      maxPages: clamp(form.get("maxPages"), 0, 30, cur.limits.maxPages),
    },
    models: {
      curator: model(form.get("model_curator"), cur.models.curator),
      editor: model(form.get("model_editor"), cur.models.editor),
      producer: model(form.get("model_producer"), cur.models.producer),
    },
    budget: {
      run_usd: clamp(form.get("run_usd"), 0, 100, cur.budget.run_usd),
      min_balance_usd: clamp(form.get("min_balance_usd"), 0, 100, cur.budget.min_balance_usd),
    },
  };
  await db.saveSettings(next);
  refresh();
}
