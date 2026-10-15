"use server";

import { revalidatePath } from "next/cache";
import { getRun } from "workflow/api";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/engine/db";
import { CARD_STYLES, type CardStyle, MODEL_CHOICES, type EngineSettings, PREVIEW_DEFAULT, socialSettings } from "@/lib/engine/settings";
import { startEngine, type Preset } from "@/lib/engine/start";
import { loadPicks } from "@/lib/social/compose";
import { artDirect, makeDraft } from "@/lib/social/draft";
import { publishPost } from "@/lib/social/publish";

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
      maxPreview: clamp(form.get("maxPreview"), 0, 1000, cur.limits.maxPreview ?? 40),
      maxPages: clamp(form.get("maxPages"), 0, 30, cur.limits.maxPages),
    },
    models: {
      curator: model(form.get("model_curator"), cur.models.curator),
      editor: model(form.get("model_editor"), cur.models.editor),
      producer: model(form.get("model_producer"), cur.models.producer),
      previewer: model(form.get("model_previewer"), cur.models.previewer ?? PREVIEW_DEFAULT),
    },
    budget: {
      run_usd: clamp(form.get("run_usd"), 0, 100, cur.budget.run_usd),
      min_balance_usd: clamp(form.get("min_balance_usd"), 0, 100, cur.budget.min_balance_usd),
    },
    // edited on /admin/social
    social: cur.social,
  };
  await db.saveSettings(next);
  refresh();
}

// ---------------------------------------------------------------- social posts (/admin/social)

export async function saveSocialSettings(form: FormData) {
  await guard();
  const cur = await db.settings();
  const s = socialSettings(cur);
  await db.saveSettings({
    ...cur,
    social: {
      x_enabled: form.get("x_enabled") === "on",
      x_auto: form.get("x_auto") === "on",
      x_post_hour_vn: clamp(form.get("x_post_hour_vn"), 0, 23, s.x_post_hour_vn),
      x_card_style: cardStyle(form.get("x_card_style")) ?? s.x_card_style,
    },
  });
  refresh();
}

export type SocialResult = { ok: boolean; error?: string; url?: string };

const cardStyle = (v: unknown) => (CARD_STYLES.includes(v as CardStyle) ? (v as CardStyle) : null);

export type CardInput = { style: string; highlight: string; headline: string };

/**
 * Saves the card's style, featured pick and headline. Without a headline (Regenerate image) Sonnet
 * writes a new one for the featured pick, different from the current one.
 */
export async function saveSocialCard(day: string, c: CardInput, regenerate = false): Promise<SocialResult> {
  await guard();
  const post = await db.socialPost(day);
  if (!post) return { ok: false, error: "no draft for this day" };
  const style = cardStyle(c.style) ?? socialSettings(await db.settings()).x_card_style;
  const r = await artDirect(day, await loadPicks(day), post, {
    style,
    highlight: c.highlight || null,
    headline: regenerate ? null : c.headline.trim().slice(0, 90),
  });
  refresh();
  return r.post ? { ok: true } : { ok: false, error: "this post has already gone out" };
}

export async function saveSocialText(id: number, text: string): Promise<SocialResult> {
  await guard();
  if (!text.trim()) return { ok: false, error: "empty" };
  await db.updateSocialText(id, text.trim());
  refresh();
  return { ok: true };
}

/** Writes (or rewrites) the draft for `day` from its picks */
export async function regenerateSocial(day: string): Promise<SocialResult> {
  await guard();
  const r = await makeDraft(day, { force: true });
  refresh();
  return r.post ? { ok: true } : { ok: false, error: r.reason ?? "no picks" };
}

export async function postSocialNow(id: number): Promise<SocialResult> {
  await guard();
  const r = await publishPost({ id }, ["draft", "failed"]);
  refresh();
  return r.ok ? { ok: true, url: r.url } : { ok: false, error: r.error };
}

/** Skip today's post, or settle one stuck in 'posting' after checking X by hand */
export async function setSocialStatus(id: number, status: "skipped" | "posted" | "failed" | "draft"): Promise<SocialResult> {
  await guard();
  await db.setSocialStatus(id, status);
  refresh();
  return { ok: true };
}
