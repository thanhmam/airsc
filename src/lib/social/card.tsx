import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import type { Resource } from "@/lib/types";
import { compact } from "@/lib/utils";
import { dayLabel, pickHighlight, SITE, type PickRow } from "./compose";

/** X shows 16:9 images uncropped in the timeline */
export const CARD = { width: 1200, height: 675 };

// always-dark panel colours (BRAND.md)
const C = { bg: "#0f0f14", panel: "#19191e", line: "#25252b", fg: "#f1f1ee", muted: "#9a9aa3", accent: "#8f7bff", safe: "#4cc58a" };
const TYPE_LABEL: Record<Resource["type"], string> = { skill: "Skill", mcp: "MCP server", agent: "Subagent", rule: "Rule", plugin: "Plugin" };
const BOX = { width: 588, height: 470 };

type Font = { name: string; data: Buffer; weight: 400 | 600; style: "normal" };

// Geist from Google Fonts (OFL); the logo is the official dark file from the brand kit
let assets: Promise<{ fonts: Font[]; logo: string }> | null = null;

function loadAssets() {
  assets ??= Promise.all([
    readFile(join(process.cwd(), "src/lib/social/fonts/Geist-Regular.ttf")),
    readFile(join(process.cwd(), "src/lib/social/fonts/Geist-SemiBold.ttf")),
    readFile(join(process.cwd(), "src/lib/social/fonts/GeistMono-Regular.ttf")),
    readFile(join(process.cwd(), "public/brand/airsc-logo-dark.svg")),
  ]).then(([regular, semibold, mono, logo]) => ({
    fonts: [
      { name: "Geist", data: regular, weight: 400, style: "normal" },
      { name: "Geist", data: semibold, weight: 600, style: "normal" },
      { name: "Geist Mono", data: mono, weight: 400, style: "normal" },
    ],
    logo: `data:image/svg+xml;base64,${logo.toString("base64")}`,
  }));
  return assets;
}

/** Geist has no ★, so the star is drawn (lucide "star" path) */
const Star = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" style={{ marginLeft: 6, marginRight: 5 }}>
    <path
      fill={C.muted}
      d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
    />
  </svg>
);

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

/** The highlight's real-result image as a JPEG data URI fitted to the box (Satori cannot read WebP) */
async function shot(r: PickRow) {
  const p = r.previews?.[0];
  if (!p) return null;
  try {
    const res = await fetch(p.src, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const scale = Math.min(BOX.width / p.width, BOX.height / p.height);
    const w = Math.round(p.width * scale);
    const h = Math.round(p.height * scale);
    const jpg = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(w * 2, h * 2, { fit: "fill" })
      .flatten({ background: C.panel })
      .jpeg({ quality: 86 })
      .toBuffer();
    return { src: `data:image/jpeg;base64,${jpg.toString("base64")}`, w, h, caption: p.caption.en };
  } catch {
    return null;
  }
}

/** The 1200×675 PNG attached to the day's post: the picks on the left, the highlight's real result on the right */
export async function renderCard(day: string, rows: PickRow[]): Promise<Buffer> {
  const { fonts, logo } = await loadAssets();
  const hi = pickHighlight(rows);
  const img = hi ? await shot(hi) : null;
  const rowGap = rows.length > 4 ? 14 : 22;

  const el = (
    <div style={{ width: "100%", height: "100%", display: "flex", background: C.bg, color: C.fg, fontFamily: "Geist", padding: 56 }}>
      <div style={{ display: "flex", flexDirection: "column", width: img ? 470 : "100%", height: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
        <img src={logo} alt="" width={96} height={44} />
        <div style={{ display: "flex", marginTop: 34, fontFamily: "Geist Mono", fontSize: 19, letterSpacing: 2, color: C.accent }}>
          {`TODAY'S PICKS · ${dayLabel(day).toUpperCase()}`}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 26, gap: rowGap }}>
          {rows.map((r, i) => {
            const on = r.slug === hi?.slug;
            return (
              <div key={r.slug} style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
                <div style={{ display: "flex", width: 34, paddingTop: 7, fontFamily: "Geist Mono", fontSize: 19, color: on ? C.accent : C.muted }}>
                  {`0${i + 1}`}
                </div>
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", fontSize: 32, fontWeight: 600, letterSpacing: -0.5, color: on ? C.fg : "#d6d6d1" }}>{clip(r.name, 24)}</div>
                  <div style={{ display: "flex", alignItems: "center", marginTop: 4, fontSize: 19, color: C.muted }}>
                    {`${clip(r.owner, 20)} · ${TYPE_LABEL[r.type]} · `}
                    <Star />
                    {compact(r.stars)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto", fontSize: 19, color: C.muted }}>
          <div style={{ display: "flex", width: 10, height: 10, borderRadius: 5, background: C.safe }} />
          {`Rated safe · ${SITE.replace(/^https?:\/\//, "")}`}
        </div>
      </div>
      {img && hi && (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, marginLeft: 30 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: BOX.width,
              borderRadius: 18,
              border: `1px solid ${C.line}`,
              background: C.panel,
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img */}
            <img src={img.src} alt="" width={img.w} height={img.h} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 18 }}>
            <div style={{ display: "flex", fontSize: 21, fontWeight: 600, color: C.accent }}>{`Featured · ${clip(hi.name, 28)}`}</div>
            <div style={{ display: "flex", marginTop: 4, fontSize: 18, color: C.muted }}>{clip(img.caption || hi.summary || "", 64)}</div>
          </div>
        </div>
      )}
    </div>
  );

  const res = new ImageResponse(el, { ...CARD, fonts });
  return Buffer.from(await res.arrayBuffer());
}
