import { anonClient } from "@/lib/supabase/anon";
import type { Preview, Resource } from "@/lib/types";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://airsc.vercel.app";

export type PickRow = Pick<
  Resource,
  | "slug"
  | "name"
  | "owner"
  | "type"
  | "category"
  | "stars"
  | "quality"
  | "first_seen_at"
  | "summary"
  | "description"
  | "use_cases"
  | "previews"
  | "safety"
  | "safety_notes"
  | "license"
>;

const COLUMNS = "slug,name,owner,type,category,stars,quality,first_seen_at,summary,description,use_cases,previews,safety,safety_notes,license";

export const TYPE_LABEL: Record<Resource["type"], string> = { skill: "skill", mcp: "MCP server", agent: "subagent", rule: "rule", plugin: "plugin" };

/** Today's date in Vietnam (the day daily_picks and social posts are keyed by) */
export const vnDay = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(d);

/** The Vietnam day `days` days before today */
export const daysAgo = (days: number) => vnDay(new Date(Date.now() - days * 86_400_000));

export const dayLabel = (day: string) =>
  new Date(`${day}T12:00:00+07:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Ho_Chi_Minh" });

/** `day` at hh:30 Vietnam time, as an ISO timestamp (posts go out from the cron at :30) */
export const slotTime = (day: string, hourVn: number) => new Date(`${day}T${String(hourVn).padStart(2, "0")}:30:00+07:00`).toISOString();

/** Published, non-dangerous resources by slug, in the order asked (public data only) */
export async function loadResources(slugs: string[]): Promise<PickRow[]> {
  if (!slugs.length) return [];
  const { data, error } = await anonClient().from("resources").select(COLUMNS).in("slug", slugs).neq("safety", "danger");
  if (error) throw new Error(error.message);
  const bySlug = new Map(((data ?? []) as PickRow[]).map((r) => [r.slug, r]));
  return slugs.map((s) => bySlug.get(s)).filter((r): r is PickRow => !!r);
}

/** The picks chosen for `day`, in their homepage order */
export async function loadPicks(day: string): Promise<PickRow[]> {
  const { data: picks } = await anonClient().from("daily_picks").select("slugs").eq("day", day).maybeSingle();
  return loadResources((picks?.slugs as string[] | undefined) ?? []);
}

/** Safe, well-rated resources with stars, best first: the pool spotlights are chosen from */
export async function loadPool(limit = 120): Promise<PickRow[]> {
  const { data, error } = await anonClient()
    .from("resources")
    .select(COLUMNS)
    .eq("safety", "safe")
    .gte("quality", 60)
    .order("stars", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as PickRow[];
}

/** A still, roughly landscape-to-square image reads well on the card */
export const usable = (p: Preview | undefined) => !!p && !p.animated && p.width / p.height >= 0.75 && p.width / p.height <= 2.2;

/** The pick shown big on a card: the asked one, else the first with a usable real-result image */
export const resolveHighlight = (rows: PickRow[], slug?: string | null) =>
  rows.find((r) => r.slug === slug) ?? rows.find((r) => usable(r.previews?.[0])) ?? rows[0] ?? null;

export const clip = (s: string, max: number) => {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6)).replace(/[\s,;:.-]+$/, "")}…`;
};

/** The first sentence of the Curator's summary, as "Does …" */
export const oneLiner = (r: PickRow) => {
  const first = (r.summary ?? r.description ?? "").split(/(?<=\.)\s/)[0].replace(/\.$/, "");
  // "An agent skill that allows …" → "Allows …"
  const verb = first.replace(/^(this|an?|the)\s+(agent\s+)?(skill|plugin|mcp server|server|subagent|rule|tool)s?\s+(that\s+)?/i, "");
  return verb.charAt(0).toUpperCase() + verb.slice(1);
};

/** The card headline without the LLM: the pick's one-liner */
export const fallbackHeadline = (r: PickRow) => clip(oneLiner(r), 60);

/** The resource's page on Airsc, tagged so Web Analytics can tell which post sent the visit */
export const resourceUrl = (slug: string, campaign: string, content?: string) =>
  `${SITE}/r/${slug}?utm_source=x&utm_medium=social&utm_campaign=${campaign}${content ? `&utm_content=${content}` : ""}`;

const LICENSE_FREE = /^(no ?assertion|other|unknown)$/i;

/**
 * The scan line every spotlight ends with, built from the scanner's result (never by the LLM), e.g.
 * "Airsc scan: no risky patterns · MIT"
 */
export function scanLine(r: PickRow) {
  const notes = (r.safety_notes ?? []).map((n) => n.code);
  const risky = notes.filter((c) => c !== "stale" && c !== "no_license");
  const verdict = r.safety === "safe" && !risky.length ? "no risky patterns" : `rated ${r.safety}`;
  const license = r.license && !LICENSE_FREE.test(r.license) ? r.license : "no license file";
  return `Airsc scan: ${verdict} · ${license}`;
}

/** The data the writers see about a resource */
export const brief = (r: PickRow) => ({
  slug: r.slug,
  name: r.name,
  type: TYPE_LABEL[r.type],
  category: r.category,
  stars: r.stars,
  github_owner: r.owner,
  summary: r.summary ?? r.description,
  use_cases: (r.use_cases ?? []).slice(0, 3).map((u) => u.en),
  screenshot_shows: r.previews?.[0]?.caption.en ?? null,
});

/** Keeps only @handles the post is allowed to tag (the author's), so the model cannot tag anyone else */
export function keepMentions(text: string, allowed: string[]) {
  const ok = new Set(allowed.map((h) => h.toLowerCase()));
  const out = text.replace(/(^|[^\w@])@(\w{1,15})\b/g, (m, pre: string, h: string) => (ok.has(h.toLowerCase()) ? m : `${pre}${h}`));
  const used = allowed.filter((h) => new RegExp(`(^|[^\\w@])@${h}\\b`, "i").test(out));
  return { text: out, mentions: used };
}

/** The post without its @ (automated posts may not tag people who did not ask for it) */
export const withoutMentions = (text: string) => text.replace(/(^|[^\w@])@(\w{1,15})\b/g, "$1$2");
