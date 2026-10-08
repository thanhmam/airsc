import { AbsoluteFill, Audio, Freeze, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { COPY } from "./copy";
import { easeInOut, ramp } from "./motion";
import { Cta } from "./scenes/cta";
import { Grid } from "./scenes/grid";
import { HookA, HookB } from "./scenes/hooks";
import { McpChat, mcpTimes } from "./scenes/mcp";
import { PREVIEW, Preview } from "./scenes/preview";
import { Solution, solutionTimes } from "./scenes/solution";
import { C, SANS } from "./theme";
import { BEATS, DURATION, LOOP_TAIL, type Lang, type Variant } from "./timeline";

export type ShortProps = { variant: Variant; lang: Lang };

/** Violet panel that sweeps across the screen; the scene changes while it covers everything */
function Wipe({ dur }: { dur: number }) {
  const f = useCurrentFrame();
  const half = dur / 2;
  const x =
    f < half
      ? interpolate(f, [0, half], [-112, 0], { easing: easeInOut })
      : interpolate(f, [half, dur], [0, 112], { easing: easeInOut });
  return <AbsoluteFill style={{ background: C.violet, transform: `translateX(${x}%) skewX(-6deg)` }} />;
}

/** Bright flash that fades out right after a hard cut */
function Flash({ dur, color = "#ffffff" }: { dur: number; color?: string }) {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: color, opacity: interpolate(f, [0, dur], [0.85, 0], { extrapolateRight: "clamp" }) }} />;
}

/** One sound effect starting at global frame `at`; `dur` trims it */
function Sfx({ name, at, dur, vol = 0.6 }: { name: string; at: number; dur: number; vol?: number }) {
  return (
    <Sequence from={at} durationInFrames={dur} layout="none">
      <Audio src={staticFile(`video/${name}.wav`)} volume={vol} />
    </Sequence>
  );
}

function TailFade({ children }: { children: React.ReactNode }) {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: ramp(f, 0, LOOP_TAIL - 2) }}>{children}</AbsoluteFill>;
}

/**
 * Airsc 30 s vertical short (1080×1920).
 * Variants share everything after the hook, so they can be A/B tested on the first 3 seconds:
 *   a = fear (random MCP reads your .env)   b = result first (one sentence → a deck)   c = overwhelm (1,000+ tools)
 */
export function AirscShort({ variant, lang }: ShortProps) {
  const t = COPY[lang];
  const sol = solutionTimes(lang);
  const mcp = mcpTimes(lang);
  const S = BEATS.solution;
  const P = BEATS.preview;
  const M = BEATS.mcp;

  // Problem beat: A/B start it at 3 s; C opens on it, so its grid runs from frame 0
  const gridFlag = variant === "c" ? 162 : 72;
  const gridCaptions =
    variant === "c"
      ? [
          { from: 0, to: 90, text: t.hookC.caption },
          { from: 90, to: 152, text: t.problem.c1 },
          { from: 152, to: 240, text: t.problem.c2 },
        ]
      : [
          { from: 0, to: 62, text: t.problem.c1 },
          { from: 62, to: 150, text: t.problem.c2 },
        ];

  return (
    <AbsoluteFill style={{ background: C.night, fontFamily: SANS }}>
      <Audio src={staticFile("video/beat.wav")} volume={0.92} />

      {/* 0–8 s: hook, then the problem */}
      {variant === "c" ? (
        <Sequence durationInFrames={S}>
          <Grid lang={lang} flagAt={gridFlag} captions={gridCaptions} />
        </Sequence>
      ) : (
        <>
          <Sequence durationInFrames={BEATS.problem}>{variant === "a" ? <HookA lang={lang} /> : <HookB lang={lang} />}</Sequence>
          <Sequence from={BEATS.problem} durationInFrames={S - BEATS.problem}>
            <Grid lang={lang} flagAt={gridFlag} captions={gridCaptions} />
          </Sequence>
          <Sequence from={BEATS.problem} durationInFrames={8}>
            <Flash dur={8} />
          </Sequence>
        </>
      )}

      <Sequence from={S} durationInFrames={P - S}>
        <Solution lang={lang} />
      </Sequence>
      <Sequence from={P} durationInFrames={M - P}>
        <Preview lang={lang} />
      </Sequence>
      <Sequence from={M} durationInFrames={BEATS.cta - M}>
        <McpChat lang={lang} />
      </Sequence>
      <Sequence from={BEATS.cta} durationInFrames={DURATION - BEATS.cta}>
        <Cta lang={lang} />
      </Sequence>

      {/* transitions */}
      <Sequence from={S - 12} durationInFrames={24}>
        <Wipe dur={24} />
      </Sequence>
      <Sequence from={P - 10} durationInFrames={20}>
        <Wipe dur={20} />
      </Sequence>
      <Sequence from={M} durationInFrames={8}>
        <Flash dur={8} color="#c4b9ff" />
      </Sequence>
      <Sequence from={BEATS.cta - 10} durationInFrames={20}>
        <Wipe dur={20} />
      </Sequence>

      {/* last frames melt into the first one, so the loop restarts without a jump */}
      <Sequence from={DURATION - LOOP_TAIL} durationInFrames={LOOP_TAIL}>
        <TailFade>
          <Freeze frame={0}>
            {variant === "a" ? <HookA lang={lang} /> : variant === "b" ? <HookB lang={lang} /> : <Grid lang={lang} flagAt={gridFlag} captions={gridCaptions} />}
          </Freeze>
        </TailFade>
      </Sequence>

      {/* sound effects, placed on the frames of the on-screen moments */}
      {variant === "a" && (
        <>
          <Sfx name="typing" at={3} dur={30} vol={0.55} />
          <Sfx name="glitch" at={36} dur={17} vol={0.7} />
          <Sfx name="impact" at={36} dur={60} vol={0.7} />
          <Sfx name="whoosh" at={74} dur={21} vol={0.5} />
        </>
      )}
      {variant === "b" && (
        <>
          <Sfx name="typing" at={4} dur={26} vol={0.55} />
          <Sfx name="pop" at={36} dur={5} vol={0.8} />
          {[52, 57, 62].map((f) => (
            <Sfx key={f} name="pop" at={f} dur={5} vol={0.4} />
          ))}
          <Sfx name="whoosh" at={74} dur={21} vol={0.5} />
        </>
      )}
      {variant === "c" && <Sfx name="whoosh" at={0} dur={21} vol={0.4} />}
      <Sfx name="typing" at={variant === "c" ? 4 : BEATS.problem + 4} dur={40} vol={0.2} />
      <Sfx name="glitch" at={BEATS.problem + gridFlag - (variant === "c" ? 90 : 0)} dur={17} vol={0.6} />
      <Sfx name="pop" at={BEATS.problem + gridFlag - (variant === "c" ? 90 : 0)} dur={5} vol={0.8} />

      <Sfx name="whoosh" at={S - 14} dur={21} vol={0.7} />
      <Sfx name="pop" at={S + 4} dur={5} vol={0.7} />
      <Sfx name="typing" at={S + sol.typeStart} dur={sol.typedEnd - sol.typeStart} vol={0.5} />
      {[0, 1, 2].map((i) => (
        <Sfx key={i} name="ding" at={S + sol.open + 14 + i * 6} dur={21} vol={i === 0 ? 0.25 : 0.4} />
      ))}
      <Sfx name="pop" at={S + sol.click} dur={5} vol={0.8} />

      <Sfx name="whoosh" at={P - 12} dur={21} vol={0.7} />
      <Sfx name="pop" at={P + 6} dur={5} vol={0.7} />
      {[30, 35, 40].map((f) => (
        <Sfx key={f} name="pop" at={P + f} dur={5} vol={0.35} />
      ))}
      <Sfx name="pop" at={P + PREVIEW.click} dur={5} vol={0.8} />
      <Sfx name="typing" at={P + PREVIEW.cmd1} dur={32} vol={0.4} />
      <Sfx name="typing" at={P + PREVIEW.cmd2} dur={24} vol={0.4} />
      <Sfx name="success" at={P + PREVIEW.done} dur={33} vol={0.7} />

      <Sfx name="whoosh" at={M - 4} dur={21} vol={0.5} />
      <Sfx name="typing" at={M + 6} dur={mcp.askEnd - 6} vol={0.45} />
      <Sfx name="pop" at={M + mcp.row} dur={5} vol={0.7} />
      <Sfx name="typing" at={M + mcp.reply} dur={22} vol={0.3} />
      <Sfx name="success" at={M + mcp.done} dur={33} vol={0.7} />

      <Sfx name="whoosh" at={BEATS.cta - 12} dur={21} vol={0.7} />
      <Sfx name="pop" at={BEATS.cta + 3} dur={5} vol={0.8} />
      <Sfx name="pop" at={BEATS.cta + 36} dur={5} vol={0.8} />
      <Sfx name="ding" at={BEATS.cta + 40} dur={21} vol={0.45} />
    </AbsoluteFill>
  );
}
