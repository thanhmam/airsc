import { z } from "zod";
import { generateObject } from "@/lib/engine/ai";
import { SOCIAL_MODEL } from "@/lib/engine/settings";
import { brief, clip, fallbackHeadline, keepMentions, oneLiner, type PickRow, scanLine, TYPE_LABEL, usable } from "./compose";

/** What a vibe coder building an app installs an agent resource for */
const BUILDER = new Set([
  "ui-design",
  "web-apps",
  "database-backend",
  "auth-security",
  "payments",
  "deploy-devops",
  "testing-debugging",
  "code-quality",
  "agent-workflow",
  "ai-apps",
  "browser-data",
]);

/** Resources made for one non-English audience (X posts are in English) */
const NICHE = /\b(chinese|korean|japanese|vietnamese|russian)\b|中文|한국|日本語|[-_](zh|cn|ko|ja|jp)$/i;

/**
 * How well a resource suits a spotlight on X: real-result image (the card is the post's picture), an
 * author we can credit on X, a builder category, popularity and quality, and a lift for today's picks.
 */
export function xScore(r: PickRow, o: { handle: boolean; today: boolean }) {
  return (
    (r.quality ?? 0) / 4 +
    8 * Math.log10(r.stars + 1) +
    (usable(r.previews?.[0]) ? 15 : 0) +
    (o.handle ? 12 : 0) +
    (BUILDER.has(r.category ?? "") ? 8 : 0) +
    (o.today ? 6 : 0)
  );
}

/** Rated safe with no risky note (only "stale" or "no license" allowed), and not made for one non-English audience */
export const eligible = (r: PickRow) =>
  r.safety === "safe" &&
  (r.safety_notes ?? []).every((n) => n.code === "stale" || n.code === "no_license") &&
  !NICHE.test(`${r.slug} ${r.name} ${r.summary ?? ""}`);

/** Best `n` for today, never one already posted on its own, at most one per category and per owner */
export function chooseSpotlights(pool: PickRow[], n: number, o: { posted: Set<string>; handles: Map<string, string | null>; today: Set<string> }) {
  const ranked = pool
    .filter((r) => !o.posted.has(r.slug) && eligible(r))
    .map((r) => ({ r, s: xScore(r, { handle: !!o.handles.get(r.owner.toLowerCase()), today: o.today.has(r.slug) }) }))
    .sort((a, b) => b.s - a.s);
  const out: PickRow[] = [];
  for (const { r } of ranked) {
    if (out.length >= n) break;
    if (out.some((p) => p.category === r.category || p.owner === r.owner)) continue;
    out.push(r);
  }
  // a small pool can leave slots empty: fill them without the mix rule
  for (const { r } of ranked) if (out.length < n && !out.includes(r)) out.push(r);
  return out;
}

const SYSTEM = `You write one X (Twitter) post for @thanhmam, an indie hacker in Hanoi who builds Airsc (a safety-checked library of Claude skills, MCP servers, plugins and Cursor rules) by vibe coding. The post spotlights ONE agent resource.
Goal: a developer scrolling X stops, gets what they would have after installing it, and wants to try it.

Shape (plain text, line breaks between parts):
1. Hook, one line under 90 characters: the concrete outcome or the pain it removes, in the reader's words. Not a question, no product name.
2. One or two short lines: what it is and where it runs (Claude Code, Cursor, any MCP client…), one specific detail from the data that makes it believable (a use case, a number of tools, what the screenshot shows), and the credit: "by @handle" when an X handle is given, otherwise "by <github_owner> on GitHub". Star count only if it is above 1,000.
Under 250 characters in total. A scan line is added after your text by code: do not write about safety yourself.

Rules: English. Only facts from the data; never invent numbers, features or opinions. No links, no hashtags, no emoji, no other @mentions, no hype words (game-changer, revolutionary, supercharge, unleash, must-have, 10x), no "Today's picks", no "Check out", no "Meet".`;

const schema = z.object({
  text: z.string().describe("The post, under 250 characters, without the scan line"),
  headline: z.string().describe("Card headline under 48 characters, sentence case, ends with a period, the outcome for the reader, no product name"),
});

/** The resource's line in the post when the model is unavailable */
function fallbackText(r: PickRow, handle: string | null) {
  const credit = handle ? `by @${handle}` : `by ${r.owner} on GitHub`;
  const stars = r.stars >= 1000 ? ` (${Math.round(r.stars / 100) / 10}k stars)` : "";
  return `${clip(oneLiner(r), 120)}.\n\n${r.name}, a ${TYPE_LABEL[r.type]}${stars}, ${credit}.`;
}

/**
 * Writes the spotlight for `r`: the model writes the hook, the body and the card headline; code adds
 * the scan line and keeps only the author's @handle.
 */
export async function writeSpotlight(r: PickRow, o: { handle: string | null; guidance?: string; avoid?: string | null; ai?: boolean }) {
  let text = "";
  let headline = "";
  let cost = 0;
  let model = "template";
  if (o.ai !== false) {
    try {
      const res = await generateObject({
        tier: "fast",
        model: SOCIAL_MODEL,
        reasoning: "high",
        schema,
        system: SYSTEM + (o.guidance?.trim() ? `\n\nWhat the last review of our posts' numbers says to do:\n${o.guidance.trim()}` : ""),
        prompt: JSON.stringify({
          ...brief(r),
          x_handle: o.handle,
          ...(o.avoid ? { write_something_different_from: o.avoid } : {}),
        }),
      });
      text = res.object.text.trim();
      headline = clip(res.object.headline.replace(/^["'“]|["'”]$/g, ""), 64);
      cost = res.cost;
      model = res.model;
    } catch {
      // template below
    }
  }
  if (!text) text = fallbackText(r, o.handle);
  if (!headline) headline = fallbackHeadline(r);
  const kept = keepMentions(text, o.handle ? [o.handle] : []);
  return { text: `${kept.text}\n\n${scanLine(r)}`, mentions: kept.mentions, headline, cost, model };
}

/** The first reply: where to get it (the link stays out of the post itself) */
export const spotlightReply = (r: PickRow, url: string) => `${r.name} on Airsc, with the full safety report and one-click install: ${url}`;
