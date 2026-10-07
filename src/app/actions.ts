"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { href, type Locale } from "@/lib/i18n";
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
