"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type Slide = {
  src: string;
  width: number;
  height: number;
  caption: string;
  /** short label above the caption, e.g. "Run on Airsc" or "From the author's README" */
  badge: string;
  /** our own Airsc run (accent badge) or the author's README (neutral badge) */
  run: boolean;
};

export type SlideshowCopy = { prev: string; next: string; pause: string; play: string; slide: string; of: string };

// same rhythm as Today's picks (.a-fill draws over 5.6 s)
const TICK = 5600;

/** Auto-advancing gallery of real results; pauses on hover, focus, a hidden tab or reduced motion */
export function Slideshow({ slides, name, c }: { slides: Slide[]; name: string; c: SlideshowCopy }) {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a media query after mount
    setReduce(mq.matches);
    const vis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, []);

  const many = slides.length > 1;
  const auto = many && !hold && !stopped && !reduce && !hidden;
  useEffect(() => {
    if (!auto) return;
    const id = setTimeout(() => setI((n) => (n + 1) % slides.length), TICK);
    return () => clearTimeout(id);
  }, [auto, i, slides.length]);

  if (!slides.length) return null;
  const go = (n: number) => setI((n + slides.length) % slides.length);
  const cur = slides[i];
  const btn = "grid size-8 place-items-center rounded-full border border-line bg-card text-fg transition hover:border-accent/60 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={name}
      className="space-y-3"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
      onKeyDown={(e) => {
        if (!many) return;
        if (e.key === "ArrowLeft") go(i - 1);
        if (e.key === "ArrowRight") go(i + 1);
      }}
    >
      <div className="relative aspect-[16/10] max-w-full overflow-hidden rounded-xl border border-line bg-soft">
        {slides.map((s, n) => (
          <a
            key={s.src}
            href={s.src}
            target="_blank"
            rel="noreferrer"
            aria-hidden={n !== i}
            tabIndex={n === i ? 0 : -1}
            className={cn("absolute inset-0 transition-opacity duration-500", n === i ? "opacity-100" : "pointer-events-none opacity-0")}
          >
            {/* pre-sized WebP, so Next does not optimise them again */}
            <Image
              src={s.src}
              alt={s.caption}
              width={s.width}
              height={s.height}
              unoptimized
              priority={n === 0}
              loading={n === 0 ? undefined : "lazy"}
              className="size-full object-contain"
            />
          </a>
        ))}
        {auto && <span key={i} aria-hidden className="a-fill absolute inset-x-0 bottom-0 h-0.5 bg-accent" />}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="w-full min-w-0 text-sm leading-relaxed sm:w-auto sm:flex-1" aria-live={auto ? "off" : "polite"}>
          <span className={cn("mr-2 rounded-full px-2 py-0.5 text-xs font-medium", cur.run ? "bg-accent-soft text-accent" : "bg-soft text-muted")}>
            {cur.badge}
          </span>
          <span className="text-muted">{cur.caption}</span>
        </p>
        {many && (
          <div className="flex flex-none items-center gap-1.5">
            <button type="button" className={btn} onClick={() => go(i - 1)} aria-label={c.prev}>
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => setStopped((v) => !v)}
              aria-label={stopped || reduce ? c.play : c.pause}
              disabled={reduce}
            >
              {stopped || reduce ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
            </button>
            <button type="button" className={btn} onClick={() => go(i + 1)} aria-label={c.next}>
              <ChevronRight className="size-4" aria-hidden />
            </button>
            <span className="ml-1 font-mono text-xs tabular-nums text-muted">
              {i + 1}/{slides.length}
            </span>
          </div>
        )}
      </div>

      {many && (
        <div className="flex flex-wrap gap-1.5">
          {slides.map((s, n) => (
            <button
              key={s.src}
              type="button"
              onClick={() => go(n)}
              aria-label={`${c.slide} ${n + 1} ${c.of} ${slides.length}`}
              aria-current={n === i}
              className={cn("h-1.5 rounded-full transition-all", n === i ? "w-6 bg-accent" : "w-1.5 bg-line-strong hover:bg-muted")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
