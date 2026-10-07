"use client";

import Link from "next/link";
import { Coffee } from "lucide-react";

export const DONATE_URL = process.env.NEXT_PUBLIC_DONATE_URL || "";
export const DONATE_AMOUNTS = [2, 5, 10, 20];

/** Slim support bar on every page; the layout pins it to the top together with the header */
export function DonateBar({ text, cta, supportHref }: { text: string; cta: string; supportHref: string }) {
  return (
    <div className="border-b border-line bg-accent-soft text-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-1.5 sm:px-6">
        <Coffee className="size-4 shrink-0 text-accent" aria-hidden />
        <p className="min-w-0 flex-1 truncate">{text}</p>
        <a
          href={DONATE_URL || supportHref}
          target={DONATE_URL ? "_blank" : undefined}
          rel="noreferrer"
          className="shrink-0 rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-accent-fg hover:opacity-90"
        >
          {cta}
        </a>
      </div>
    </div>
  );
}

/** $2–$20 buttons; Ko-fi shows its own amount picker, so each opens the same page */
export function DonateAmounts({ supportHref, className }: { supportHref: string; className?: string }) {
  return (
    <div className={className}>
      <div className="grid grid-cols-4 gap-1.5">
        {DONATE_AMOUNTS.map((a) => (
          <a
            key={a}
            href={DONATE_URL || supportHref}
            target={DONATE_URL ? "_blank" : undefined}
            rel="noreferrer"
            className="rounded-lg border border-line py-1.5 text-center text-sm font-medium tabular-nums hover:border-accent hover:text-accent"
          >
            ${a}
          </a>
        ))}
      </div>
      {!DONATE_URL && (
        <p className="mt-1 text-center text-[11px] text-muted">
          <Link href={supportHref} className="underline">…</Link>
        </p>
      )}
    </div>
  );
}
