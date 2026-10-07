import { z } from "zod";
import { CATEGORIES } from "@/lib/taxonomy";
import type { Resource } from "@/lib/types";
import { generateObject } from "../ai";

const bi = z.object({ en: z.string(), vi: z.string() });

const schema = z.object({
  title: bi.describe("SEO title, max 65 chars"),
  description: bi.describe("Meta description, max 155 chars"),
  intro: bi.describe("2 short paragraphs of markdown: who this is for and what these resources unlock"),
  picks: z
    .array(z.object({ slug: z.string(), why: bi.describe("One sentence: why pick this one, grounded in the data") }))
    .min(3)
    .max(8),
  how_to_choose: z.array(bi).min(3).max(5).describe("Short bullet tips"),
  faq: z.array(z.object({ q: bi, a: bi })).min(3).max(4),
});

export type GuidePage = {
  slug: string;
  kind: "category" | "digest";
  title: string;
  title_vi: string;
  description: string;
  description_vi: string;
  body: string;
  body_vi: string;
  resource_slugs: string[];
  showcase: { picks: { slug: string; why_en: string; why_vi: string }[]; model: string };
};

const SYSTEM = `You are the editor of Airsc, a safety-checked library of AI agent resources (Claude skills, MCP servers, plugins, subagents, Cursor rules) for vibe coders.
Write a helpful, honest guide page from the provided resources only. Plain words, short sentences, no hype, no emoji.
Pick resources by usefulness for a non-expert, preferring 'safe' safety labels and higher quality scores; mention when something needs API keys or setup.
Only reference slugs that appear in the input. Vietnamese must be natural (keep product names and terms like MCP, Claude, Cursor, API in English).`;

function toMarkdown(o: z.infer<typeof schema>, lang: "en" | "vi", headings: { how: string; faq: string }) {
  return [
    o.intro[lang],
    `## ${headings.how}`,
    o.how_to_choose.map((t) => `- ${t[lang]}`).join("\n"),
    `## ${headings.faq}`,
    o.faq.map((f) => `### ${f.q[lang]}\n\n${f.a[lang]}`).join("\n\n"),
  ].join("\n\n");
}

const brief = (r: Resource) => ({
  slug: r.slug,
  name: r.name,
  type: r.type,
  stars: r.stars,
  safety: r.safety,
  quality: r.quality,
  level: r.level,
  summary: r.summary ?? r.description,
  use_cases: (r.use_cases as { en: string }[]).map((u) => u.en),
});

async function write(kind: GuidePage["kind"], slug: string, brief_: string, rows: Resource[], modelId?: string): Promise<{ page: GuidePage; cost: number }> {
  const { object, model, cost } = await generateObject({
    tier: "smart",
    model: modelId,
    schema,
    system: SYSTEM,
    prompt: `${brief_}\n\nResources:\n${JSON.stringify(rows.map(brief))}`,
  });
  const valid = new Set(rows.map((r) => r.slug));
  const picks = object.picks.filter((p) => valid.has(p.slug));
  const page: GuidePage = {
    slug,
    kind,
    title: object.title.en,
    title_vi: object.title.vi,
    description: object.description.en,
    description_vi: object.description.vi,
    body: toMarkdown(object, "en", { how: "How to choose", faq: "FAQ" }),
    body_vi: toMarkdown(object, "vi", { how: "Cách chọn", faq: "Câu hỏi thường gặp" }),
    resource_slugs: picks.map((p) => p.slug),
    showcase: { picks: picks.map((p) => ({ slug: p.slug, why_en: p.why.en, why_vi: p.why.vi })), model },
  };
  return { page, cost };
}

export function categoryGuide(category: string, rows: Resource[], modelId?: string) {
  const c = CATEGORIES.find((x) => x.slug === category)!;
  return write(
    "category",
    `best-${category}`,
    `Write the guide "Best ${c.en} resources for vibe coders" (Vietnamese topic: "${c.vi}").`,
    rows,
    modelId,
  );
}

/** ISO week label like 2026-w41 */
export function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { label: `${t.getUTCFullYear()}-w${String(week).padStart(2, "0")}`, week, year: t.getUTCFullYear() };
}

export function weeklyDigest(rows: Resource[], modelId?: string) {
  const { label, week, year } = isoWeek();
  return write(
    "digest",
    `new-${label}`,
    `Write the weekly digest "New AI agent resources this week (week ${week}, ${year})". These were added to Airsc in the last 7 days.`,
    rows,
    modelId,
  );
}
