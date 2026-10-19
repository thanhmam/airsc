import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { openBillingPortal, signOut, startProCheckout } from "@/app/actions";
import { ApiKeyPanel } from "@/components/api-key-panel";
import { getDict, hasLocale, href } from "@/lib/i18n";
import { proProductId } from "@/lib/polar";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { robots: { index: false } };

export default async function Account({ params, searchParams }: PageProps<"/[lang]/account">) {
  const { lang } = await params;
  const { upgraded } = await searchParams;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const { supabase, user } = await currentUser();
  if (!user) redirect(href(lang, `/login?next=${encodeURIComponent(href(lang, "/account"))}`));

  const [{ data: profile }, { data: key }, { data: downloads }] = await Promise.all([
    supabase.from("profiles").select("fulltime").maybeSingle(),
    supabase.from("api_keys").select("prefix").maybeSingle(),
    supabase
      .from("downloads")
      .select("created_at, source, resources(slug, name, type)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const pro = !!profile?.fulltime;
  // the upgrade button only shows once the Pro product is configured in Polar
  const upgradeOffered = !!proProductId();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t.account.title}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <form action={signOut.bind(null, lang)}>
          <button className="text-sm text-muted hover:text-fg">{t.account.signOut}</button>
        </form>
      </div>

      {(pro || upgradeOffered || upgraded) && (
        <section className="mt-8 rounded-2xl border border-line bg-card p-5">
          <h2 className="font-semibold">{t.account.proTitle}</h2>
          {pro ? (
            <>
              <p className="mt-1 mb-4 text-sm text-muted">{t.account.proActive}</p>
              <form action={openBillingPortal.bind(null, lang)}>
                <button className="h-9 rounded-lg border border-line px-4 text-sm font-medium hover:bg-soft">{t.account.proManage}</button>
              </form>
            </>
          ) : upgraded ? (
            <p className="mt-1 text-sm text-muted">{t.account.proPending}</p>
          ) : (
            <>
              <p className="mt-1 mb-4 text-sm text-muted">{t.account.proDesc}</p>
              <form action={startProCheckout.bind(null, lang)}>
                <button className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:opacity-90">{t.account.proUpgrade}</button>
              </form>
            </>
          )}
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-semibold">{t.account.apiKey}</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          {t.account.apiKeyDesc}{" "}
          <Link href={href(lang, "/mcp")} className="text-accent hover:underline">{t.nav.mcp} →</Link>
        </p>
        <ApiKeyPanel
          prefix={key?.prefix ?? null}
          labels={{ generate: t.account.generate, regenerate: t.account.regenerate, keyOnce: t.account.keyOnce, copied: t.resource.copied }}
        />
      </section>

      <section className="mt-8">
        <h2 className="font-semibold">{t.account.downloads}</h2>
        {downloads?.length ? (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
            {(downloads as unknown as { created_at: string; source: string; resources: { slug: string; name: string; type: string } }[]).map((d) => (
              <li key={d.resources.slug + d.created_at} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <Link href={href(lang, `/r/${d.resources.slug}`)} className="truncate font-medium hover:text-accent">
                  {d.resources.name}
                </Link>
                <span className="shrink-0 text-xs text-muted">
                  {t.types[d.resources.type]} · {d.source.toUpperCase()} · {new Date(d.created_at).toLocaleDateString(lang)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">{t.account.noDownloads}</p>
        )}
      </section>
    </div>
  );
}
