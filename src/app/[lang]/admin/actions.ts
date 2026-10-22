"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRun } from "workflow/api";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { hasLocale, href } from "@/lib/i18n";
import { syncPolarOrders } from "@/lib/polar";
import { db } from "@/lib/engine/db";
import { CARD_STYLES, CARD_THEMES, type CardStyle, type CardTheme, MODEL_CHOICES, type EngineSettings, PREVIEW_DEFAULT, socialSettings } from "@/lib/engine/settings";
import { startEngine, type Preset } from "@/lib/engine/start";
import { slotTime, vnDay } from "@/lib/social/compose";
import { makeApplied, makeDrafts, rewriteSpotlight } from "@/lib/social/draft";
import { refreshMetrics } from "@/lib/social/metrics";
import { publishPost } from "@/lib/social/publish";
import { runReview } from "@/lib/social/review";
import { whoAmI } from "@/lib/social/x";

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
  const slots = form
    .getAll("x_slot")
    .map(String)
    .filter((v) => v !== "")
    .map(Number);
  await db.saveSettings({
    ...cur,
    social: {
      ...s,
      x_enabled: form.get("x_enabled") === "on",
      x_auto: form.get("x_auto") === "on",
      x_slots_vn: slots,
      x_guidance: String(form.get("x_guidance") ?? s.x_guidance).trim().slice(0, 1500),
      x_card_style: cardStyle(form.get("x_card_style")) ?? s.x_card_style,
      x_card_theme: cardTheme(form.get("x_card_theme")) ?? s.x_card_theme,
    },
  });
  refresh();
}

export type SocialResult = { ok: boolean; error?: string; url?: string };

const cardStyle = (v: unknown) => (CARD_STYLES.includes(v as CardStyle) ? (v as CardStyle) : null);
const cardTheme = (v: unknown) => (CARD_THEMES.includes(v as CardTheme) ? (v as CardTheme) : null);

const fail = (e: unknown): SocialResult => ({ ok: false, error: String((e as Error)?.message ?? e).slice(0, 300) });

/** Every @handle the admin left in the text: a person wrote or approved it, so it may tag */
const handlesIn = (text: string) => [...new Set([...text.matchAll(/(?:^|[^\w@])@(\w{1,15})\b/g)].map((m) => m[1]))];

/** Saves the post and its link reply as edited */
export async function saveSocialPost(id: number, p: { text: string; reply_text: string }): Promise<SocialResult> {
  await guard();
  const text = p.text.trim();
  if (!text) return { ok: false, error: "empty" };
  const saved = await db.updateSocial(id, { text, reply_text: p.reply_text.trim() || null, mentions: handlesIn(text) });
  refresh();
  return saved ? { ok: true } : { ok: false, error: "this post has already gone out" };
}

/** Moves a post to another hour of its day (Vietnam time, :30) */
export async function setSocialTime(id: number, hourVn: number): Promise<SocialResult> {
  await guard();
  const post = (await db.socialPosts(200)).find((p) => p.id === id);
  if (!post || !Number.isInteger(hourVn) || hourVn < 0 || hourVn > 23) return { ok: false, error: "bad post or hour" };
  const saved = await db.updateSocial(id, { scheduled_at: slotTime(post.day, hourVn) });
  refresh();
  return saved ? { ok: true } : { ok: false, error: "this post has already gone out" };
}

/** approved: goes out at its time as written (with its @mentions); draft: back to waiting */
export async function setSocialStatus(id: number, status: "skipped" | "posted" | "failed" | "draft" | "approved"): Promise<SocialResult> {
  await guard();
  await db.setSocialStatus(id, status);
  refresh();
  return { ok: true };
}

export async function postSocialNow(id: number): Promise<SocialResult> {
  await guard();
  const r = await publishPost({ id }, ["draft", "approved", "failed"], { asWritten: true });
  refresh();
  return r.ok ? { ok: true, url: r.url, ...(r.replyError ? { error: r.replyError } : {}) } : { ok: false, error: r.error };
}

/** Write again: a new take on the spotlight's resource, or on `slug` instead */
export async function rewriteSocial(id: number, slug?: string): Promise<SocialResult> {
  await guard();
  const post = (await db.socialPosts(200)).find((p) => p.id === id);
  if (!post || post.kind !== "spotlight") return { ok: false, error: "only spotlights are written again" };
  try {
    const r = await rewriteSpotlight(post, slug?.trim() || null);
    refresh();
    return r.post ? { ok: true } : { ok: false, error: r.error ?? "error" };
  } catch (e) {
    return fail(e);
  }
}

export type CardInput = { style: string; theme: string; headline: string };

/** The card's style and headline; light or dark is one setting for every card */
export async function saveSocialCard(id: number, c: CardInput): Promise<SocialResult> {
  await guard();
  const settings = await db.settings();
  const s = socialSettings(settings);
  const theme = cardTheme(c.theme);
  if (theme && theme !== s.x_card_theme) await db.saveSettings({ ...settings, social: { ...s, x_card_theme: theme } });
  const saved = await db.updateSocial(id, { card_style: cardStyle(c.style) ?? s.x_card_style, headline: c.headline.trim().slice(0, 90) || null });
  refresh();
  return saved ? { ok: true } : { ok: false, error: "this post has already gone out" };
}

/** Drafts today's spotlights now (the engine does it after the daily run) */
export async function draftToday(): Promise<SocialResult> {
  await guard();
  try {
    const r = await makeDrafts(vnDay());
    refresh();
    return r.posts.length ? { ok: true } : { ok: false, error: r.reason ?? "nothing to draft" };
  } catch (e) {
    return fail(e);
  }
}

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/**
 * A new applied post: the resource, the admin's notes, screenshots (uploaded to Blob, or a ready-made
 * Airsc run's images) and the hour it should go out. Sonnet writes it up; it waits as a draft.
 */
export async function createApplied(form: FormData): Promise<SocialResult> {
  await guard();
  try {
    const slug = String(form.get("slug") ?? "").trim();
    const notes = String(form.get("notes") ?? "").trim();
    if (!slug || notes.length < 20) return { ok: false, error: "pick a resource and write a few lines of notes" };
    const day = /^\d{4}-\d{2}-\d{2}$/.test(String(form.get("day"))) ? String(form.get("day")) : vnDay();
    const hourVn = clamp(form.get("hour"), 0, 23, 20);
    const images = form
      .getAll("image_url")
      .map(String)
      .filter((u) => /^https:\/\//.test(u));
    for (const f of form.getAll("file")) {
      if (!(f instanceof File) || !f.size) continue;
      if (!IMAGE_TYPES.has(f.type) || f.size > 4_500_000) return { ok: false, error: `${f.name}: PNG, JPEG, WebP or GIF under 4.5 MB` };
      const ext = f.type.split("/")[1].replace("jpeg", "jpg");
      images.push((await put(`social/${day}/${crypto.randomUUID()}.${ext}`, f, { access: "public", contentType: f.type })).url);
    }
    if (images.length > 1) return { ok: false, error: "One image per post: design a before/after (see docs/x-posts.md)" };
    await makeApplied({ slug, notes, project: String(form.get("project") ?? "").trim() || undefined, images, day, hourVn });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** The review of the last three days, now instead of on schedule */
export async function reviewSocialNow(): Promise<SocialResult> {
  await guard();
  try {
    const r = await runReview({ force: true });
    refresh();
    return r ? { ok: true } : { ok: false, error: "no post went out since the last review" };
  } catch (e) {
    return fail(e);
  }
}

/** Reads the numbers of every post of the last eight days now */
export async function refreshSocialMetrics(): Promise<SocialResult> {
  await guard();
  try {
    const since = Date.now() - 8 * 86_400_000;
    const posts = (await db.socialPosts(200)).filter((p) => p.status === "posted" && p.post_id && p.posted_at && new Date(p.posted_at).getTime() > since);
    const r = await refreshMetrics(posts);
    refresh();
    return { ok: true, error: `${r.updated} posts · ${r.source}` };
  } catch (e) {
    return fail(e);
  }
}

/** Reads the X account the four keys post as, so a 401 can be traced to the keys, not the post */
export async function testXConnection(): Promise<SocialResult & { username?: string }> {
  await guard();
  try {
    const me = await whoAmI();
    return { ok: true, username: me.username };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e).slice(0, 300) };
  }
}

/** Give or take away Pro by hand (a gift, or a refund handled outside Polar). A Polar payment re-syncs on its own */
export async function setUserPro(userId: string, enabled: boolean) {
  await guard();
  await db.setPro(z.uuid().parse(userId), enabled);
  refresh();
}

/** Pull every order from Polar into /admin/payments, then come back with the count */
export async function syncOrders(lang: string) {
  await guard();
  const back = href(hasLocale(lang) ? lang : "en", "/admin/payments");
  let result: string;
  try {
    result = String(await syncPolarOrders());
  } catch (e) {
    console.error("polar order sync failed", e);
    result = "error";
  }
  refresh();
  redirect(`${back}?synced=${result}`);
}
