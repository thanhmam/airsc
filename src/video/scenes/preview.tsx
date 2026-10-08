import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COPY } from "../copy";
import { caretOn, easeInOut, pop, ramp, rise, typed } from "../motion";
import { C, MONO, SANS } from "../theme";
import type { Lang } from "../timeline";
import { Captions, Check, NightBg, Pointer, SafetyPill } from "../ui";

const CMD1 = "/plugin marketplace add https://github.com/zarazhangrui/frontend-slides";
const CMD2 = "/plugin install frontend-slides@frontend-slides";

/** Local frames of the key moments (used by the soundtrack in AirscShort) */
export const PREVIEW = { click: 92, switchTo: 96, cmd1: 104, cmd2: 140, done: 170 };

/** 14–21 s: see the result first, then install it. The dark "stage" from Today's picks. */
export function Preview({ lang }: { lang: Lang }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = COPY[lang];
  const p = t.preview;
  const install = frame >= PREVIEW.switchTo;

  const deck = pop(frame, fps, 6);
  const pointerT = ramp(frame, 62, PREVIEW.click - 2, easeInOut);
  const press = interpolate(frame, [PREVIEW.click - 2, PREVIEW.click + 2, PREVIEW.click + 7], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pointerX = interpolate(pointerT, [0, 1], [820, 380]);
  const pointerY = interpolate(pointerT, [0, 1], [760, 318]);
  const c1 = typed(CMD1, frame, PREVIEW.cmd1, 2.4);
  const c2 = typed(CMD2, frame, PREVIEW.cmd2, 2.2);
  const doneAt = PREVIEW.done;
  const done = pop(frame, fps, doneAt);

  return (
    <AbsoluteFill>
      <NightBg glow={0.4} />

      <div
        style={{
          position: "absolute",
          top: 260,
          left: 50,
          width: 980,
          height: 1040,
          borderRadius: 48,
          background: C.night2,
          border: "3px solid rgba(255,255,255,0.12)",
          boxShadow: "0 60px 140px -40px rgba(90,61,240,0.6)",
          overflow: "hidden",
          ...rise(frame, fps, 0, 40),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, height: 112, padding: "0 30px", borderBottom: "2px solid rgba(255,255,255,0.1)" }}>
          {[p.tabResult, p.tabInstall].map((label, i) => {
            const on = (i === 0) === !install;
            return (
              <span
                key={label}
                style={{
                  height: 68,
                  padding: "0 34px",
                  borderRadius: 18,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: SANS,
                  fontWeight: 500,
                  fontSize: 32,
                  background: on ? "rgba(255,255,255,0.14)" : "transparent",
                  color: on ? "#fff" : "#b4b3bd",
                }}
              >
                {label}
              </span>
            );
          })}
          <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 25, color: C.nightMuted, whiteSpace: "nowrap" }}>zarazhangrui/frontend-slides</span>
        </div>

        <div style={{ position: "relative", height: 800 }}>
          {!install ? (
            <div style={{ position: "absolute", inset: 0, padding: "34px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
              <div
                style={{
                  height: 360,
                  borderRadius: 30,
                  background: "#f6f3ea",
                  color: "#141413",
                  padding: "34px 42px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity: Math.min(1, deck * 1.4),
                  transform: `translateY(${(1 - deck) * 70}px) scale(${0.92 + 0.08 * deck})`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 24, letterSpacing: "0.08em", color: "#5c5a52" }}>
                  <span>{t.hookB.kicker}</span>
                  <span>01</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 56, lineHeight: 1.05, letterSpacing: "-0.03em", ...rise(frame, fps, 14, 24) }}>
                    {t.hookB.deck[0]}
                    <br />
                    {t.hookB.deck[1]}
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 110, ...rise(frame, fps, 22, 24) }}>
                    {[30, 48, 40, 70].map((h) => (
                      <div key={h} style={{ width: 28, height: h, borderRadius: 5, background: "#141413" }} />
                    ))}
                    <div style={{ width: 28, height: 110, borderRadius: 5, background: C.violet }} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 18 }}>
                {[
                  { bg: "#f6f3ea", fg: "#5c5a52", bar: "#141413", ring: `0 0 0 4px ${C.violet400}`, w: "70%" },
                  { bg: "#1f1c2e", fg: "#b4b3bd", bar: "#f2f1f7", ring: "inset 0 0 0 2px rgba(255,255,255,0.14)", w: "55%" },
                  { bg: C.violet, fg: "#ffffff", bar: "#ffffff", ring: "none", w: "80%" },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{ flex: 1, height: 150, borderRadius: 22, background: s.bg, boxShadow: s.ring, padding: "22px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between", ...rise(frame, fps, 30 + i * 5, 30) }}
                  >
                    <span style={{ fontFamily: MONO, fontSize: 22, letterSpacing: "0.06em", color: s.fg }}>
                      {t.hookB.style} {i + 1}
                    </span>
                    <span style={{ display: "block", height: 12, width: s.w, borderRadius: 6, background: s.bar }} />
                  </div>
                ))}
              </div>
              <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 14, fontFamily: SANS, fontSize: 30, color: C.safeDark, ...rise(frame, fps, 54, 20) }}>
                <Check size={36} /> {p.deckNote}
              </p>
            </div>
          ) : (
            <div style={{ position: "absolute", inset: 0, padding: "34px 40px", display: "flex", flexDirection: "column", gap: 28 }}>
              <div
                style={{
                  borderRadius: 28,
                  border: "2px solid rgba(255,255,255,0.1)",
                  background: C.night3,
                  padding: "34px 36px",
                  fontFamily: MONO,
                  fontSize: 34,
                  lineHeight: 1.55,
                  color: C.nightText,
                  display: "flex",
                  flexDirection: "column",
                  gap: 22,
                  minHeight: 360,
                }}
              >
                <div style={{ wordBreak: "break-all" }}>
                  <span style={{ color: C.violet400 }}>$ </span>
                  {c1}
                  {c1.length < CMD1.length && caretOn(frame) && "▍"}
                </div>
                {frame >= PREVIEW.cmd2 && (
                  <div style={{ wordBreak: "break-all" }}>
                    <span style={{ color: C.violet400 }}>$ </span>
                    {c2}
                    {c2.length < CMD2.length && caretOn(frame) && "▍"}
                  </div>
                )}
              </div>
              {frame >= doneAt && (
                <div
                  style={{
                    flex: 1,
                    borderRadius: 28,
                    background: "rgba(76,197,138,0.12)",
                    boxShadow: "inset 0 0 0 3px rgba(76,197,138,0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 28,
                    color: C.safeDark,
                    fontFamily: SANS,
                    fontWeight: 700,
                    fontSize: 68,
                    letterSpacing: "-0.03em",
                    opacity: Math.min(1, done * 1.5),
                    transform: `scale(${0.9 + 0.1 * done})`,
                  }}
                >
                  <span style={{ width: 118, height: 118, borderRadius: 59, background: C.safeDark, display: "grid", placeItems: "center", transform: `scale(${done})` }}>
                    <Check size={74} color="#0b0b0d" stroke={3.6} />
                  </span>
                  {p.installed}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 128, padding: "0 40px", borderTop: "2px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 22 }}>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 42, color: "#fff", letterSpacing: "-0.01em" }}>frontend-slides</span>
          <SafetyPill kind="safe" label={t.solution.safe} scale={0.8} />
          <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 25, color: C.nightMuted }}>MIT · ★ 30k</span>
        </div>
      </div>

      {frame >= 60 && frame < PREVIEW.switchTo + 14 && <Pointer x={pointerX} y={pointerY} press={press} opacity={ramp(frame, 60, 68) * (1 - ramp(frame, PREVIEW.switchTo + 6, PREVIEW.switchTo + 14))} />}

      <Captions
        tone="dark"
        items={[
          { from: 4, to: PREVIEW.switchTo, text: p.c1 },
          { from: PREVIEW.switchTo + 4, to: 210, text: p.c2 },
        ]}
      />
    </AbsoluteFill>
  );
}
