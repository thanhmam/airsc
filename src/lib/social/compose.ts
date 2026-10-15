import { z } from "zod";
import { generateObject } from "@/lib/engine/ai";
import { score } from "@/lib/engine/picks";
import { SOCIAL_MODEL } from "@/lib/engine/settings";
import { anonClient } from "@/lib/supabase/anon";
import type { Preview, Resource } from "@/lib/types";
import { compact } from "@/lib/utils";
import { POST_MAX, POST_TARGET, weightedLength } from "./length";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://airsc.vercel.app";
export const PICKS_URL = `${SITE}/en?utm_source=x&utm_medium=social&utm_campaign=todays-picks`;

export type PickRow = Pick<
  Resource,
  "slug" | "name" | "owner" | "type" | "category" | "stars" | "quality" | "first_seen_at" | "summary" | "description" | "use_cases" | "previews"
>;

const TYPE_LABEL: Record<Resource["type"], string> = { skill: "skill", mcp: "MCP server", agent: "subagent", rule: "rule", plugin: "plugin" };

/** Today's date in Vietnam (the day daily_picks are keyed by) */
export const vnDay = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(d);

export const dayLabel = (day: string) =>
  new Date(`${day}T12:00:00+07:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Ho_Chi_Minh" });

/** The picks chosen for `day`, in their homepage order (public data only) */
export async function loadPicks(day: string): Promise<PickRow[]> {
  const sb = anonClient();
  const { data: picks } = await sb.from("daily_picks").select("slugs").eq("day", day).maybeSingle();
  const slugs = (picks?.slugs as string[] | undefined) ?? [];
  if (!slugs.length) return [];
  const { data, error } = await sb
    .from("resources")
    .select("slug,name,owner,type,category,stars,quality,first_seen_at,summary,description,use_cases,previews")
    .in("slug", slugs)
    .neq("safety", "danger");
  if (error) throw new Error(error.message);
  const bySlug = new Map(((data ?? []) as PickRow[]).map((r) => [r.slug, r]));
  return slugs.map((s) => bySlug.get(s)).filter((r): r is PickRow => !!r);
}

/** A still, roughly landscape-to-square image reads well on the card */
export const usable = (p: Preview | undefined) => !!p && !p.animated && p.width / p.height >= 0.75 && p.width / p.height <= 2.2;

/** The pick shown big on the card: the best-scored one with a usable real-result image */
export function pickHighlight(rows: PickRow[]): PickRow | null {
  const now = Date.now();
  return rows.filter((r) => usable(r.previews?.[0])).sort((a, b) => score(b, now) - score(a, now))[0] ?? null;
}

/** The pick an admin chose for the card, else the automatic one */
export const resolveHighlight = (rows: PickRow[], slug?: string | null) => rows.find((r) => r.slug === slug) ?? pickHighlight(rows);

const clip = (s: string, max: number) => {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6)).replace(/[\s,;:.-]+$/, "")}…`;
};

/** One line per pick without the LLM: the first sentence of the Curator's summary */
const fallbackLine = (r: PickRow) => {
  const first = (r.summary ?? r.description ?? "").split(/(?<=\.)\s/)[0].replace(/\.$/, "");
  // "An agent skill that allows …" → "Allows …"
  const verb = first.replace(/^(this|an?|the)\s+(agent\s+)?(skill|plugin|mcp server|server|subagent|rule|tool)s?\s+(that\s+)?/i, "");
  return clip(verb.charAt(0).toUpperCase() + verb.slice(1), 100);
};

export function buildPost(day: string, rows: PickRow[], intro: string, lines: Map<string, string>) {
  const items = rows.map(
    (r, i) => `${i + 1}. ${r.name} (${TYPE_LABEL[r.type]}, ★ ${compact(r.stars)}): ${lines.get(r.slug) || fallbackLine(r)}`,
  );
  const count = ["", "One", "Two", "Three", "Four", "Five", "Six"][rows.length] ?? String(rows.length);
  return [
    `Today's picks on Airsc · ${dayLabel(day)}`,
    intro,
    items.join("\n"),
    `${count} AI agent resources, each rated safe by the Airsc scanner. Install in one click → ${PICKS_URL}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** The card headline without the LLM: the pick's one-liner */
export const fallbackHeadline = (r: PickRow) => clip(fallbackLine(r), 60);

export function imageAlt(day: string, rows: PickRow[], highlight: PickRow | null, headline?: string) {
  const caption = highlight?.previews?.[0]?.caption.en;
  return clip(
    (headline ? `${headline} ` : "") +
      `Airsc Today's picks for ${dayLabel(day)}: ${rows.map((r) => `${r.name} by ${r.owner}`).join(", ")}.` +
      (highlight ? ` Featured: ${highlight.name}${caption ? `, ${caption}` : ""}.` : ""),
    1000,
  );
}

const SYSTEM = `You write the daily X (Twitter) post for Airsc, a safety-checked library of AI agent resources (Claude skills, MCP servers, plugins, subagents, Cursor rules) for vibe coders.
Write from the provided data only. Plain words, concrete outcomes (what you get after installing it), no hype words (game-changer, revolutionary, supercharge), no emoji, no hashtags, no @mentions, no links.`;

const brief = (r: PickRow) => ({
  slug: r.slug,
  name: r.name,
  type: TYPE_LABEL[r.type],
  category: r.category,
  stars: r.stars,
  summary: r.summary ?? r.description,
  use_cases: (r.use_cases ?? []).slice(0, 3).map((u) => u.en),
});

const schema = z.object({
  intro: z.string().describe("One sentence under 120 characters that hooks a developer: what today's set helps them do. Do not repeat 'Today's picks'."),
  lines: z
    .array(z.object({ slug: z.string(), line: z.string().describe("Under 95 characters: what this resource does for you, starting with a verb") }))
    .min(1),
});

/**
 * The post text for `day`: the LLM writes the intro and one line per pick; code builds the frame and
 * link so they are always right. Falls back to the Curator's summaries when the model fails or `ai` is off.
 */
export async function writePost(day: string, rows: PickRow[], model?: string, ai = true) {
  let intro = "";
  const lines = new Map<string, string>();
  let cost = 0;
  let used = "template";
  try {
    if (!ai) throw new Error("AI agents are paused by the budget brake");
    const res = await generateObject({
      tier: "fast",
      model: model ?? SOCIAL_MODEL,
      reasoning: "high",
      schema,
      system: SYSTEM,
      prompt: JSON.stringify(rows.map(brief)),
    });
    cost = res.cost;
    used = res.model;
    intro = clip(res.object.intro, 140);
    for (const l of res.object.lines) if (rows.some((r) => r.slug === l.slug)) lines.set(l.slug, clip(l.line, 100));
  } catch {
    // template below
  }
  let text = buildPost(day, rows, intro, lines);
  // drop the intro, then the model's lines, if the post runs long
  if (weightedLength(text) > POST_TARGET) text = buildPost(day, rows, "", lines);
  if (weightedLength(text) > POST_MAX) text = buildPost(day, rows, "", new Map());
  return { text, cost, model: used };
}

const HEADLINE_SYSTEM = `You are the art director of Airsc, a safety-checked library of AI agent resources for vibe coders.
Write the big headline for today's social card. It sits next to a real screenshot of what the featured resource produces, with the resource's name printed right under it.
Rules: under 48 characters; sentence case; ends with a period; a concrete outcome the reader gets (what they can make or stop worrying about), grounded in the data; second person or imperative; no product name, no hype words (game-changer, supercharge, revolutionary, unleash), no emoji, no hashtags, no quotes.`;

const headlineSchema = z.object({
  headline: z.string().describe("Under 48 characters, ends with a period"),
});

/**
 * Sonnet's headline for the featured pick (reasoning high). `avoid` is the current headline, so
 * "Regenerate" in /admin/social gives a new take. Falls back to the pick's one-liner.
 */
export async function writeHeadline(r: PickRow, opts: { avoid?: string | null; model?: string; ai?: boolean } = {}) {
  if (opts.ai === false) return { headline: fallbackHeadline(r), cost: 0, model: "template" };
  try {
    const caption = r.previews?.[0]?.caption.en;
    const res = await generateObject({
      tier: "fast",
      model: opts.model ?? SOCIAL_MODEL,
      reasoning: "high",
      schema: headlineSchema,
      system: HEADLINE_SYSTEM,
      prompt: JSON.stringify({
        ...brief(r),
        screenshot_shows: caption ?? null,
        ...(opts.avoid ? { write_something_different_from: opts.avoid } : {}),
      }),
    });
    return { headline: clip(res.object.headline.replace(/^["'“]|["'”]$/g, ""), 64), cost: res.cost, model: res.model };
  } catch {
    return { headline: fallbackHeadline(r), cost: 0, model: "template" };
  }
}
