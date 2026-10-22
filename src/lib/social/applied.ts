import { z } from "zod";
import { AIRSC_RUNS } from "@/lib/airsc-runs";
import { generateObject } from "@/lib/engine/ai";
import { SOCIAL_MODEL } from "@/lib/engine/settings";
import { brief, clip, keepMentions, type PickRow, SITE } from "./compose";
import { POST_RULES } from "./rules";

const SYSTEM = `You write one X (Twitter) post for @thanhmam, an indie hacker in Hanoi who builds Airsc (a safety-checked library of AI agent resources; Next.js, Supabase and Vercel) and client sites by vibe coding with Claude Code. The post is a short first-person story of how the builder used ONE agent resource in a real project, written from the builder's notes. The builder's screenshots are attached to the post.
Goal: other vibe coders see a real problem, what was done, and what changed, and want to try it on their own project.

Shape (plain text, short lines, a blank line between parts):
1. Hook, one line: the problem or the result in the project, concrete. Not a question.
2. What I did with the resource (name it, say what kind it is and where it ran), in one to three short lines.
3. What came out or what it changed for the project; the builder's own takeaway if the notes have one.
4. Credit as its own short sentence: "Built by @handle." when an X handle is given, otherwise "Built by <github_owner>."
Under 520 characters in total.

Rules: English, even when the notes are in Vietnamese. First person ("I"), plain and direct like a developer talking to peers. Only facts from the notes and the data: never invent numbers, results, features or feelings. No links, no hashtags, no emoji, no other @mentions, no hype words (game-changer, revolutionary, supercharge, unleash, must-have, 10x), no "Here's how", no thread markers.

Worked example of the shape (a post about Archify, from notes that gave the dates, the counts and what had been added):
"""
Vibe coding is fast. Keeping the whole product in your head is not.

12 days into building Airsc, I had added payments, a daily quota, an X bot and admin routes, one prompt at a time. I could no longer draw my own app.

So I ran Archify, a Claude Code skill, on the repo. It reads the code and draws the whole system, each box linked to its source lines.

Oct 9: 15 parts, 14 links.
Oct 21: 17 parts, 19 links.

Now I see what a new feature touches before I let it in.

Built by @handle.
"""
Copy the shape, never the facts: use only what this builder's notes say.

${POST_RULES}`;

const schema = z.object({
  text: z.string().describe("The post, under 520 characters"),
  image_alt: z.string().describe("Alt text for the screenshots: what they show, under 400 characters"),
});

/** Writes an applied post from the admin's notes; code keeps only the author's @handle */
export async function writeApplied(r: PickRow, o: { handle: string | null; notes: string; project?: string; images: number; guidance?: string }) {
  const res = await generateObject({
    tier: "fast",
    model: SOCIAL_MODEL,
    reasoning: "high",
    schema,
    system: SYSTEM + (o.guidance?.trim() ? `\n\nWhat the last review of our posts' numbers says to do:\n${o.guidance.trim()}` : ""),
    prompt: JSON.stringify({
      resource: { ...brief(r), x_handle: o.handle },
      project: o.project?.trim() || "Airsc",
      notes: o.notes,
      screenshots_attached: o.images,
    }),
  });
  const kept = keepMentions(res.object.text.trim(), o.handle ? [o.handle] : []);
  return { text: kept.text, mentions: kept.mentions, image_alt: clip(res.object.image_alt, 1000), cost: res.cost, model: res.model };
}

/** The first reply of an applied post */
export const appliedReply = (r: PickRow, url: string) => `${r.name}, with its safety report and one-click install: ${url}`;

/**
 * Resources Airsc already ran on its own codebase (public/runs): ready-made applied posts, with the
 * task as notes and the run's images as screenshots.
 */
export const RUN_PRESETS = Object.entries(AIRSC_RUNS).map(([slug, run]) => ({
  slug,
  notes: `${run.task.en} (${run.agent}, ${run.date}). ${run.images.map((i) => i.caption.en).join(" ")}`,
  images: run.images.slice(0, 1).map((i) => `${SITE}${i.src}`),
}));
