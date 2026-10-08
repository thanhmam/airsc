import { MousePointer2 } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, ramp } from "./motion";
import { C, MONO, SANS } from "./theme";
import { HEIGHT, SAFE, WIDTH } from "./timeline";

export type Tone = "dark" | "light";
export type Chip = "violet" | "danger";

/** Split "Which are [[safe]]?" into plain words and one highlighted chip */
function tokens(text: string) {
  const out: { t: string; hl: boolean; suffix?: string }[] = [];
  text.split(/(\[\[.+?\]\])/g).forEach((part) => {
    if (!part) return;
    if (part.startsWith("[[")) {
      out.push({ t: part.slice(2, -2), hl: true });
      return;
    }
    const words = part.split(/\s+/).filter(Boolean);
    // punctuation right after a chip ("[[safe]]?") travels with it, never wraps onto its own line
    const last = out[out.length - 1];
    if (last?.hl && !/^\s/.test(part) && words.length) last.suffix = words.shift();
    words.forEach((w) => out.push({ t: w, hl: false }));
  });
  return out;
}

const CHIP: Record<Tone, Record<Chip, { bg: string; fg: string }>> = {
  dark: {
    violet: { bg: "rgba(143,123,255,0.24)", fg: "#c4b9ff" },
    danger: { bg: "rgba(255,95,87,0.2)", fg: "#ff8a84" },
  },
  light: {
    violet: { bg: C.violetSoft, fg: C.violet },
    danger: { bg: "rgba(255,95,87,0.14)", fg: "#d6342c" },
  },
};

/** Big bold words that pop in one after another */
export function Words({
  text,
  from = 0,
  size = 80,
  tone = "dark",
  chip = "violet",
  align = "center",
  gap = 2,
  style,
}: {
  text: string;
  from?: number;
  size?: number;
  tone?: Tone;
  chip?: Chip;
  align?: "center" | "left";
  gap?: number;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const color = tone === "dark" ? "#ffffff" : C.ink;
  const cs = CHIP[tone][chip];
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        alignItems: "center",
        columnGap: size * 0.26,
        rowGap: size * 0.1,
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: "-0.035em",
        color,
        ...style,
      }}
    >
      {tokens(text).map((tk, i) => {
        const s = pop(frame, fps, from + i * gap);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              opacity: Math.min(1, s * 1.6),
              transform: `translateY(${(1 - s) * 34}px) scale(${0.86 + 0.14 * s})`,
            }}
          >
            {tk.hl ? (
              <span style={{ background: cs.bg, color: cs.fg, padding: `0 ${size * 0.2}px ${size * 0.04}px`, borderRadius: size * 0.26 }}>{tk.t}</span>
            ) : (
              tk.t
            )}
            {tk.suffix}
          </span>
        );
      })}
    </div>
  );
}

export type Cap = { from: number; to: number; text: string };

/** Captions sit at the bottom of the safe area, above the platform's own UI */
export function Captions({ items, tone, size = 76 }: { items: Cap[]; tone: Tone; size?: number }) {
  const frame = useCurrentFrame();
  const active = items.find((c) => frame >= c.from && frame < c.to);
  if (!active) return null;
  const out = 1 - ramp(frame, active.to - 4, active.to);
  return (
    <div
      style={{
        position: "absolute",
        left: 52,
        right: 52,
        bottom: SAFE.bottom + 4,
        height: size * 2.4,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        opacity: out,
      }}
    >
      <Words key={active.from} text={active.text} from={active.from} size={size} tone={tone} />
    </div>
  );
}

export function NightBg({ glow = 0.35 }: { glow?: number }) {
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <AbsoluteFill style={{ background: `radial-gradient(70% 45% at 50% 0%, rgba(90,61,240,${glow}), transparent 70%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.45))" }} />
    </AbsoluteFill>
  );
}

export function PaperBg() {
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(#d6d4cb 2px, transparent 2.5px)",
          backgroundSize: "44px 44px",
          WebkitMaskImage: "linear-gradient(to bottom, #000 10%, transparent 75%)",
          maskImage: "linear-gradient(to bottom, #000 10%, transparent 75%)",
        }}
      />
    </AbsoluteFill>
  );
}

export function Terminal({
  children,
  title = "terminal",
  border = "rgba(255,255,255,0.12)",
  style,
}: {
  children: ReactNode;
  title?: string;
  border?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        background: C.night3,
        border: `3px solid ${border}`,
        borderRadius: 34,
        overflow: "hidden",
        boxShadow: "0 40px 120px -30px rgba(90,61,240,0.5)",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 30px", borderBottom: "2px solid rgba(255,255,255,0.1)" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c }} />
        ))}
        <span style={{ marginLeft: 16, fontFamily: MONO, fontSize: 26, color: C.nightMuted }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export function SafetyPill({ kind, label, scale = 1 }: { kind: "safe" | "caution"; label: string; scale?: number }) {
  const safe = kind === "safe";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10 * scale,
        height: 58 * scale,
        padding: `0 ${22 * scale}px`,
        borderRadius: 999,
        background: safe ? C.safeSoft : C.cautionSoft,
        color: safe ? C.safe : C.caution,
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: 28 * scale,
        whiteSpace: "nowrap",
      }}
    >
      <svg width={30 * scale} height={30 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d={safe ? "M9 12l2 2 4-4" : "M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3 M12 17h.01"} />
      </svg>
      {label}
    </span>
  );
}

/** Mouse pointer that glides to (x, y); `press` squeezes it for a click */
export function Pointer({ x, y, press = 0, opacity = 1 }: { x: number; y: number; press?: number; opacity?: number }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity, transform: `scale(${1 - press * 0.18})`, transformOrigin: "top left", zIndex: 50, filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.35))" }}>
      <MousePointer2 size={78} fill={C.ink} color="#ffffff" strokeWidth={1.6} />
    </div>
  );
}

export function Check({ size = 40, color = C.safeDark, stroke = 3 }: { size?: number; color?: string; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export const CANVAS = { width: WIDTH, height: HEIGHT };
