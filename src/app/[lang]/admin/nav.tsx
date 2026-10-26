"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Blocks, Bot, CalendarDays, Gauge, ChartColumn, ChevronDown, ClipboardCheck, EyeOff, ExternalLink, CreditCard, FileCode2, History, Inbox, Layers, LayoutDashboard, Library, ListChecks, ListTodo, Menu, Milestone, Network, PenLine, Plug, Send, Sparkles, SlidersHorizontal, Users, UsersRound, Wallet, type LucideIcon } from "lucide-react";
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

const ICONS = { overview: LayoutDashboard, library: Library, skill: Sparkles, mcp: Plug, plugin: Blocks, agent: Users, rule: FileCode2, review: Inbox, hidden: EyeOff, agents: Bot, engine: Gauge, social: Send, queue: ListTodo, write: PenLine, performance: ChartColumn, reviews: ClipboardCheck, settings: SlidersHorizontal, site: ExternalLink, architecture: Network, stack: Layers, roadmap: Milestone, changelog: History, features: ListChecks, picks: CalendarDays, billing: Wallet, accounts: UsersRound, payments: CreditCard } satisfies Record<string, LucideIcon>;

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

function Count({ item }: { item: NavItem }) {
  if (item.count === undefined) return null;
  return (
    <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", item.tone === "warn" && item.count > 0 ? "bg-caution-soft text-caution" : "text-muted")}>
      {item.count.toLocaleString()}
    </span>
  );
}

function Row({ item, active, sub, onPick }: { item: NavItem; active: boolean; sub?: boolean; onPick?: () => void }) {
  const Icon = ICONS[item.icon];
  return (
    <Link
      href={item.href}
      onClick={onPick}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition lg:py-1.5",
        sub && "ml-5 text-[13px]",
        active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-soft hover:text-fg",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="flex-1 whitespace-nowrap">{item.label}</span>
      <Count item={item} />
    </Link>
  );
}

export type NavSection = { title: string; items: NavItem[] };

/** Every section as a list: the sidebar on wide screens, the open menu on phones */
function Sections({ sections, isActive, onPick }: { sections: NavSection[]; isActive: (item: NavItem) => boolean; onPick?: () => void }) {
  return sections.map((section, i) => (
    <div key={section.title} className="space-y-0.5">
      <p className={cn("mb-3 px-2.5 text-xs font-semibold uppercase tracking-wide text-muted", i > 0 && "mt-6")}>{section.title}</p>
      {section.items.map((item) => (
        <div key={item.href} className="space-y-0.5">
          <Row item={item} active={isActive(item)} onPick={onPick} />
          {item.children?.map((c) => <Row key={c.href} item={c} active={isActive(c)} sub onPick={onPick} />)}
        </div>
      ))}
    </div>
  ));
}

/**
 * The admin menu. Wide screens get the sidebar; phones get one button naming the current page that opens
 * the same list, and under it the pages of the current group (Queue, All posts… or the resource types) as tabs.
 */
export function AdminNav({ sections }: { sections: NavSection[] }) {
  const isActive = useActive();
  const [open, setOpen] = useState(false);
  const items = sections.flatMap((s) => s.items);
  const current = items.flatMap((i) => [i, ...(i.children ?? [])]).find(isActive);
  const group = items.find((i) => i.children?.length && (isActive(i) || i.children.some(isActive)));
  // an exact parent (Social posts) only opens its first child, so its tab would repeat that one
  const tabs = group ? [...(group.exact ? [] : [group]), ...(group.children ?? [])] : [];
  const Icon = current ? ICONS[current.icon] : Menu;

  return (
    <>
      <nav aria-label="Admin" className="hidden flex-col gap-1 lg:flex">
        <Sections sections={sections} isActive={isActive} />
      </nav>

      <div className="lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="admin-menu"
          onClick={() => setOpen(!open)}
          className="flex h-11 w-full items-center gap-2.5 rounded-xl border border-line bg-card px-3 text-sm font-medium"
        >
          <Icon className="size-4 shrink-0 text-accent" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-left">{current?.label ?? sections[0]?.title}</span>
          {current && <Count item={current} />}
          <ChevronDown className={cn("size-4 shrink-0 text-muted transition", open && "rotate-180")} aria-hidden />
        </button>
        {open && (
          <nav id="admin-menu" aria-label="Admin" className="mt-2 rounded-xl border border-line bg-card p-2">
            <Sections sections={sections} isActive={isActive} onPick={() => setOpen(false)} />
          </nav>
        )}
        {!open && group && tabs.length > 0 && (
          <nav aria-label={group.label} className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive(tab) ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm",
                  isActive(tab) ? "border-accent bg-accent-soft font-medium text-accent" : "border-line text-muted hover:text-fg",
                )}
              >
                {tab.label}
                {!!tab.count && <Count item={tab} />}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}
