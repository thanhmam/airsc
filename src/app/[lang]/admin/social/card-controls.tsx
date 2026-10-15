"use client";

import { Loader2, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import type { SocialPost } from "@/lib/engine/db";
import { CARD_STYLES, CARD_THEMES, type CardStyle, type CardTheme } from "@/lib/engine/settings";
import { cn } from "@/lib/utils";
import { saveSocialCard } from "../actions";

export type CardCopy = {
  style: string;
  styles: Record<CardStyle, string>;
  theme: string;
  themes: Record<CardTheme, string>;
  featured: string;
  noImage: string;
  headline: string;
  headlineHint: string;
  save: string;
  regenerate: string;
  working: string;
  saved: string;
};

export type PickOption = { slug: string; name: string; hasImage: boolean };

const btn = "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium transition hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50";

/** The day's card: preview a style instantly, pick the featured resource, edit or regenerate Sonnet's headline */
export function CardControls({
  day,
  post,
  picks,
  defaults,
  c,
}: {
  day: string;
  post: SocialPost;
  picks: PickOption[];
  defaults: { style: CardStyle; theme: CardTheme };
  c: CardCopy;
}) {
  const saved = { style: post.card_style ?? defaults.style, theme: defaults.theme, highlight: post.highlight ?? "", headline: post.headline ?? "" };
  const [style, setStyle] = useState<CardStyle>(saved.style);
  const [theme, setTheme] = useState<CardTheme>(saved.theme);
  const [highlight, setHighlight] = useState(saved.highlight);
  const [headline, setHeadline] = useState(saved.headline);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const editable = post.status === "draft" || post.status === "failed";
  const dirty = style !== saved.style || theme !== saved.theme || highlight !== saved.highlight || headline.trim() !== saved.headline;

  const run = (regenerate: boolean) =>
    start(async () => {
      const r = await saveSocialCard(day, { style, theme, highlight, headline }, regenerate);
      setMsg({ ok: r.ok, text: r.ok ? c.saved : (r.error ?? "error") });
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Image
          src={`/api/social/card/${day}?v=${encodeURIComponent(post.updated_at)}&style=${style}&theme=${theme}`}
          alt={post.image_alt ?? ""}
          width={1200}
          height={675}
          unoptimized
          className={cn("h-auto w-full rounded-xl border border-line transition", pending && "opacity-50")}
        />
        {pending && (
          <span className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-medium">
            <Loader2 className="size-4 animate-spin" aria-hidden /> {c.working}
          </span>
        )}
      </div>
      {editable && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">{c.style}</span>
            <div className="flex rounded-lg border border-line p-0.5">
              {CARD_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  aria-pressed={style === s}
                  className={cn("h-8 rounded-md px-3 text-sm", style === s ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-fg")}
                >
                  {c.styles[s]}
                </button>
              ))}
            </div>
            <span className="ml-2 text-muted">{c.theme}</span>
            <div className="flex rounded-lg border border-line p-0.5">
              {CARD_THEMES.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTheme(k)}
                  aria-pressed={theme === k}
                  className={cn("h-8 rounded-md px-3 text-sm", theme === k ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-fg")}
                >
                  {c.themes[k]}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">{c.featured}</span>
            <select value={highlight} onChange={(e) => setHighlight(e.target.value)} className="h-9 rounded-lg border border-line bg-bg px-2 text-sm">
              {picks.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                  {p.hasImage ? "" : ` (${c.noImage})`}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="flex justify-between text-muted">
              {c.headline}
              <span className={cn("tabular-nums", headline.length > 48 && "text-caution")}>
                {headline.length} · {c.headlineHint}
              </span>
            </span>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={90}
              className="h-10 rounded-lg border border-line bg-bg px-3 text-[15px] outline-none focus:border-accent"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button className={cn(btn, "border-transparent bg-accent text-accent-fg hover:opacity-90")} disabled={pending || !dirty} onClick={() => run(false)}>
              {c.save}
            </button>
            <button className={btn} disabled={pending} onClick={() => run(true)}>
              <RefreshCw className="size-3.5" aria-hidden /> {c.regenerate}
            </button>
          </div>
        </>
      )}
      {msg && <p className={cn("text-sm", msg.ok ? "text-safe" : "text-danger")}>{msg.text}</p>}
    </div>
  );
}
