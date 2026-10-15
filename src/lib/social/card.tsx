import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import type { CardStyle, CardTheme } from "@/lib/engine/settings";
import type { Resource } from "@/lib/types";
import { compact } from "@/lib/utils";
import { dayLabel, fallbackHeadline, resolveHighlight, SITE, type PickRow } from "./compose";

/** X shows 16:9 images uncropped in the timeline */
export const CARD = { width: 1200, height: 675 };

/**
 * Card colours. An image cannot read the CSS tokens, so these are their values from globals.css:
 * light = the site's light theme, dark = the always-dark panel (BRAND.md). `scrim` is the bg as r,g,b
 * for the spotlight fade, `dim` the names of the picks that are not featured.
 */
type Palette = { bg: string; panel: string; line: string; fg: string; dim: string; muted: string; accent: string; safe: string; scrim: string; chip: string; chipLine: string };

const PALETTES: Record<CardTheme, Palette> = {
  light: {
    bg: "#fafaf7",
    panel: "#f1f0ea",
    line: "#e6e5df",
    fg: "#111113",
    dim: "#3a3a40",
    muted: "#66666d",
    accent: "#5a3df0",
    safe: "#13764a",
    scrim: "250,250,247",
    chip: "rgba(255,255,255,0.88)",
    chipLine: "#d9d7cf",
  },
  dark: {
    bg: "#0f0f14",
    panel: "#19191e",
    line: "#25252b",
    fg: "#f1f1ee",
    dim: "#c9c9c4",
    muted: "#9a9aa3",
    accent: "#8f7bff",
    safe: "#4cc58a",
    scrim: "15,15,20",
    chip: "rgba(15,15,20,0.7)",
    chipLine: "rgba(241,241,238,0.18)",
  },
};

const TYPE_LABEL: Record<Resource["type"], string> = { skill: "Skill", mcp: "MCP server", agent: "Subagent", rule: "Rule", plugin: "Plugin" };
const HOST = SITE.replace(/^https?:\/\//, "");

type Font = { name: string; data: Buffer; weight: 400 | 600; style: "normal" };

// Geist from Google Fonts (OFL); the logos are the official files from the brand kit
let assets: Promise<{ fonts: Font[]; logos: Record<CardTheme, string> }> | null = null;

function loadAssets() {
  const svg = (b: Buffer) => `data:image/svg+xml;base64,${b.toString("base64")}`;
  assets ??= Promise.all([
    readFile(join(process.cwd(), "src/lib/social/fonts/Geist-Regular.ttf")),
    readFile(join(process.cwd(), "src/lib/social/fonts/Geist-SemiBold.ttf")),
    readFile(join(process.cwd(), "src/lib/social/fonts/GeistMono-Regular.ttf")),
    readFile(join(process.cwd(), "public/brand/airsc-logo.svg")),
    readFile(join(process.cwd(), "public/brand/airsc-logo-dark.svg")),
  ]).then(([regular, semibold, mono, light, dark]) => ({
    fonts: [
      { name: "Geist", data: regular, weight: 400, style: "normal" },
      { name: "Geist", data: semibold, weight: 600, style: "normal" },
      { name: "Geist Mono", data: mono, weight: 400, style: "normal" },
    ],
    logos: { light: svg(light), dark: svg(dark) },
  }));
  return assets;
}

/** Geist has no ★, so the star is drawn (lucide "star" path) */
const Star = ({ color }: { color: string }) => (
  <svg width={17} height={17} viewBox="0 0 24 24" style={{ marginLeft: 6, marginRight: 5 }}>
    <path
      fill={color}
      d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
    />
  </svg>
);

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

type Shot = { src: string; w: number; h: number; caption: string };

/**
 * The pick's real-result image as a JPEG data URI (Satori cannot read WebP): fitted inside w×h, or
 * cropped to fill it from the top (screenshots keep their header) for the full-bleed style.
 */
async function shot(r: PickRow, box: { w: number; h: number }, fit: "inside" | "cover", background: string): Promise<Shot | null> {
  const p = r.previews?.[0];
  if (!p) return null;
  try {
    const res = await fetch(p.src, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const scale = Math.min(box.w / p.width, box.h / p.height);
    const [w, h] = fit === "cover" ? [box.w, box.h] : [Math.round(p.width * scale), Math.round(p.height * scale)];
    const jpg = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(w, h, { fit: fit === "cover" ? "cover" : "fill", position: "top" })
      .flatten({ background })
      .jpeg({ quality: 88 })
      .toBuffer();
    return { src: `data:image/jpeg;base64,${jpg.toString("base64")}`, w, h, caption: p.caption.en };
  } catch {
    return null;
  }
}

type Layout = { day: string; rows: PickRow[]; hi: PickRow | null; img: Shot | null; headline: string; logo: string; c: Palette };

const Kicker = ({ day, c }: { day: string; c: Palette }) => (
  <div style={{ display: "flex", fontFamily: "Geist Mono", fontSize: 18, letterSpacing: 2, color: c.accent }}>
    {`TODAY'S PICKS · ${dayLabel(day).toUpperCase()}`}
  </div>
);

const Safe = ({ c }: { c: Palette }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, color: c.muted }}>
    <div style={{ display: "flex", width: 9, height: 9, borderRadius: 5, background: c.safe }} />
    {`Rated safe · ${HOST}`}
  </div>
);

/** "archify · Skill · ★ 84k · by tt-a1i" under the headline */
const Meta = ({ r, c }: { r: PickRow; c: Palette }) => (
  <div style={{ display: "flex", alignItems: "center", fontSize: 20, color: c.muted }}>
    <span style={{ fontSize: 24, fontWeight: 600, color: c.accent, marginRight: 12 }}>{clip(r.name, 26)}</span>
    {`${TYPE_LABEL[r.type]} · `}
    <Star color={c.muted} />
    {`${compact(r.stars)} · by ${clip(r.owner, 20)}`}
  </div>
);

/** Sonnet's headline beside the real result, the four picks along the bottom */
function Editorial({ day, rows, hi, img, headline, logo, c }: Layout) {
  const size = img ? (headline.length > 44 ? 50 : 58) : headline.length > 44 ? 64 : 76;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: c.bg, color: c.fg, fontFamily: "Geist", padding: "44px 56px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
        <img src={logo} alt="" width={88} height={40} />
        <Safe c={c} />
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 44 }}>
        <div style={{ display: "flex", flexDirection: "column", width: img ? 500 : 1088 }}>
          <Kicker day={day} c={c} />
          <div style={{ display: "flex", marginTop: 18, fontSize: size, fontWeight: 600, lineHeight: 1.06, letterSpacing: -1.8 }}>{headline}</div>
          {hi && (
            <div style={{ display: "flex", marginTop: 24 }}>
              <Meta r={hi} c={c} />
            </div>
          )}
        </div>
        {img && (
          <div style={{ display: "flex", flex: 1, justifyContent: "center" }}>
            <div
              style={{
                display: "flex",
                borderRadius: 16,
                border: `1px solid ${c.line}`,
                overflow: "hidden",
                boxShadow: c === PALETTES.light ? "0 24px 48px -28px rgba(17,17,19,0.35)" : "none",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
              <img src={img.src} alt="" width={img.w} height={img.h} />
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", height: 1, background: c.line, marginBottom: 20 }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {rows.map((r, i) => (
          <div key={r.slug} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: "Geist Mono", fontSize: 16, color: r.slug === hi?.slug ? c.accent : c.muted }}>{`0${i + 1}`}</span>
            <span style={{ fontSize: 21, fontWeight: 600, color: r.slug === hi?.slug ? c.fg : c.dim }}>{clip(r.name, rows.length > 4 ? 15 : 20)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** height of the spotlight's solid top bar (logo), above the image */
const SPOT_TOP = 92;

/** The real result full-bleed under a solid logo bar, fading into the headline and the picks */
function Spotlight({ day, rows, hi, img, headline, logo, c }: Layout) {
  const s = (a: number) => `rgba(${c.scrim},${a})`;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: c.bg, color: c.fg, fontFamily: "Geist" }}>
      {img && (
        // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img
        <img src={img.src} alt="" width={img.w} height={img.h} style={{ position: "absolute", top: SPOT_TOP, left: 0 }} />
      )}
      {/* the image fades into the background well before the headline, so any screenshot keeps the text readable */}
      <div
        style={{
          position: "absolute",
          top: SPOT_TOP,
          left: 0,
          width: CARD.width,
          height: CARD.height - SPOT_TOP,
          display: "flex",
          backgroundImage: `linear-gradient(180deg, ${s(0.05)} 0%, ${s(0.2)} 22%, ${s(0.84)} 40%, ${s(0.97)} 52%, ${s(1)} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: CARD.width,
          height: SPOT_TOP,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 56px",
          background: c.bg,
          borderBottom: `1px solid ${c.line}`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
        <img src={logo} alt="" width={88} height={40} />
        <Safe c={c} />
      </div>
      <div style={{ position: "absolute", left: 56, right: 56, bottom: 44, display: "flex", flexDirection: "column" }}>
        <Kicker day={day} c={c} />
        <div style={{ display: "flex", marginTop: 14, maxWidth: 980, fontSize: headline.length > 44 ? 56 : 64, fontWeight: 600, lineHeight: 1.04, letterSpacing: -2 }}>
          {headline}
        </div>
        {hi && (
          <div style={{ display: "flex", marginTop: 18 }}>
            <Meta r={hi} c={c} />
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
          {rows.map((r, i) => (
            <div
              key={r.slug}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 999,
                border: `1px solid ${r.slug === hi?.slug ? c.accent : c.chipLine}`,
                background: c.chip,
              }}
            >
              <span style={{ fontFamily: "Geist Mono", fontSize: 14, color: r.slug === hi?.slug ? c.accent : c.muted }}>{`0${i + 1}`}</span>
              <span style={{ fontSize: 19, fontWeight: 600, color: c.fg }}>{clip(r.name, 22)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The four picks on the left, the featured pick's real result on the right */
function List({ day, rows, hi, img, logo, c }: Layout) {
  const rowGap = rows.length > 4 ? 14 : 22;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: c.bg, color: c.fg, fontFamily: "Geist", padding: 56 }}>
      <div style={{ display: "flex", flexDirection: "column", width: img ? 470 : "100%", height: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
        <img src={logo} alt="" width={96} height={44} />
        <div style={{ display: "flex", marginTop: 34 }}>
          <Kicker day={day} c={c} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 26, gap: rowGap }}>
          {rows.map((r, i) => {
            const on = r.slug === hi?.slug;
            return (
              <div key={r.slug} style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
                <div style={{ display: "flex", width: 34, paddingTop: 7, fontFamily: "Geist Mono", fontSize: 19, color: on ? c.accent : c.muted }}>
                  {`0${i + 1}`}
                </div>
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", fontSize: 32, fontWeight: 600, letterSpacing: -0.5, color: on ? c.fg : c.dim }}>{clip(r.name, 24)}</div>
                  <div style={{ display: "flex", alignItems: "center", marginTop: 4, fontSize: 19, color: c.muted }}>
                    {`${clip(r.owner, 20)} · ${TYPE_LABEL[r.type]} · `}
                    <Star color={c.muted} />
                    {compact(r.stars)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", marginTop: "auto" }}>
          <Safe c={c} />
        </div>
      </div>
      {img && hi && (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, marginLeft: 30 }}>
          <div style={{ display: "flex", justifyContent: "center", width: 588, borderRadius: 18, border: `1px solid ${c.line}`, background: c.panel, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
            <img src={img.src} alt="" width={img.w} height={img.h} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 18 }}>
            <div style={{ display: "flex", fontSize: 21, fontWeight: 600, color: c.accent }}>{`Featured · ${clip(hi.name, 28)}`}</div>
            <div style={{ display: "flex", marginTop: 4, fontSize: 18, color: c.muted }}>{clip(img.caption || hi.summary || "", 64)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

const BOXES: Record<CardStyle, { w: number; h: number; fit: "inside" | "cover" }> = {
  editorial: { w: 544, h: 380, fit: "inside" },
  spotlight: { w: CARD.width, h: CARD.height - SPOT_TOP, fit: "cover" },
  list: { w: 588, h: 470, fit: "inside" },
};

export type CardOptions = { style?: CardStyle | null; theme?: CardTheme | null; highlight?: string | null; headline?: string | null };

/** The 1200×675 PNG attached to the day's post, in the style and theme chosen in /admin/social */
export async function renderCard(day: string, rows: PickRow[], opts: CardOptions = {}): Promise<Buffer> {
  const { fonts, logos } = await loadAssets();
  const style = opts.style ?? "editorial";
  const theme = opts.theme ?? "light";
  const c = PALETTES[theme];
  const hi = resolveHighlight(rows, opts.highlight);
  const box = BOXES[style];
  const img = hi ? await shot(hi, box, box.fit, c.panel) : null;
  const headline = opts.headline?.trim() || (hi ? fallbackHeadline(hi) : "Four AI agent resources worth installing today.");
  const props: Layout = { day, rows, hi, img, headline, logo: logos[theme], c };
  // a full-bleed card needs its image; without one the editorial layout reads better
  const el = style === "list" ? <List {...props} /> : style === "spotlight" && img ? <Spotlight {...props} /> : <Editorial {...props} />;
  const res = new ImageResponse(el, { ...CARD, fonts });
  return Buffer.from(await res.arrayBuffer());
}
