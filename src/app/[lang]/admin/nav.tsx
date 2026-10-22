"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Blocks, Bot, CalendarDays, ChartColumn, ClipboardCheck, EyeOff, ExternalLink, CreditCard, FileCode2, History, Inbox, Layers, LayoutDashboard, Library, ListChecks, Milestone, Network, PenLine, Plug, Send, Sparkles, SlidersHorizontal, Users, UsersRound, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  count?: number;
  /** extra query params that must match for the item to be active (e.g. type=skill) */
  match?: Record<string, string>;
  exact?: boolean;
  children?: NavItem[];
  tone?: "warn";
};

const ICONS = { overview: LayoutDashboard, library: Library, skill: Sparkles, mcp: Plug, plugin: Blocks, agent: Users, rule: FileCode2, review: Inbox, hidden: EyeOff, agents: Bot, social: Send, write: PenLine, performance: ChartColumn, reviews: ClipboardCheck, settings: SlidersHorizontal, site: ExternalLink, architecture: Network, stack: Layers, roadmap: Milestone, changelog: History, features: ListChecks, picks: CalendarDays, billing: Wallet, accounts: UsersRound, payments: CreditCard } satisfies Record<string, LucideIcon>;

function useActive() {
  const path = usePathname();
  const params = useSearchParams();
  return (item: NavItem) => {
    const base = item.href.split("?")[0];
    const pathOk = item.exact ? path === base : path === base || path.startsWith(`${base}/`);
    if (!pathOk) return false;
    const want = item.match ?? {};
    // the "all" item is active only when no filter it doesn't own is set
    if (!Object.keys(want).length) return !params.get("type") && !params.get("status") && !params.get("stage");
    return Object.entries(want).every(([k, v]) => params.get(k) === v);
  };
}

function Row({ item, active, sub }: { item: NavItem; active: boolean; sub?: boolean }) {
  const Icon = ICONS[item.icon];
  return (
    <Link
      href={item.href}
      className={cn(
        "flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition",
        sub && "lg:ml-5 lg:text-[13px]",
        active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-soft hover:text-fg",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="flex-1 whitespace-nowrap">{item.label}</span>
      {item.count !== undefined && (
        <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", item.tone === "warn" && item.count > 0 ? "bg-caution-soft text-caution" : "text-muted")}>
          {item.count.toLocaleString()}
        </span>
      )}
    </Link>
  );
}

export type NavSection = { title: string; items: NavItem[] };

export function AdminNav({ sections }: { sections: NavSection[] }) {
  const isActive = useActive();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
      {sections.map((section, i) => (
        <div key={section.title} className="contents lg:block lg:space-y-0.5">
          <p className={cn("mb-3 hidden px-2.5 text-xs font-semibold uppercase tracking-wide text-muted lg:block", i > 0 && "mt-6")}>{section.title}</p>
          {section.items.map((item) => (
            <div key={item.href} className="contents lg:block lg:space-y-0.5">
              <Row item={item} active={isActive(item)} />
              {item.children?.map((c) => <Row key={c.href} item={c} active={isActive(c)} sub />)}
            </div>
          ))}
        </div>
      ))}
    </nav>
  );
}
