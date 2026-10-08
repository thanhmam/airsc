/**
 * Shared timing for the Airsc vertical short (shared by the scenes and the music generator).
 * 120 BPM = one beat every 15 frames, so every cut below lands on a beat.
 */
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 900; // 30 s

/** Space TikTok / Shorts / Reels cover with their own UI */
export const SAFE = { top: 250, bottom: 380 };

/** First frame of each beat of the story */
export const BEATS = {
  hook: 0,
  problem: 90, // 3 s
  solution: 240, // 8 s
  preview: 420, // 14 s
  mcp: 630, // 21 s
  cta: 780, // 26 s
} as const;

/** Frames before the end where the last frame fades into the first one, so the video loops cleanly */
export const LOOP_TAIL = 14;

export type Variant = "a" | "b" | "c";
export type Lang = "vi" | "en";

export const sec = (frames: number) => frames / FPS;
