import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { OAuthButtons } from "@/components/oauth-buttons";
import { getDict, hasLocale, href } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/login">): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDict(hasLocale(lang) ? lang : "en").nav.signIn, robots: { index: false } };
}

export default async function Login({ params, searchParams }: PageProps<"/[lang]/login">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const { next, error } = await searchParams;
  const safeNext = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  const { user } = await currentUser();
  if (user) redirect(safeNext ?? href(lang, "/account"));
  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-2xl font-semibold tracking-tight">{t.login.title}</h1>
      <p className="mt-2 text-muted">{t.login.sub}</p>
      {error && <p className="mt-6 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{t.login.error}</p>}
      <div className="mt-8">
        <OAuthButtons lang={lang} next={safeNext} labels={{ google: t.login.google, github: t.login.github }} />
      </div>
      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        {t.login.or}
        <span className="h-px flex-1 bg-line" />
      </div>
      <LoginForm lang={lang} next={safeNext} labels={{ email: t.login.email, send: t.login.send, sent: t.login.sent }} />
      <p className="mt-6 text-xs text-muted">{t.home.freeLine}</p>
    </div>
  );
}
