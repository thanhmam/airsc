import { loadFont as loadSans } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";

// Geist + Geist Mono, same as the site (see BRAND.md). Both include Vietnamese.
const sans = loadSans("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext", "vietnamese"] });
const mono = loadMono("normal", { weights: ["400", "500", "600"], subsets: ["latin", "latin-ext", "vietnamese"] });

export const SANS = sans.fontFamily;
export const MONO = mono.fontFamily;

/** Brand colours (BRAND.md) plus the always-dark stage colours used on the site */
export const C = {
  paper: "#fafaf7",
  ink: "#111113",
  muted: "#66666d",
  line: "#e6e5df",
  lineStrong: "#d9d7cf",
  soft: "#f1f0ea",
  art: "#f4f2ec",
  violet: "#5a3df0",
  violet400: "#8f7bff",
  violetSoft: "#ece8ff",
  night: "#0f0f14",
  night2: "#16141f",
  night3: "#08070d",
  nightText: "#e8e8ee",
  nightMuted: "#a3a0b5",
  safe: "#13764a",
  safeSoft: "#e3f4ea",
  safeDark: "#4cc58a",
  caution: "#9a5600",
  cautionSoft: "#fdf0dc",
  cautionDark: "#f0a843",
  danger: "#ff5f57",
  dangerSoft: "#f2686d",
};
