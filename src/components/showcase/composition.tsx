import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { ShowcaseScene } from "@/lib/types";

export const SCENE_FRAMES = 100;
export const FPS = 30;

const C = {
  bg: "#0d0c14",
  panel: "#16141f",
  fg: "#f2f1f7",
  muted: "#a3a0b5",
  accent: "#8f7bff",
  safe: "#4cc58a",
};

/** Pure enter animation (fade + rise) for an element appearing `delay` frames into a scene */
function enter(frame: number, fps: number, delay = 0) {
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return { opacity: s, transform: `translateY(${interpolate(s, [0, 1], [18, 0])}px)` };
}

function Typed({ text, start = 8, cps = 2.2 }: { text: string; start?: number; cps?: number }) {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.floor((frame - start) * cps));
  return (
    <span>
      {text.slice(0, n)}
      {n < text.length && <span style={{ opacity: frame % 20 < 10 ? 1 : 0 }}>▍</span>}
    </span>
  );
}

function Scene({ scene, index, total, name }: { scene: ShowcaseScene; index: number; total: number; name: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = (delay: number) => enter(frame, fps, delay);
  const head = appear(2);
  const fadeOut = interpolate(frame, [SCENE_FRAMES - 10, SCENE_FRAMES], [1, 0], { extrapolateLeft: "clamp" });
  const big = scene.kind === "hook" || scene.kind === "cta";

  return (
    <AbsoluteFill style={{ background: C.bg, color: C.fg, fontFamily: "var(--font-geist-sans), system-ui, sans-serif", opacity: fadeOut }}>
      <AbsoluteFill style={{ background: `radial-gradient(70% 60% at 50% 0%, ${C.accent}33, transparent)` }} />
      <div style={{ position: "absolute", top: 34, left: 48, right: 48, display: "flex", justifyContent: "space-between", fontSize: 22, color: C.muted }}>
        <span style={{ fontWeight: 600, color: C.fg }}>
          <span style={{ background: C.accent, color: C.bg, borderRadius: 8, padding: "2px 10px", marginRight: 10 }}>A</span>
          Airsc
        </span>
        <span>
          {index + 1}/{total} · {name}
        </span>
      </div>

      <AbsoluteFill style={{ justifyContent: "center", padding: "90px 80px 60px" }}>
        <h2 style={{ ...head, margin: 0, fontSize: big ? 68 : 50, lineHeight: 1.1, fontWeight: 650, letterSpacing: -1 }}>{scene.title}</h2>

        {scene.kind === "ask" ? (
          <div style={{ ...appear(8), marginTop: 36, background: C.panel, border: `2px solid ${C.accent}66`, borderRadius: 22, padding: "26px 30px", fontSize: 32, lineHeight: 1.35 }}>
            <span style={{ color: C.accent, fontWeight: 600 }}>you › </span>
            <Typed text={scene.lines[0] ?? ""} />
          </div>
        ) : scene.kind === "agent" ? (
          <div style={{ marginTop: 34, background: "#08070d", borderRadius: 18, padding: "22px 28px", fontFamily: "var(--font-geist-mono), ui-monospace, monospace", fontSize: 26 }}>
            {scene.lines.map((l, i) => (
              <div key={i} style={{ ...appear(10 + i * 14), margin: "8px 0", color: C.fg }}>
                <span style={{ color: C.accent }}>› </span>
                {l}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 30 }}>
            {scene.lines.map((l, i) => (
              <p key={i} style={{ ...appear(10 + i * 12), margin: "14px 0", fontSize: big ? 34 : 32, lineHeight: 1.35, color: scene.kind === "result" ? C.fg : C.muted }}>
                {scene.kind === "result" && <span style={{ color: C.safe, marginRight: 12 }}>✓</span>}
                {l}
              </p>
            ))}
          </div>
        )}
      </AbsoluteFill>

      <div style={{ position: "absolute", left: 0, bottom: 0, height: 6, background: C.accent, width: `${((index + frame / SCENE_FRAMES) / total) * 100}%` }} />
    </AbsoluteFill>
  );
}

export function Showcase({ scenes, name }: { scenes: ShowcaseScene[]; name: string }) {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {scenes.map((s, i) => (
        <Sequence key={i} from={i * SCENE_FRAMES} durationInFrames={SCENE_FRAMES}>
          <Scene scene={s} index={i} total={scenes.length} name={name} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
