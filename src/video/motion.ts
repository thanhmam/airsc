import { Easing, interpolate, spring } from "remotion";

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

const clampAll = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** 0 → 1 between two frames */
export const ramp = (frame: number, from: number, to: number, easing = easeOut) =>
  interpolate(frame, [from, to], [0, 1], { ...clampAll, easing });

/** Bouncy pop: starts at `delay`, overshoots slightly */
export const pop = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 190, mass: 0.7 } });

/** Smooth, no overshoot */
export const soft = (frame: number, fps: number, delay = 0) => spring({ frame: frame - delay, fps, config: { damping: 200 } });

/** Fade + rise, for text and cards appearing at `delay` */
export const rise = (frame: number, fps: number, delay = 0, dist = 28) => {
  const s = soft(frame, fps, delay);
  return { opacity: s, transform: `translateY(${(1 - s) * dist}px)` } as const;
};

/** First `n` characters of `text` after `start`, typed at `cps` characters per frame */
export const typed = (text: string, frame: number, start: number, cps: number) =>
  text.slice(0, Math.max(0, Math.min(text.length, Math.floor((frame - start) * cps))));

export const typedDone = (text: string, start: number, cps: number) => start + Math.ceil(text.length / cps);

/** Blinking caret: on for 10 frames, off for 10 */
export const caretOn = (frame: number) => frame % 20 < 12;
