import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BellRing } from "lucide-react";
import { markNotificationsRead, openBillingPortal, setEmailAlerts, signOut, startProCheckout, unsaveResource } from "@/app/actions";
import { ApiKeyPanel } from "@/components/api-key-panel";
import { describeChange } from "@/lib/alerts-text";
import { getDict, hasLocale, href } from "@/lib/i18n";
import { proProductId } from "@/lib/polar";
import { ALERTS_PRO_ONLY, LIMITS } from "@/lib/quota";
import { fmtDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
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

  // saved resources and alerts (migration 20261020000200); empty until it is applied, never an error
  const [{ data: notes }, { data: savedRows }, { data: alertPrefs }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, created_at, read_at, resources(slug, name), resource_changes(kind, old_value, new_value)")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("saved_resources").select("created_at, resources(slug, name, type)").order("created_at", { ascending: false }),
    supabase.from("profiles").select("email_alerts").maybeSingle(),
  ]);
  type Note = { id: number; created_at: string; read_at: string | null; resources: { slug: string; name: string } | null; resource_changes: { kind: string; old_value: string | null; new_value: string | null } | null };
  const notifications = ((notes ?? []) as unknown as Note[]).filter((n) => n.resources && n.resource_changes);
  const saved = (savedRows ?? []) as unknown as { created_at: string; resources: { slug: string; name: string; type: string } | null }[];
  const emailOn = alertPrefs?.email_alerts !== false;
  const unread = notifications.filter((n) => !n.read_at).length;

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
              <form action={startProCheckout.bind(null, lang, "/account")}>
                <button className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:opacity-90">{t.account.proUpgrade}</button>
              </form>
            </>
          )}
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <BellRing className="size-4 text-accent" aria-hidden /> {t.alerts.title}
            {unread > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-fg tabular-nums">{unread}</span>}
          </h2>
          {unread > 0 && (
            <form action={markNotificationsRead.bind(null, lang)}>
              <button className="text-sm text-muted hover:text-fg">{t.alerts.markRead}</button>
            </form>
          )}
        </div>
        {!pro && ALERTS_PRO_ONLY ? (
          <p className="mt-2 text-sm text-muted">
            {t.alerts.proOnly.replace("{n}", String(LIMITS.free.saved))}{" "}
            <Link href={href(lang, "/pricing")} className="font-medium text-accent hover:underline">{t.alerts.seePro} →</Link>
          </p>
        ) : notifications.length ? (
          <ul className="mt-3 divide-y divide-line">
            {notifications.map((n) => (
              <li key={n.id} className={cn("flex items-start justify-between gap-3 py-2.5 text-sm", !n.read_at && "font-medium")}>
                <Link href={href(lang, `/r/${n.resources!.slug}`)} className="min-w-0 hover:text-accent">
                  {describeChange(t, lang, n.resources!.name, { kind: n.resource_changes!.kind, old: n.resource_changes!.old_value, new: n.resource_changes!.new_value })}
                </Link>
                <span className="shrink-0 text-xs font-normal text-muted">{fmtDateTime(n.created_at, lang)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">{t.alerts.empty}</p>
        )}
        {pro && (
          <form action={setEmailAlerts.bind(null, lang, !emailOn)} className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-sm">
            <span className="text-muted">{emailOn ? t.alerts.emailOn : t.alerts.emailOff}</span>
            <button className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium hover:bg-soft">{emailOn ? t.alerts.emailTurnOff : t.alerts.emailTurnOn}</button>
          </form>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-semibold">{t.alerts.savedTitle}{saved.length ? <span className="ml-1.5 text-sm font-normal text-muted tabular-nums">· {saved.length}</span> : null}</h2>
        {saved.length ? (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
            {saved.filter((s) => s.resources).map((s) => (
              <li key={s.resources!.slug} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <Link href={href(lang, `/r/${s.resources!.slug}`)} className="truncate font-medium hover:text-accent">{s.resources!.name}</Link>
                <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                  {t.types[s.resources!.type]}
                  <form action={unsaveResource.bind(null, lang, s.resources!.slug, "account")}>
                    <button className="hover:text-fg">{t.alerts.remove}</button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">{t.alerts.savedEmpty}</p>
        )}
      </section>

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
