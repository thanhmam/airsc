import { Blocks, Search, Sparkles } from "lucide-react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Logo } from "@/components/brand/logo";
import { COPY } from "../copy";
import { caretOn, easeInOut, pop, ramp, rise, typed, typedDone } from "../motion";
import { C, MONO, SANS } from "../theme";
import type { Lang } from "../timeline";
import { Captions, PaperBg, Pointer, SafetyPill } from "../ui";

/** Real results for "pitch deck" / "slides" from the Airsc library (labels as listed on the site) */
const ROWS = [
  { name: "open-design", type: "plugin", safety: "caution", stars: "100k" },
  { name: "frontend-slides", type: "plugin", safety: "safe", stars: "30k" },
  { name: "codex-ppt-skill", type: "skill", safety: "safe", stars: "6.4k" },
] as const;

const SEARCH_CPS = { vi: 0.62, en: 0.72 };

/** Frame (local) the typed query is finished; the dropdown opens right after */
export const solutionTimes = (lang: Lang) => {
  const typedEnd = typedDone(COPY[lang].solution.phrase, 18, SEARCH_CPS[lang]);
  const open = typedEnd + 6;
  return { typeStart: 18, typedEnd, open, click: open + 72 };
};

/** 8–14 s: relief. Plain words in, results with safety labels out. */
export function Solution({ lang }: { lang: Lang }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = COPY[lang].solution;
  const { typeStart, open, click } = solutionTimes(lang);

  const logo = pop(frame, fps, 4);
  const focus = ramp(frame, 14, 20);
  const dd = ramp(frame, open, open + 10);
  const picked = frame >= click;
  const pointerT = ramp(frame, open + 44, click - 2, easeInOut);
  const press = interpolate(frame, [click - 2, click + 2, click + 7], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rowTop = 826;
  const rowH = 150;
  const pointerX = interpolate(pointerT, [0, 1], [900, 640]);
  const pointerY = interpolate(pointerT, [0, 1], [1250, rowTop + rowH + 62]);

  return (
    <AbsoluteFill>
      <PaperBg />

      <div style={{ position: "absolute", top: 290, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, logo * 1.5), transform: `scale(${0.8 + 0.2 * logo})` }}>
        <Logo tone="light" style={{ width: 560, height: 257 }} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 640,
          left: 60,
          width: 960,
          height: 130,
          borderRadius: 42,
          background: "#fff",
          border: `3px solid ${focus > 0.5 ? C.violet : C.lineStrong}`,
          boxShadow: `0 0 0 ${10 * focus}px rgba(90,61,240,0.14), 0 40px 70px -40px rgba(17,17,19,0.4)`,
          display: "flex",
          alignItems: "center",
          padding: "0 22px 0 38px",
          gap: 22,
          ...rise(frame, fps, 8, 30),
        }}
      >
        <Search size={54} color={C.muted} strokeWidth={2.2} style={{ flex: "none" }} />
        <span style={{ flex: 1, fontFamily: SANS, fontSize: lang === "vi" ? 42 : 36, color: C.ink, whiteSpace: "nowrap", overflow: "hidden" }}>
          {typed(t.phrase, frame, typeStart, SEARCH_CPS[lang])}
          {frame < open && caretOn(frame) && <span style={{ color: C.violet }}>▍</span>}
        </span>
        <span style={{ flex: "none", height: 88, padding: "0 34px", borderRadius: 28, background: C.violet, color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: 38, display: "grid", placeItems: "center" }}>
          {t.button}
        </span>
      </div>

      {frame >= open && (
        <div
          style={{
            position: "absolute",
            top: rowTop - 18,
            left: 60,
            width: 960,
            height: rowH * 3 + 36,
            borderRadius: 40,
            background: "#fff",
            border: `3px solid ${C.lineStrong}`,
            boxShadow: "0 50px 90px -40px rgba(17,17,19,0.45)",
            overflow: "hidden",
            opacity: dd,
            transform: `translateY(${(1 - dd) * 30}px)`,
          }}
        >
          {ROWS.map((r, i) => {
            const at = open + 4 + i * 6;
            const Icon = r.type === "plugin" ? Blocks : Sparkles;
            const chosen = picked && i === 1;
            const dimmed = picked && i !== 1;
            const badge = pop(frame, fps, at + 10);
            return (
              <div
                key={r.name}
                style={{
                  position: "absolute",
                  top: 18 + i * rowH,
                  left: 0,
                  right: 0,
                  height: rowH,
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  padding: "0 34px",
                  background: chosen ? C.violetSoft : "transparent",
                  boxShadow: chosen ? `inset 0 0 0 4px ${C.violet}` : undefined,
                  opacity: (dimmed ? 0.4 : 1) * ramp(frame, at, at + 8),
                  transform: `translateX(${(1 - ramp(frame, at, at + 10)) * 40}px)`,
                }}
              >
                <span style={{ flex: "none", width: 88, height: 88, borderRadius: 24, background: C.soft, display: "grid", placeItems: "center" }}>
                  <Icon size={44} color={C.ink} strokeWidth={2} />
                </span>
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 40, letterSpacing: "-0.01em", color: C.ink, whiteSpace: "nowrap" }}>{r.name}</span>
                  <span style={{ fontFamily: MONO, fontSize: 25, color: C.muted }}>
                    {r.type === "plugin" ? t.plugin : t.skill} · ★ {r.stars}
                  </span>
                </span>
                <span style={{ flex: "none", opacity: Math.min(1, badge * 1.6), transform: `scale(${0.6 + 0.4 * badge})` }}>
                  <SafetyPill kind={r.safety} label={r.safety === "safe" ? t.safe : t.caution} scale={0.86} />
                </span>
              </div>
            );
          })}
        </div>
      )}

      {frame >= open + 40 && <Pointer x={pointerX} y={pointerY} press={press} opacity={ramp(frame, open + 40, open + 48)} />}

      <Captions
        tone="light"
        items={[
          { from: 8, to: open + 2, text: t.c1 },
          { from: open + 6, to: 180, text: t.c2 },
        ]}
      />
    </AbsoluteFill>
  );
}
