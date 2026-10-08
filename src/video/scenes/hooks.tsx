import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { COPY } from "../copy";
import { caretOn, pop, ramp, rise, typed, typedDone } from "../motion";
import { C, MONO, SANS } from "../theme";
import type { Lang } from "../timeline";
import { NightBg, Terminal, Words } from "../ui";

/** HOOK A (recommended): fear. A random MCP install quietly goes for your .env. 0–3 s */
export function HookA({ lang }: { lang: Lang }) {
  const frame = useCurrentFrame();
  const t = COPY[lang];
  const size = lang === "vi" ? 100 : 80;

  const L1 = "$ claude mcp add fast-helper \\";
  const L2 = "    npx some-user/fast-helper-mcp";
  const R1 = "⚠ reading ~/.env";
  const R2 = "⚠ POST 203.0.113.7 · 3 files";
  const hit = 36;

  const glitching = frame >= hit && frame < hit + 14;
  const sx = glitching ? (random(`hx${frame}`) - 0.5) * 34 : 0;
  const sy = glitching ? (random(`hy${frame}`) - 0.5) * 22 : 0;
  const split = glitching && frame % 2 === 0 ? 9 : 0;
  const flash = interpolate(frame, [hit, hit + 2, hit + 22], [0, 0.34, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const alarm = frame >= hit ? 0.45 + 0.35 * Math.sin((frame - hit) * 0.55) : 0;
  const danger = frame >= hit;

  const l1 = typed(L1, frame, 3, 2);
  const l2 = typed(L2, frame, 18, 2.2);
  const r1 = typed(R1, frame, hit + 2, 1.6);
  const r2 = typed(R2, frame, hit + 14, 1.7);
  const last = frame < 33 ? (l2 ? 2 : 1) : r2 ? 4 : 3;
  const caret = (n: number) => (last === n && caretOn(frame) ? "▍" : "");

  return (
    <AbsoluteFill>
      <NightBg glow={0.28} />
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
        <div style={{ position: "absolute", top: 285, left: 40, right: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <Words text={t.hookA.l1} from={2} size={size} />
          <Words text={t.hookA.l2} from={7} size={size} chip="danger" />
        </div>

        <div style={{ filter: split ? `drop-shadow(${split}px 0 0 rgba(255,40,80,0.8)) drop-shadow(${-split}px 0 0 rgba(0,210,255,0.8))` : undefined }}>
          <Terminal
            title="terminal"
            border={danger ? C.danger : "rgba(255,255,255,0.12)"}
            style={{
              left: 70,
              top: 790,
              width: 940,
              height: 520,
              boxShadow: danger ? "0 0 110px rgba(255,95,87,0.55)" : "0 40px 120px -30px rgba(90,61,240,0.5)",
            }}
          >
            <div style={{ padding: "30px 34px", fontFamily: MONO, fontSize: 34, lineHeight: "62px", color: C.nightText, whiteSpace: "pre-wrap" }}>
              <div>
                <span style={{ color: C.violet400 }}>{l1.slice(0, 1)}</span>
                {l1.slice(1)}
                {caret(1)}
              </div>
              <div>
                {l2}
                {caret(2)}
              </div>
              <div style={{ color: C.dangerSoft, fontWeight: 600, marginTop: 14 }}>
                {r1}
                {caret(3)}
              </div>
              <div style={{ color: C.dangerSoft, fontWeight: 600 }}>
                {r2}
                {caret(4)}
              </div>
            </div>
          </Terminal>
        </div>
        <div style={{ position: "absolute", top: 1336, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 26, color: C.nightMuted, opacity: ramp(frame, 8, 18) }}>
          · {t.mock} ·
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: C.danger, opacity: flash, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "radial-gradient(90% 60% at 50% 55%, transparent 45%, rgba(255,60,50,0.4))", opacity: alarm, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
}

/** HOOK B: result first. One sentence in, a whole deck out. 0–3 s */
export function HookB({ lang }: { lang: Lang }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = COPY[lang];
  const size = lang === "vi" ? 104 : 88;
  const prompt = t.hookB.prompt;
  const cps = 1.05;
  const sent = typedDone(prompt, 4, cps) + 3;
  const deckAt = sent + 6;
  const deck = pop(frame, fps, deckAt);
  const press = interpolate(frame, [sent, sent + 4, sent + 9], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <NightBg glow={0.4} />
      <div style={{ position: "absolute", top: 285, left: 40, right: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <Words text={t.hookB.l1} from={2} size={size} />
        <Words text={t.hookB.l2} from={7} size={size} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 800,
          left: 70,
          width: 940,
          height: 130,
          borderRadius: 44,
          background: C.night2,
          border: `3px solid ${C.violet400}`,
          boxShadow: "0 0 80px rgba(143,123,255,0.35)",
          display: "flex",
          alignItems: "center",
          padding: "0 30px 0 40px",
          gap: 20,
        }}
      >
        <span style={{ flex: 1, fontFamily: SANS, fontSize: lang === "vi" ? 42 : 36, color: "#fff", whiteSpace: "nowrap", overflow: "hidden" }}>
          {typed(prompt, frame, 4, cps)}
          {frame < sent && caretOn(frame) && <span style={{ color: C.violet400 }}>▍</span>}
        </span>
        <span
          style={{
            width: 78,
            height: 78,
            borderRadius: 39,
            background: C.violet400,
            display: "grid",
            placeItems: "center",
            transform: `scale(${1 - press * 0.2})`,
            boxShadow: press ? "0 0 40px rgba(143,123,255,0.9)" : undefined,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0b0b0d" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5 M5 12l7-7 7 7" />
          </svg>
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          top: 980,
          left: 90,
          width: 900,
          height: 320,
          borderRadius: 32,
          background: "#f6f3ea",
          color: "#141413",
          padding: "32px 40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          opacity: Math.min(1, deck * 1.4),
          transform: `translateY(${(1 - deck) * 90}px) scale(${0.9 + 0.1 * deck})`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 24, letterSpacing: "0.08em", color: "#5c5a52" }}>
          <span>{t.hookB.kicker}</span>
          <span>01</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 54, lineHeight: 1.05, letterSpacing: "-0.03em", ...rise(frame, fps, deckAt + 6, 24) }}>
            {t.hookB.deck[0]}
            <br />
            {t.hookB.deck[1]}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 100, ...rise(frame, fps, deckAt + 12, 24) }}>
            {[30, 48, 40, 68].map((h) => (
              <div key={h} style={{ width: 26, height: h, borderRadius: 5, background: "#141413" }} />
            ))}
            <div style={{ width: 26, height: 100, borderRadius: 5, background: C.violet }} />
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", top: 1330, left: 90, width: 900, display: "flex", gap: 18 }}>
        {[
          { bg: "#f6f3ea", fg: "#5c5a52", bar: "#141413", ring: `0 0 0 4px ${C.violet400}`, w: "70%" },
          { bg: "#1f1c2e", fg: "#b4b3bd", bar: "#f2f1f7", ring: "inset 0 0 0 2px rgba(255,255,255,0.14)", w: "55%" },
          { bg: C.violet, fg: "#ffffff", bar: "#ffffff", ring: "none", w: "80%" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 130,
              borderRadius: 22,
              background: s.bg,
              boxShadow: s.ring,
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              ...rise(frame, fps, deckAt + 16 + i * 4, 30),
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 22, letterSpacing: "0.06em", color: s.fg }}>
              {t.hookB.style} {i + 1}
            </span>
            <span style={{ display: "block", height: 12, width: s.w, borderRadius: 6, background: s.bar }} />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}
