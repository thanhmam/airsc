"use client";

import { Loader2 } from "lucide-react";
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
  headline: string;
  headlineHint: string;
  save: string;
  working: string;
  saved: string;
  alt: string;
};

const btn = "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium transition hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50";

/** A card's picture, full width of its column, with its description and (while the post is waiting) style, colours and headline */
export function CardControls({ post, defaults, c }: { post: SocialPost; defaults: { style: CardStyle; theme: CardTheme }; c: CardCopy }) {
  const saved = { style: post.card_style ?? defaults.style, theme: defaults.theme, headline: post.headline ?? "" };
  const [style, setStyle] = useState<CardStyle>(saved.style);
  const [theme, setTheme] = useState<CardTheme>(saved.theme);
  const [headline, setHeadline] = useState(saved.headline);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const editable = post.status === "draft" || post.status === "approved" || post.status === "failed";
  const dirty = style !== saved.style || theme !== saved.theme || headline.trim() !== saved.headline;

  const save = () =>
    start(async () => {
      const r = await saveSocialCard(post.id, { style, theme, headline });
      setMsg({ ok: r.ok, text: r.ok ? c.saved : (r.error ?? "error") });
    });

  const toggle = <T extends string>(values: readonly T[], value: T, set: (v: T) => void, labels: Record<T, string>) => (
    <div className="flex rounded-lg border border-line p-0.5">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => set(v)}
          aria-pressed={value === v}
          className={cn("h-8 rounded-md px-3 text-sm", value === v ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-fg")}
        >
          {labels[v]}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Image
          src={`/api/social/card/${post.id}?v=${encodeURIComponent(post.updated_at)}&style=${style}&theme=${theme}`}
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
            {toggle(CARD_STYLES, style, setStyle, c.styles)}
            <span className="ml-1 text-muted">{c.theme}</span>
            {toggle(CARD_THEMES, theme, setTheme, c.themes)}
          </div>
          <div className="flex items-end gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
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
                className="h-9 rounded-lg border border-line bg-bg px-3 text-sm outline-none focus:border-accent"
              />
            </label>
            <button className={cn(btn, "border-transparent bg-accent text-accent-fg hover:opacity-90")} disabled={pending || !dirty} onClick={save}>
              {c.save}
            </button>
          </div>
        </>
      )}
      {post.image_alt && (
        <details open className="text-xs text-muted">
          <summary className="cursor-pointer">{c.alt}</summary>
          <p className="mt-1.5 leading-relaxed">{post.image_alt}</p>
        </details>
      )}
      {msg && <p className={cn("text-sm", msg.ok ? "text-safe" : "text-danger")}>{msg.text}</p>}
    </div>
  );
}
