import { TriangleAlert } from "lucide-react";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { COPY } from "../copy";
import { pop, ramp } from "../motion";
import { C, MONO, SANS } from "../theme";
import type { Lang } from "../timeline";
import { Captions, NightBg, type Cap } from "../ui";

const PREFIX = ["pdf", "seo", "db", "auth", "git", "chart", "mail", "deploy", "figma", "sql", "doc", "test", "ui", "api", "chat", "data", "code", "image", "voice", "search"];
const SUFFIX = ["mcp", "skill", "kit", "rules", "agent", "helper", "tools", "plugin", "pro", "flow"];
const DOTS = ["#8f7bff", "#6e5bd8", "#b4a8ff", "#5a3df0", "#a3a0b5"];

const CARDS = Array.from({ length: 128 }, (_, i) => ({
  name: `${PREFIX[(i * 7) % PREFIX.length]}-${SUFFIX[(i * 3 + Math.floor(i / PREFIX.length)) % SUFFIX.length]}`,
  stars: `★ ${(random(`s${i}`) * 9.8 + 0.2).toFixed(1)}k`,
  dot: DOTS[i % DOTS.length],
  w1: 55 + Math.floor(random(`a${i}`) * 40),
  w2: 30 + Math.floor(random(`b${i}`) * 45),
}));

const COLS = 4;
const GAP = 20;
const CARD_W = (980 - GAP * (COLS - 1)) / COLS;
const CARD_H = 170;

/**
 * A flood of AI tools: "which one is safe?"
 * Used as hook C (from frame 0) and as the problem beat of hooks A/B (from 3 s).
 * `flagAt` is the local frame the unknown, never-reviewed tool gets picked out.
 */
export function Grid({ lang, flagAt, captions }: { lang: Lang; flagAt: number; captions: Cap[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = COPY[lang].problem;

  const count = Math.round(1000 * ramp(frame, 4, 44, Easing.out(Easing.cubic)));
  const num = count.toLocaleString(lang === "vi" ? "de-DE" : "en-US");
  const scroll = interpolate(frame, [0, flagAt + 45], [0, 3700], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const dim = ramp(frame, flagAt - 2, flagAt + 8);
  const flag = pop(frame, fps, flagAt);
  const shake = frame >= flagAt && frame < flagAt + 8 ? (random(`fs${frame}`) - 0.5) * 16 : 0;

  const rows = useMemo(() => Array.from({ length: Math.ceil(CARDS.length / COLS) }, (_, r) => CARDS.slice(r * COLS, r * COLS + COLS)), []);

  return (
    <AbsoluteFill>
      <NightBg glow={0.3} />

      <div style={{ position: "absolute", top: 262, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 176, lineHeight: 1, letterSpacing: "-0.04em", color: "#fff", fontVariantNumeric: "tabular-nums" }}>
          {num}
          <span style={{ color: C.violet400, opacity: count >= 1000 ? 1 : 0 }}>+</span>
        </div>
        <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 32, color: C.nightMuted, letterSpacing: "0.04em" }}>{t.label}</div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 600,
          left: 50,
          width: 980,
          height: 740,
          overflow: "hidden",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 14%, #000 86%, transparent)",
          maskImage: "linear-gradient(to bottom, transparent, #000 14%, #000 86%, transparent)",
          opacity: 1 - 0.78 * dim,
          filter: dim > 0 ? `blur(${dim * 7}px)` : undefined,
        }}
      >
        <div style={{ transform: `translateY(${-scroll}px)`, display: "flex", flexDirection: "column", gap: GAP, paddingTop: 40 }}>
          {rows.map((row, r) => (
            <div key={r} style={{ display: "flex", gap: GAP }}>
              {row.map((c, k) => {
                const i = r * COLS + k;
                const show = i < 16 ? ramp(frame, i * 1.2, i * 1.2 + 8) : 1;
                return (
                  <div
                    key={k}
                    style={{
                      width: CARD_W,
                      height: CARD_H,
                      borderRadius: 26,
                      background: "rgba(255,255,255,0.06)",
                      border: "2px solid rgba(255,255,255,0.1)",
                      padding: "22px 22px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      opacity: show,
                      transform: `scale(${0.9 + 0.1 * show})`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 16, height: 16, borderRadius: 8, background: c.dot, flex: "none" }} />
                      <span style={{ fontFamily: MONO, fontSize: 25, color: C.nightText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 22, color: C.nightMuted }}>{c.stars}</span>
                    <span style={{ height: 10, width: `${c.w1}%`, borderRadius: 5, background: "rgba(255,255,255,0.14)" }} />
                    <span style={{ height: 10, width: `${c.w2}%`, borderRadius: 5, background: "rgba(255,255,255,0.08)" }} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {frame >= flagAt && (
        <div
          style={{
            position: "absolute",
            top: 800,
            left: 70,
            width: 940,
            height: 300,
            borderRadius: 40,
            background: C.night2,
            border: `6px solid ${C.danger}`,
            boxShadow: "0 0 120px rgba(255,95,87,0.55)",
            display: "flex",
            alignItems: "center",
            gap: 34,
            padding: "0 44px",
            opacity: Math.min(1, flag * 1.5),
            transform: `translateX(${shake}px) scale(${0.8 + 0.2 * flag})`,
          }}
        >
          <TriangleAlert size={128} color={C.danger} strokeWidth={2.2} style={{ flex: "none" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 52, color: "#fff", whiteSpace: "nowrap" }}>{t.flagName}</span>
            <span style={{ fontFamily: SANS, fontSize: 32, color: C.nightMuted }}>{t.flagSub}</span>
            <span
              style={{
                alignSelf: "flex-start",
                marginTop: 4,
                padding: "6px 22px",
                borderRadius: 999,
                background: "rgba(255,95,87,0.2)",
                color: "#ff8a84",
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 30,
              }}
            >
              ⚠ {t.flagChip}
            </span>
          </div>
        </div>
      )}

      <Captions items={captions} tone="dark" />
    </AbsoluteFill>
  );
}
