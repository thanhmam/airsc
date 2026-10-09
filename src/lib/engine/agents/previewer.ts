import sharp from "sharp";
import { z } from "zod";
import { generateText, Output } from "ai";
import { put } from "@vercel/blob";
import { PREVIEW_DEFAULT } from "@/lib/engine/settings";
import type { Preview } from "@/lib/types";

/**
 * Previewer agent: finds pictures of real results (screenshots, demo GIFs, output galleries) in a
 * resource's README, asks a cheap vision model which ones show the resource actually working,
 * and stores up to 3 as WebP (full + 16:9 thumbnail) in Vercel Blob.
 */

export type PreviewTarget = { full_name: string; slug: string; default_branch: string };

type Candidate = { url: string; alt: string; score: number };

const README_NAMES = ["README.md", "readme.md", "Readme.md", "README.MD", "README.markdown", "docs/README.md"];

// badges, sponsor buttons, star charts and other images that never show the resource itself
const NOISE =
  /shields\.io|badge|badgen|codecov|coveralls|star-history|starchart|contrib\.rocks|contributors|sponsor|buymeacoffee|ko-fi|patreon|discord|twitter|x\.com\/|producthunt|trendshift|deepwiki|smithery|glama\.ai|mseep|archestra|skills\.sh|visitor|hits\.|komarev|vercel\.com\/button|deploy-button|opencollective|license|actions\/workflows|github\.com\/[^/]+\.png|avatars\.githubusercontent|gravatar|wakatime/i;
const GOOD = /demo|screenshot|screen|example|gallery|result|preview|showcase|output|usage|in-action|before|after|ui|dashboard|recording/i;
const WEAK = /logo|icon|banner|hero|header|cover|social|card|architecture|diagram|flow|overview|stack|qr|wechat|alipay|donate/i;

/** Absolute, fetchable URL for an image reference inside a README */
export function resolveImage(ref: string, fullName: string, branch: string): string | null {
  const src = ref.trim().replace(/^<|>$/g, "").split(/\s+/)[0];
  if (!src || src.startsWith("data:") || src.startsWith("#")) return null;
  try {
    const base = `https://raw.githubusercontent.com/${fullName}/${branch}/`;
    const u = new URL(src.replace(/^\.\//, ""), base);
    // github.com/<owner>/<repo>/blob|raw/<branch>/<path> → raw file
    const m = u.hostname === "github.com" && u.pathname.match(/^\/([^/]+\/[^/]+)\/(?:blob|raw)\/(.+)$/);
    if (m) return `https://raw.githubusercontent.com/${m[1]}/${m[2]}`;
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Only the author's own pictures: files in this repo, or images uploaded to GitHub (user-attachments).
 * Aggregator READMEs link to other projects' images, which would show the wrong thing on this resource's card.
 */
export function isOwnImage(url: string, fullName: string): boolean {
  try {
    const u = new URL(url);
    const repo = `/${fullName.toLowerCase()}/`;
    const path = decodeURIComponent(u.pathname).toLowerCase();
    if (u.hostname === "raw.githubusercontent.com") return path.startsWith(repo);
    if (u.hostname === "media.githubusercontent.com") return path.startsWith(`/media${repo}`);
    if (u.hostname === "github.com") return path.startsWith("/user-attachments/assets/") || path.startsWith(repo);
    return false;
  } catch {
    return false;
  }
}

/** Image references in README order, scored by how likely they show a real result */
export function extractCandidates(md: string, fullName: string, branch: string, max = 4): Candidate[] {
  const found: { ref: string; alt: string }[] = [];
  const text = md.replace(/<!--[\s\S]*?-->/g, "");
  for (const m of text.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) found.push({ ref: m[2], alt: m[1] });
  for (const m of text.matchAll(/<img\b[^>]*>/gi)) {
    const src = m[0].match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if (src) found.push({ ref: src, alt: m[0].match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1] ?? "" });
  }
  // keep README order: earlier images are usually the ones the author wants seen first
  found.sort((a, b) => text.indexOf(a.ref) - text.indexOf(b.ref));

  const seen = new Set<string>();
  const out: Candidate[] = [];
  found.forEach(({ ref, alt }, i) => {
    const url = resolveImage(ref, fullName, branch);
    if (!url || seen.has(url) || !isOwnImage(url, fullName) || NOISE.test(url) || NOISE.test(alt)) return;
    if (/\.svg(\?|$)/i.test(url)) return; // mostly logos, badges and diagrams
    seen.add(url);
    const name = `${alt} ${url.split("/").pop()}`;
    let score = 1 - i * 0.05;
    if (GOOD.test(name)) score += 2;
    if (/\.gif(\?|$)|user-attachments/i.test(url)) score += 1;
    if (WEAK.test(name)) score -= 2;
    out.push({ url, alt, score });
  });
  return out.sort((a, b) => b.score - a.score).slice(0, max);
}

async function readme(t: PreviewTarget): Promise<string | null> {
  for (const name of README_NAMES) {
    const res = await fetch(`https://raw.githubusercontent.com/${t.full_name}/${encodeURIComponent(t.default_branch)}/${name}`, {
      headers: { "User-Agent": "airsc-crawler" },
      signal: AbortSignal.timeout(15_000),
    }).catch(() => null);
    if (res?.ok) return res.text();
  }
  return null;
}

type Loaded = Candidate & { buf: Buffer; width: number; height: number; animated: boolean; frames: number };

/** A still frame: the middle of an animation, since GIF demos often open on an empty screen */
const still = (img: Loaded) => sharp(img.buf, img.frames > 1 ? { page: Math.floor(img.frames / 2) } : {});

/** Downloads a candidate and drops anything too small, too thin or too heavy to be a useful preview */
async function load(c: Candidate): Promise<Loaded | null> {
  try {
    const res = await fetch(c.url, { headers: { "User-Agent": "airsc-crawler" }, signal: AbortSignal.timeout(20_000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || (type && !type.startsWith("image/"))) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 8_000 || buf.length > 15_000_000) return null;
    const meta = await sharp(buf, { animated: true }).metadata();
    const width = meta.width ?? 0;
    const height = meta.pageHeight ?? meta.height ?? 0;
    if (width < 400 || height < 200) return null;
    const ratio = width / height;
    if (ratio > 3.2 || ratio < 0.45) return null; // banners and long scroll captures
    return { ...c, buf, width, height, animated: (meta.pages ?? 1) > 1, frames: meta.pages ?? 1 };
  } catch {
    return null;
  }
}

const verdict = z.object({
  images: z.array(
    z.object({
      index: z.number().int(),
      kind: z.enum(["result", "screenshot", "demo", "diagram", "banner", "logo", "other"]),
      score: z.number().int().min(0).max(10).describe("How well it shows the resource producing a real, concrete result"),
      caption_en: z.string().describe("Max 80 chars: what the image shows"),
      caption_vi: z.string().describe("Natural Vietnamese, max 80 chars"),
    }),
  ),
});

const SYSTEM = `You pick preview images for Airsc, a library of AI agent resources (Claude skills, MCP servers, Claude Code plugins, subagents, Cursor rules).
A good preview shows what the user gets: real output the resource produced (a generated page, slide, chart, image, document), the tool running in an app or terminal, or a before/after.
Classify every image. kind: result = output it produced; screenshot = the tool's UI or a terminal/editor session using it; demo = animated walkthrough; diagram = architecture or flow chart; banner = title art or marketing header; logo = logo or icon.
score 0-10 for how convincingly it shows the resource working (banners, logos and generic diagrams score 0-3). An image that does not clearly belong to THIS resource (another project, a generic sample, an ad, an unrelated gallery) scores 0. Captions are short and factual: never invent features.`;

/** Asks the vision model to rank the candidates; falls back to the README heuristic without a gateway key */
async function judge(name: string, about: string, imgs: Loaded[], model: string) {
  // small JPEG copies (512 px, at most 4) keep the vision call cheap (a middle frame for GIFs)
  const thumbs = await Promise.all(imgs.map((i) => still(i).resize({ width: 512, withoutEnlargement: true }).jpeg({ quality: 60 }).toBuffer()));
  const { output, providerMetadata } = await generateText({
    model,
    output: Output.object({ schema: verdict }),
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: `Resource: ${name}. About: ${about}\nImages in README order, index 0..${imgs.length - 1}. Alt texts: ${JSON.stringify(imgs.map((i) => i.alt))}` },
          ...thumbs.map((image) => ({ type: "image" as const, image, mediaType: "image/jpeg" })),
        ],
      },
    ],
  });
  const cost = Number((providerMetadata?.gateway as { cost?: string } | undefined)?.cost ?? 0);
  return { ranked: (output as z.infer<typeof verdict>).images, cost };
}

export type PreviewStore = (path: string, body: Buffer, contentType: string) => Promise<string>;

/** Public Vercel Blob URL for a stored preview (needs BLOB_READ_WRITE_TOKEN) */
export const blobStore: PreviewStore = async (path, body, contentType) =>
  (await put(path, body, { access: "public", contentType, addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 31_536_000 })).url;

export const PREVIEW_MODEL = () => process.env.AIRSC_MODEL_VISION ?? PREVIEW_DEFAULT;

/**
 * Finds, ranks and stores previews for one resource. Returns [] when the README has nothing that
 * shows the resource working (the card then keeps its text layout).
 */
export async function preview(
  t: PreviewTarget,
  opts: { model?: string; store?: PreviewStore; useVision?: boolean } = {},
): Promise<{ previews: Preview[]; cost: number; considered: number }> {
  const md = await readme(t);
  if (!md) return { previews: [], cost: 0, considered: 0 };
  const loaded = (await Promise.all(extractCandidates(md, t.full_name, t.default_branch).map(load))).filter((x): x is Loaded => !!x);
  if (!loaded.length) return { previews: [], cost: 0, considered: 0 };

  let picks: { img: Loaded; kind: Preview["kind"]; caption: Preview["caption"] }[];
  let cost = 0;
  if (opts.useVision ?? true) {
    const about = md.replace(/!\[[^\]]*\]\([^)]*\)|<[^>]+>|\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
    const { ranked, cost: c } = await judge(t.full_name, about, loaded, opts.model ?? PREVIEW_MODEL());
    cost = c;
    picks = ranked
      .filter((r) => loaded[r.index] && r.score >= 6 && ["result", "screenshot", "demo"].includes(r.kind))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((r) => ({ img: loaded[r.index], kind: r.kind as Preview["kind"], caption: { en: r.caption_en, vi: r.caption_vi } }));
  } else {
    picks = loaded
      .filter((i) => i.score >= 1)
      .slice(0, 3)
      .map((img) => ({ img, kind: img.animated ? "demo" : "screenshot", caption: { en: img.alt, vi: img.alt } }));
  }

  const store = opts.store ?? blobStore;
  const previews: Preview[] = [];
  for (const [i, { img, kind, caption }] of picks.entries()) {
    const base = `previews/${t.slug}/${i}`;
    // animated GIFs stay animated (as WebP) when that stays reasonably small
    let full = await sharp(img.buf, { animated: img.animated }).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    let animated = img.animated;
    if (animated && full.length > 4_000_000) {
      full = await still(img).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
      animated = false;
    }
    const thumb = await still(img).resize({ width: 640, height: 360, fit: "cover", position: "top" }).webp({ quality: 72 }).toBuffer();
    const fm = await sharp(full, { animated }).metadata();
    previews.push({
      src: await store(`${base}.webp`, full, "image/webp"),
      thumb: await store(`${base}-thumb.webp`, thumb, "image/webp"),
      width: fm.width ?? img.width,
      height: fm.pageHeight ?? fm.height ?? img.height,
      kind,
      animated,
      caption,
      source: img.url,
    });
  }
  return { previews, cost, considered: loaded.length };
}
