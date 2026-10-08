"use client";

import { ArrowRight, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SAFETY_ICON, TYPE_ICON } from "@/components/icons";
import { href, type Locale } from "@/lib/i18n";
import { RESOURCE_TYPES, type ResourceType, type Safety } from "@/lib/types";
import { cn, compact } from "@/lib/utils";

type Hit = { slug: string; name: string; owner: string; type: ResourceType; safety: Safety; stars: number; blurb: string };

export type HeroSearchCopy = {
  label: string;
  button: string;
  phrases: string[];
  tryLabel: string;
  tries: string[];
  all: string;
  safeOnly: string;
  result: string;
  results: string;
  forQuery: string;
  noMatch: string;
  noMatchSub: string;
  seeAll: string;
  keysHint: string;
  clear: string;
  types: Record<string, string>;
  typesPlural: Record<string, string>;
  safety: Record<string, string>;
};

/** Search bar whose results open as a dropdown only once the visitor types or picks a suggestion */
export function HeroSearch({ lang, c }: { lang: Locale; c: HeroSearchCopy }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [q, setQ] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [type, setType] = useState<ResourceType | "all">("all");
  const [safeOnly, setSafeOnly] = useState(false);
  const [sel, setSel] = useState(0);
  const [data, setData] = useState<{ key: string; items: Hit[]; total: number } | null>(null);

  const query = q.trim();
  const key = `${query}|${type}|${safeOnly}`;
  const open = query !== "" && !dismissed;
  const loading = open && data?.key !== key;
  const items = data?.items ?? [];

  useEffect(() => {
    if (!query) return;
    const ctl = new AbortController();
    const id = setTimeout(() => {
      const sp = new URLSearchParams({ q: query, lang });
      if (type !== "all") sp.set("type", type);
      if (safeOnly) sp.set("safe", "1");
      fetch(`/api/search?${sp}`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((d: { items: Hit[]; total: number }) => setData({ key, ...d }))
        .catch(() => {});
    }, 160);
    return () => {
      clearTimeout(id);
      ctl.abort();
    };
  }, [query, type, safeOnly, lang, key]);

  // ⌘K / Ctrl+K focuses the search from anywhere on the page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    // clicking anywhere outside the search hides the dropdown; focusing or typing brings it back
    const onDown = (e: PointerEvent) => {
      if (!form.current?.contains(e.target as Node)) setDismissed(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  const browseUrl = () => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (type !== "all") sp.set("type", type);
    if (safeOnly) sp.set("safe", "1");
    const s = sp.toString();
    return href(lang, `/browse${s ? `?${s}` : ""}`);
  };

  const clear = () => {
    setQ("");
    setSel(0);
    setType("all");
    setSafeOnly(false);
    input.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && items.length) {
      e.preventDefault();
      setSel((s) => (Math.min(s, items.length - 1) + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length);
    } else if (e.key === "Escape") {
      clear();
    } else if (e.key === "Enter" && items[sel] && !loading) {
      e.preventDefault();
      router.push(href(lang, `/r/${items[sel].slug}`));
    }
  };

  const cur = Math.min(sel, Math.max(0, items.length - 1));
  let meta = `${c.forQuery} “${query}”`;
  if (type !== "all") meta += ` · ${c.typesPlural[type]}`;
  if (safeOnly) meta += ` · ${c.safeOnly.toLowerCase()}`;
  const total = data?.total ?? 0;

  return (
    <>
      <form
        ref={form}
        action={href(lang, "/browse")}
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(browseUrl());
        }}
        className="relative z-20 mt-9 w-full max-w-[720px] text-left"
      >
        <div className="flex h-[68px] items-center gap-3 rounded-[18px] border border-line-strong bg-card pl-5 pr-2.5 shadow-[0_1px_0_rgba(17,17,19,0.04),0_18px_40px_-24px_rgba(17,17,19,0.3)] transition focus-within:border-accent focus-within:shadow-[0_0_0_4px_rgba(90,61,240,0.16)]">
          <Search className="size-[22px] flex-none text-muted" aria-hidden />
          <div className="relative h-[52px] min-w-0 flex-1">
            <label htmlFor="airsc-q" className="sr-only">{c.label}</label>
            {q === "" && (
              <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden whitespace-nowrap text-base leading-[52px] text-muted sm:text-lg">
                {c.phrases.map((p) => <span key={p} className="ph">{p}</span>)}
              </span>
            )}
            <input
              ref={input}
              id="airsc-q"
              name="q"
              type="text"
              autoComplete="off"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setDismissed(false);
                setSel(0);
              }}
              onKeyDown={onKey}
              onFocus={() => setDismissed(false)}
              role="combobox"
              aria-expanded={open}
              aria-controls="airsc-results"
              className="relative h-[52px] w-full border-0 bg-transparent p-0 text-base outline-none sm:text-lg"
            />
          </div>
          {open && (
            <button type="button" aria-label={c.clear} onClick={clear} className="grid size-9 flex-none place-items-center rounded-[10px] text-muted hover:bg-soft hover:text-fg">
              <X className="size-[18px]" aria-hidden />
            </button>
          )}
          <kbd className="hidden flex-none rounded-md border border-line bg-bg px-[7px] py-[3px] font-mono text-xs text-muted sm:block">⌘K</kbd>
          <button type="submit" className="h-12 flex-none rounded-xl bg-accent px-5 text-[15px] font-medium text-accent-fg hover:opacity-90">
            {c.button}
          </button>
        </div>

        {open && (
          <div
            id="airsc-results"
            className="absolute inset-x-0 top-[calc(100%+8px)] overflow-hidden rounded-2xl border border-line-strong bg-card shadow-[0_28px_60px_-24px_rgba(17,17,19,0.4)] [animation:rise_.18s_both]"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-line bg-bg px-3 py-2.5">
              <div className="flex flex-wrap gap-1.5">
                {(["all", ...RESOURCE_TYPES] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={type === id}
                    onClick={() => {
                      setType(id);
                      setSel(0);
                    }}
                    className={cn(
                      "h-8 whitespace-nowrap rounded-full border px-[11px] text-[13px] font-medium transition",
                      type === id ? "border-fg bg-fg text-bg" : "border-line bg-card hover:border-muted",
                    )}
                  >
                    {id === "all" ? c.all : c.typesPlural[id]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={safeOnly}
                onClick={() => {
                  setSafeOnly((v) => !v);
                  setSel(0);
                }}
                className="inline-flex h-8 items-center gap-2 px-1 text-[13px] font-medium"
              >
                <span>{c.safeOnly}</span>
                <span className={cn("relative h-5 w-9 rounded-full transition-colors", safeOnly ? "bg-safe" : "bg-muted/70")}>
                  <span className={cn("absolute left-0.5 top-0.5 size-4 rounded-full bg-white transition-transform", safeOnly && "translate-x-4")} />
                </span>
              </button>
            </div>

            <div className="flex items-baseline justify-between gap-3 px-4 pb-1.5 pt-3">
              <span className="text-[13px] font-semibold">
                {loading && !data ? "…" : `${total.toLocaleString(lang)} ${total === 1 ? c.result : c.results}`}
              </span>
              <span className="min-w-0 truncate font-mono text-xs text-muted">{meta}</span>
            </div>

            <div className={cn("transition-opacity", loading && "opacity-60")}>
              {items.map((r, i) => {
                const TypeIcon = TYPE_ICON[r.type];
                const SafeIcon = SAFETY_ICON[r.safety];
                return (
                  <a
                    key={r.slug}
                    href={href(lang, `/r/${r.slug}`)}
                    aria-current={i === cur}
                    onMouseEnter={() => setSel(i)}
                    className={cn("flex min-h-[60px] items-center gap-3 px-4 py-2", i === cur ? "bg-accent-soft" : "hover:bg-accent-soft")}
                  >
                    <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-soft">
                      <TypeIcon className="size-[17px]" aria-hidden />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-px">
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="truncate text-[15px] font-semibold tracking-tight">{r.name}</span>
                        <span className="hidden flex-none text-xs text-muted sm:inline">{c.types[r.type]}</span>
                      </span>
                      <span className="truncate text-[13px] text-muted">{r.blurb}</span>
                    </span>
                    <SafePill safety={r.safety} label={c.safety[r.safety]} Icon={SafeIcon} />
                    <span className="hidden w-[54px] flex-none text-right font-mono text-xs text-muted sm:block">★ {compact(r.stars)}</span>
                  </a>
                );
              })}
            </div>

            {!loading && items.length === 0 && (
              <div className="px-4 pb-[18px] pt-3.5">
                <p className="font-medium">{c.noMatch}</p>
                <p className="mt-1 text-[13px] text-muted">{c.noMatchSub}</p>
              </div>
            )}

            <div className="mt-1 flex min-h-[46px] items-center justify-between gap-3 border-t border-line px-4">
              <a href={browseUrl()} className="inline-flex h-11 items-center gap-1.5 text-sm font-medium text-accent">
                <span>{c.seeAll}</span>
                <ArrowRight className="size-[15px]" aria-hidden />
              </a>
              <span className="hidden font-mono text-[11px] text-muted sm:block">{c.keysHint}</span>
            </div>
          </div>
        )}
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="font-mono text-xs text-muted">{c.tryLabel}</span>
        {c.tries.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setQ(label);
              setDismissed(false);
              setSel(0);
              input.current?.focus();
            }}
            className="h-8 rounded-lg border border-line bg-card px-[11px] text-[13px] transition hover:border-accent hover:text-accent"
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

const PILL: Record<Safety, string> = {
  safe: "bg-safe-soft text-safe",
  caution: "bg-caution-soft text-caution",
  danger: "bg-danger-soft text-danger",
};

export function SafePill({ safety, label, Icon }: { safety: Safety; label: string; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <span className={cn("inline-flex h-[22px] flex-none items-center gap-1 rounded-full px-2 text-xs font-medium", PILL[safety])}>
      <Icon className="size-[13px]" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
