"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getResource } from "@/lib/data";
import { href, type Locale } from "@/lib/i18n";
import { polar, proDiscountId, proOffer, proProductId } from "@/lib/polar";
import { LIMITS, quota } from "@/lib/quota";
import { anonClient } from "@/lib/supabase/anon";
import { serverClient } from "@/lib/supabase/server";

export async function createApiKey(): Promise<{ key?: string; error?: string }> {
  const supabase = await serverClient();
  const { data, error } = await supabase.rpc("create_api_key");
  return error ? { error: error.message } : { key: data as string };
}

async function origin() {
  const h = await headers();
  return process.env.NEXT_PUBLIC_SITE_URL?.startsWith("http://localhost")
    ? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`
    : (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${h.get("host")}`);
}

export async function sendMagicLink(_: unknown, form: FormData): Promise<{ ok: boolean; error?: string }> {
  const email = z.email().safeParse(form.get("email"));
  if (!email.success) return { ok: false, error: "invalid_email" };
  const lang = (form.get("lang") === "vi" ? "vi" : "en") as Locale;
  const next = String(form.get("next") || href(lang, "/account"));
  const supabase = await serverClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

const OAUTH_PROVIDERS = ["google", "github"] as const;

export async function signInWithProvider(form: FormData) {
  const provider = form.get("provider");
  const lang = (form.get("lang") === "vi" ? "vi" : "en") as Locale;
  const nextRaw = String(form.get("next") || href(lang, "/account"));
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : href(lang, "/account");
  if (!OAUTH_PROVIDERS.includes(provider as (typeof OAUTH_PROVIDERS)[number])) redirect(href(lang, "/login"));

  const supabase = await serverClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as (typeof OAUTH_PROVIDERS)[number],
    options: {
      redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}`,
      ...(provider === "google" ? { queryParams: { prompt: "select_account" } } : {}),
    },
  });
  if (error || !data.url) redirect(`${href(lang, "/login")}?error=provider`);
  redirect(data.url);
}

/** Signed-in user only: the Polar customer is the Airsc user id, so the webhook knows whose Pro it is */
async function billingUser(lang: Locale, from: BillingPage = "/account") {
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(href(lang, `/login?next=${encodeURIComponent(href(lang, from))}`));
  return data.user;
}

/** Pages that can start a checkout; where Polar's "back" link and a failed start return to */
type BillingPage = "/account" | "/pricing";

export async function startProCheckout(lang: Locale, from: BillingPage = "/account") {
  const user = await billingUser(lang, from);
  const product = proProductId();
  const account = href(lang, "/account");
  const back = href(lang, from === "/pricing" ? "/pricing" : "/account");
  if (!product) redirect(back);
  const base = await origin();
  // the launch discount only while it is running, so a sold-out or ended offer cannot break checkout
  const discount = (await proOffer())?.launchCents != null ? proDiscountId() : null;
  let url: string;
  try {
    const checkout = await polar().checkouts.create({
      products: [product],
      ...(discount ? { discount_id: discount } : {}),
      external_customer_id: user.id,
      customer_email: user.email,
      success_url: `${base}${account}?upgraded=1`,
      return_url: `${base}${back}`,
    });
    url = checkout.url;
  } catch (e) {
    console.error("polar checkout failed", e);
    redirect(`${back}?billing=error`);
  }
  redirect(url);
}

/** Polar's customer portal: change card, see invoices, cancel */
export async function openBillingPortal(lang: Locale) {
  const user = await billingUser(lang);
  const account = href(lang, "/account");
  const base = await origin();
  let url: string;
  try {
    const session = await polar().customerSessions.create({ external_customer_id: user.id, return_url: `${base}${account}` });
    url = session.customer_portal_url;
  } catch (e) {
    // e.g. Pro granted by hand, so there is no Polar customer yet
    console.error("polar portal failed", e);
    redirect(`${account}?billing=error`);
  }
  redirect(url);
}

/** Spends one of the Free tier's daily unlocks on a resource's install options, then shows the page again */
export async function unlockInstall(lang: Locale, slug: string) {
  const here = href(lang, `/r/${slug}`);
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(href(lang, `/login?next=${encodeURIComponent(here)}`));
  if (!(await getResource(slug))) redirect(href(lang, "/browse"));
  await quota("install", { user: data.user.id }, { slug });
  redirect(here);
}

/** Save a resource (alerts follow for Pro); a free account keeps up to LIMITS.free.saved */
export async function saveResource(lang: Locale, slug: string) {
  const here = href(lang, `/r/${slug}`);
  const supabase = await serverClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(href(lang, `/login?next=${encodeURIComponent(here)}`));
  const { data } = await supabase.rpc("save_resource", { p_slug: slug, p_lang: lang, p_free_limit: LIMITS.free.saved });
  redirect(data?.reason === "limit" ? `${here}?saved=limit` : here);
}

export async function unsaveResource(lang: Locale, slug: string, back: "resource" | "account" = "resource") {
  const supabase = await serverClient();
  await supabase.rpc("unsave_resource", { p_slug: slug });
  redirect(back === "account" ? href(lang, "/account") : href(lang, `/r/${slug}`));
}

export async function markNotificationsRead(lang: Locale) {
  const supabase = await serverClient();
  await supabase.rpc("mark_notifications_read");
  redirect(href(lang, "/account"));
}

export async function setEmailAlerts(lang: Locale, on: boolean) {
  const supabase = await serverClient();
  await supabase.rpc("set_my_email_alerts", { p_on: on });
  redirect(href(lang, "/account"));
}

export async function signOut(lang: Locale) {
  const supabase = await serverClient();
  await supabase.auth.signOut();
  redirect(href(lang));
}

export async function joinTeamWaitlist(_: unknown, form: FormData): Promise<{ ok: boolean }> {
  const email = z.email().safeParse(form.get("email"));
  if (!email.success) return { ok: false };
  const { error } = await anonClient().from("team_waitlist").insert({ email: email.data });
  return { ok: !error || error.code === "23505" };
}
