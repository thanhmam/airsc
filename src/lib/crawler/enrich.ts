import { generateText, Output } from "ai";
import { z } from "zod";

/** Default is Sonnet 5.5; override with AIRSC_ENRICH_MODEL (e.g. a free-tier model before AI Gateway credits are added) */
export const ENRICH_MODEL = process.env.AIRSC_ENRICH_MODEL ?? "anthropic/claude-sonnet-5.5";

export type EnrichInput = {
  key: string;
  name: string;
  type: string;
  description: string | null;
  topics: string[];
  readme: string;
};

export type EnrichOutput = {
  key: string;
  summary: string;
  summary_vi: string;
  description_vi: string | null;
};

const schema = z.object({
  items: z.array(
    z.object({
      key: z.string(),
      summary: z.string().describe("One plain-English sentence, max 160 chars"),
      summary_vi: z.string().describe("Natural Vietnamese translation of summary"),
      description_vi: z.string().nullable().describe("Vietnamese translation of the GitHub description, or null if none"),
    }),
  ),
});

/** Summarise + translate a batch of resources in one model call (internal use only, run at crawl time) */
export async function enrichBatch(batch: EnrichInput[]): Promise<EnrichOutput[]> {
  const { output } = await generateText({
    model: ENRICH_MODEL,
    output: Output.object({ schema }),
    system:
      "You write catalog copy for Airsc, a library of AI agent resources (Claude skills, MCP servers, plugins, agents, Cursor rules) for vibe coders: people who build apps with AI but are not professional developers. " +
      "For each item write one concrete sentence saying what it lets the user's AI agent do, in plain words, no hype, no emoji, max 160 characters. " +
      "Then translate it into natural Vietnamese (keep product names and technical terms like MCP, Claude, Cursor in English). " +
      "Translate the GitHub description into Vietnamese too. Return every key you were given.",
    prompt: JSON.stringify(
      batch.map((b) => ({
        key: b.key,
        name: b.name,
        type: b.type,
        description: b.description,
        topics: b.topics.slice(0, 8),
        readme: b.readme.slice(0, 1200),
      })),
    ),
  });
  return output.items;
}
