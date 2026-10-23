import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin";
import { aiCredits } from "@/lib/engine/credits";
import { db } from "@/lib/engine/db";
import { getDict, hasLocale, href } from "@/lib/i18n";
import { daysAgo } from "@/lib/social/compose";
import { isOverdue } from "@/lib/social/publish";
import { RESOURCE_TYPES } from "@/lib/types";
import { adminCopy } from "./copy";
import { AdminNav, type NavItem } from "./nav";
import { pmCopy } from "./pm/content";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children, params }: LayoutProps<"/[lang]/admin">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  if (!(await requireAdmin())) redirect(href(lang, `/login?next=${encodeURIComponent(href(lang, "/admin"))}`));
  const c = adminCopy(lang);
  const p = pmCopy(lang);
  const t = getDict(lang);
  const [counts, credits, posts] = await Promise.all([db.navCounts(), aiCredits(), db.socialPosts(60).catch(() => [])]);
  const social = href(lang, "/admin/social");
  // posts that still need a look: drafts, failures and overdue posts of the last two weeks
  const waiting = posts.filter((p) => p.kind !== "picks" && p.day >= daysAgo(14) && (p.status === "draft" || p.status === "failed" || isOverdue(p))).length;
  const res = href(lang, "/admin/resources");

  const items: NavItem[] = [
    { href: href(lang, "/admin"), label: c.tabs.overview, icon: "overview", exact: true },
    {
      href: res,
      label: c.tabs.resources,
      icon: "library",
      count: counts.total,
      children: RESOURCE_TYPES.map((type) => ({
        href: `${res}?type=${type}`,
        label: t.typesPlural[type],
        icon: type,
        count: counts.by_type[type] ?? 0,
        match: { type },
      })),
    },
    { href: `${res}?stage=unclassified`, label: c.tabs.queued, icon: "review", count: counts.queued, match: { stage: "unclassified" } },
    { href: `${res}?status=hidden`, label: c.tabs.hidden, icon: "hidden", count: counts.hidden, match: { status: "hidden" } },
    { href: href(lang, "/admin/agents"), label: c.tabs.agents, icon: "agents", count: undefined },
    {
      href: social,
      label: c.tabs.social,
      icon: "social",
      exact: true,
      count: waiting,
      tone: "warn",
      children: [
        { href: `${social}/new`, label: c.tabs.socialNew, icon: "write" },
        { href: `${social}/performance`, label: c.tabs.socialPerformance, icon: "performance" },
        { href: `${social}/reviews`, label: c.tabs.socialReviews, icon: "reviews" },
        { href: `${social}/settings`, label: c.tabs.socialSettings, icon: "settings" },
      ],
    },
  ];

  const bizItems: NavItem[] = [
    { href: href(lang, "/admin/billing"), label: c.tabs.billing, icon: "billing" },
    { href: href(lang, "/admin/users"), label: c.tabs.users, icon: "accounts" },
    { href: href(lang, "/admin/payments"), label: c.tabs.payments, icon: "payments" },
  ];

  const pm = href(lang, "/admin/pm");
  const pmItems: NavItem[] = [
    { href: `${pm}/architecture`, label: p.tabs.architecture, icon: "architecture" },
    { href: `${pm}/stack`, label: p.tabs.stack, icon: "stack" },
    { href: `${pm}/roadmap`, label: p.tabs.roadmap, icon: "roadmap" },
    { href: `${pm}/changelog`, label: p.tabs.changelog, icon: "changelog" },
    { href: `${pm}/features`, label: p.tabs.features, icon: "features" },
    { href: `${pm}/picks`, label: p.tabs.picks, icon: "picks" },
  ];

  return (
    <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[230px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
        <Suspense>
          <AdminNav
            sections={[
              { title: c.title, items },
              { title: c.biz.section, items: bizItems },
              { title: p.section, items: pmItems },
            ]}
          />
        </Suspense>
        <div className="mt-4 hidden rounded-xl border border-line bg-card p-3 text-xs lg:block">
          <p className="text-muted">{c.kpi.credit}</p>
          <p className={credits && credits.balance < 2 ? "mt-0.5 text-lg font-semibold text-caution" : "mt-0.5 text-lg font-semibold"}>
            {credits ? `$${credits.balance.toFixed(2)}` : "—"}
          </p>
          {credits && <p className="text-muted">{c.kpi.gatewayUsed}: ${credits.used.toFixed(2)}</p>}
        </div>
        <a href={href(lang)} className="mt-3 hidden px-2.5 text-xs text-muted hover:text-fg lg:block">
          ← {c.tabs.site}
        </a>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
