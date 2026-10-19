"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { href, type Locale } from "@/lib/i18n";
import { polar, proProductId } from "@/lib/polar";
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
async function billingUser(lang: Locale) {
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(href(lang, `/login?next=${encodeURIComponent(href(lang, "/account"))}`));
  return data.user;
}

export async function startProCheckout(lang: Locale) {
  const user = await billingUser(lang);
  const product = proProductId();
  const account = href(lang, "/account");
  if (!product) redirect(account);
  const base = await origin();
  let url: string;
  try {
    const checkout = await polar().checkouts.create({
      products: [product],
      external_customer_id: user.id,
      customer_email: user.email,
      success_url: `${base}${account}?upgraded=1`,
      return_url: `${base}${account}`,
    });
    url = checkout.url;
  } catch (e) {
    console.error("polar checkout failed", e);
    redirect(`${account}?billing=error`);
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
