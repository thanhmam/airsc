import { z } from "zod";
import type { Resource } from "@/lib/types";
import { generateObject } from "../ai";

const scene = z.object({
  kind: z.enum(["hook", "problem", "ask", "agent", "result", "cta"]),
  title: z.string().describe("Max 60 chars"),
  lines: z.array(z.string()).max(4).describe("Each max 70 chars"),
});

const schema = z.object({
  items: z.array(
    z.object({
      key: z.string(),
      scenes_en: z.array(scene).length(6),
      scenes_vi: z.array(scene).length(6),
      prompts: z
        .array(z.object({ en: z.string(), vi: z.string() }))
        .length(3)
        .describe("Prompts the user can paste into their agent after installing"),
    }),
  ),
});

export type ShowcaseScene = z.infer<typeof scene>;
export type Showcase = { en: ShowcaseScene[]; vi: ShowcaseScene[]; model: string };

const SYSTEM = `You are the producer of short animated explainer videos (about 20 seconds, 6 scenes) for Airsc, a library of AI agent resources for vibe coders.
For each resource write exactly 6 scenes in this order:
1. hook: the resource name as title + one line on the outcome it gives.
2. problem: what is slow or hard without it (1-2 lines).
3. ask: title "You ask your agent" and ONE line: a realistic request the user types to Claude Code or Cursor.
4. agent: title like "Your agent" with 2-4 short terminal-style lines describing what the agent does with this resource. Only mention tools, commands or files that appear in the provided README; otherwise describe the action generically.
5. result: 2-3 short outcome lines.
6. cta: title "Install in one click on Airsc" (Vietnamese: "Cài 1 cú bấm trên Airsc") and one line naming what to install.
Also write 3 example prompts the user can paste after installing.
Vietnamese versions must be natural Vietnamese (keep product names and terms like MCP, Claude, Cursor, API in English). No hype, no emoji, never invent features not supported by the README.`;

export async function produce(rows: Resource[], tier: "fast" | "smart" = "fast", modelId?: string) {
  const { object, model, cost } = await generateObject({
    tier,
    model: modelId,
    schema,
    system: SYSTEM,
    prompt: JSON.stringify(
      rows.map((r) => ({
        key: r.full_name,
        name: r.name,
        type: r.type,
        summary: r.summary ?? r.description,
        use_cases: r.use_cases,
        install: r.install.kind,
        readme: (r.readme_excerpt ?? "").slice(0, 2500),
      })),
    ),
  });
  const keys = new Set(rows.map((r) => r.full_name));
  const items = object.items
    .filter((i) => keys.has(i.key))
    .map((i) => ({
      full_name: i.key,
      showcase: { en: i.scenes_en, vi: i.scenes_vi, model } satisfies Showcase,
      prompts: i.prompts,
    }));
  return { items, model, cost };
}
