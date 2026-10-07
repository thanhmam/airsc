import { z } from "zod";
import { CATEGORIES, CATEGORY_SLUGS } from "@/lib/taxonomy";
import type { Resource } from "@/lib/types";
import { generateObject } from "../ai";

const bilingual = z.object({ en: z.string(), vi: z.string() });

const schema = z.object({
  items: z.array(
    z.object({
      key: z.string(),
      relevant: z
        .boolean()
        .describe("True only if this is something a user installs into an AI coding agent: a skill, MCP server, plugin, subagent, rules/prompts pack, or a curated collection of those"),
      category: z.enum(CATEGORY_SLUGS),
      tags: z.array(z.string()).min(2).max(6).describe("lowercase kebab-case, e.g. stripe, supabase, tailwind"),
      level: z.enum(["beginner", "intermediate", "advanced"]).describe("How hard it is for a non-developer to install and use"),
      quality: z.number().int().min(0).max(100),
      quality_notes: z.string().describe("One short English sentence explaining the score"),
      summary: z.string().describe("One concrete sentence, max 160 chars: what it lets the user's agent do"),
      summary_vi: z.string(),
      use_cases: z.array(bilingual).length(3).describe("Three short things a vibe coder could build or do with it"),
    }),
  ),
});

const SYSTEM = `You curate Airsc, a library of AI agent resources for vibe coders (people who build apps with AI agents like Claude Code and Cursor, and are often not professional developers).

For every item decide:
- relevant: is it installable into an AI coding agent (Claude skill, MCP server, Claude Code plugin/subagent, Cursor rules, prompt/rules pack, or an awesome-list of those)? NOT relevant: standalone apps and desktop/web clients, SDKs or frameworks for building agents or MCP servers, tutorials, courses, getting-started guides and example-project collections, model weights, and products that merely "use AI".
- category: the outcome it helps with. Options: ${CATEGORIES.map((c) => `${c.slug} (${c.en})`).join(", ")}.
- quality 0-100 for a vibe coder: clear README and install steps (+), focused and useful (+), active maintenance and stars (+), vague/placeholder/spam/abandoned (-), needs heavy setup or paid keys (-).
- summary: plain words, no hype, no emoji; summary_vi and use_cases.vi in natural Vietnamese (keep product names and terms like MCP, Claude, Cursor, API in English).
Base everything only on the provided data; never invent features. Return every key.`;

export type HiddenReason = "not_relevant" | "low_quality" | "danger";
export type CuratorResult = z.infer<typeof schema>["items"][number] & {
  status: "published" | "pending" | "hidden";
  hidden_reason: HiddenReason | null;
};

/**
 * Fully automatic decision once a resource is verified (safety scan + Curator):
 * relevant, quality >= 40 and not rated danger -> published; anything else -> hidden.
 * "pending" is reserved for resources the agents have not verified yet. Admins can still override.
 */
export function gate(item: { relevant: boolean; quality: number }, safety: string): Pick<CuratorResult, "status" | "hidden_reason"> {
  if (!item.relevant) return { status: "hidden", hidden_reason: "not_relevant" };
  if (safety === "danger") return { status: "hidden", hidden_reason: "danger" };
  if (item.quality < 40) return { status: "hidden", hidden_reason: "low_quality" };
  return { status: "published", hidden_reason: null };
}

export async function curate(rows: Resource[], modelId?: string): Promise<{ results: CuratorResult[]; model: string; cost: number }> {
  const { object, model, cost } = await generateObject({
    tier: "fast",
    model: modelId,
    schema,
    system: SYSTEM,
    prompt: JSON.stringify(
      rows.map((r) => ({
        key: r.full_name,
        detected_type: r.type,
        name: r.name,
        description: r.description,
        topics: r.topics.slice(0, 10),
        stars: r.stars,
        last_push: r.pushed_at?.slice(0, 10),
        license: r.license,
        safety: r.safety,
        readme: (r.readme_excerpt ?? "").slice(0, 1800),
      })),
    ),
  });
  const safety = new Map(rows.map((r) => [r.full_name, r.safety]));
  return {
    model,
    cost,
    results: object.items
      .filter((i) => safety.has(i.key))
      .map((i) => ({ ...i, ...gate(i, safety.get(i.key)!) })),
  };
}
