import { db, type SocialPost } from "@/lib/engine/db";
import { socialSettings } from "@/lib/engine/settings";
import { appliedReply, writeApplied } from "./applied";
import { clip, loadPicks, loadPool, loadResources, type PickRow, resourceUrl, slotTime } from "./compose";
import { xHandles } from "./handles";
import { chooseSpotlights, spotlightReply, writeSpotlight } from "./spotlight";

/** Applied posts take slots from here, so they never collide with the engine's spotlights (1-3) */
export const APPLIED_SLOT = 10;

/** Resources already posted on their own (spotlight or applied): a spotlight never repeats one */
const postedAlone = (posts: SocialPost[]) =>
  new Set(posts.filter((p) => p.kind !== "picks" && p.status !== "skipped" && p.highlight).map((p) => p.highlight!));

const alt = (r: PickRow, headline: string) =>
  clip(`${headline} ${r.name} by ${r.owner}: ${r.previews?.[0]?.caption.en ?? r.summary ?? ""}`, 1000);

/** Writes one spotlight post for `r` in `slot` (an existing post wins unless `force`) */
async function draftSpotlight(day: string, slot: number, hourVn: number, r: PickRow, o: { force?: boolean; ai?: boolean; avoid?: string | null }) {
  const s = socialSettings(await db.settings());
  const handle = (await xHandles([r.owner])).get(r.owner.toLowerCase()) ?? null;
  const w = await writeSpotlight(r, { handle, guidance: s.x_guidance, avoid: o.avoid, ai: o.ai });
  const post = await db.upsertSocial(
    {
      day,
      slot,
      kind: "spotlight",
      text: w.text,
      reply_text: spotlightReply(r, resourceUrl(r.slug, "spotlight", `${day}-${slot}`)),
      highlight: r.slug,
      slugs: [r.slug],
      mentions: w.mentions,
      image_alt: alt(r, w.headline),
      scheduled_at: slotTime(day, hourVn),
      headline: w.headline,
      card_style: s.x_card_style,
    },
    o.force,
  );
  return { post, cost: w.cost, model: w.model };
}

/**
 * Today's spotlights: one per posting hour set in /admin/social, chosen from today's picks and the best
 * safe resources not posted on their own yet. Slots that already have a post are left alone.
 */
export async function makeDrafts(day: string, o: { ai?: boolean } = {}) {
  const s = socialSettings(await db.settings());
  const posts = await db.socialPosts(400);
  const taken = new Set(posts.filter((p) => p.day === day && p.channel === "x").map((p) => p.slot));
  const open = s.x_slots_vn.map((hour, i) => ({ slot: i + 1, hour })).filter((x) => !taken.has(x.slot));
  if (!open.length) return { posts: [] as SocialPost[], cost: 0, model: null as string | null, reason: "today's slots are drafted" };

  const [picks, pool] = await Promise.all([loadPicks(day), loadPool()]);
  const candidates = [...new Map([...picks, ...pool].map((r) => [r.slug, r])).values()];
  const posted = postedAlone(posts);
  // X handles only for the front of the queue: enough to rank by, without asking GitHub about everyone
  const front = candidates.filter((r) => !posted.has(r.slug)).sort((a, b) => b.stars - a.stars).slice(0, 40);
  const handles = await xHandles([...new Set([...picks, ...front].map((r) => r.owner))]);
  const chosen = chooseSpotlights(candidates, open.length, { posted, handles, today: new Set(picks.map((r) => r.slug)) });
  if (!chosen.length) return { posts: [], cost: 0, model: null, reason: "no eligible resource left" };

  const out: SocialPost[] = [];
  let cost = 0;
  let model: string | null = null;
  for (const [i, r] of chosen.entries()) {
    const d = await draftSpotlight(day, open[i].slot, open[i].hour, r, { ai: o.ai });
    if (d.post) out.push(d.post);
    cost += d.cost;
    model = d.model;
  }
  return { posts: out, cost, model, reason: null };
}

/** "Write again" on a spotlight: a new take on the same resource, or `slug` instead of it */
export async function rewriteSpotlight(post: SocialPost, slug?: string | null) {
  const [r] = await loadResources([slug || post.highlight || ""]);
  if (!r) return { post: null, cost: 0, error: "resource not found or not published" };
  const hour = post.scheduled_at ? Number(new Date(post.scheduled_at).toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" })) % 24 : 20;
  const d = await draftSpotlight(post.day, post.slot, hour, r, { force: true, avoid: r.slug === post.highlight ? post.text : null });
  return { post: d.post, cost: d.cost, error: d.post ? null : "this post has already gone out" };
}

/**
 * An applied post: the admin's notes and screenshots about using `slug` in a project, written up by
 * Sonnet as a first-person post. It waits as a draft until the admin approves or posts it.
 */
export async function makeApplied(i: { slug: string; notes: string; project?: string; images: string[]; day: string; hourVn: number; minute?: number }) {
  const [r] = await loadResources([i.slug]);
  if (!r) throw new Error(`"${i.slug}" is not a published resource`);
  const s = socialSettings(await db.settings());
  const handle = (await xHandles([r.owner])).get(r.owner.toLowerCase()) ?? null;
  const w = await writeApplied(r, { handle, notes: i.notes, project: i.project, images: i.images.length, guidance: s.x_guidance });
  const posts = await db.socialPosts(60);
  const used = posts.filter((p) => p.day === i.day && p.channel === "x").map((p) => p.slot);
  const slot = Math.max(APPLIED_SLOT - 1, ...used) + 1;
  const post = await db.upsertSocial({
    day: i.day,
    slot,
    kind: "applied",
    text: w.text,
    reply_text: appliedReply(r, resourceUrl(r.slug, "applied", `${i.day}-${slot}`)),
    highlight: r.slug,
    slugs: [r.slug],
    mentions: w.mentions,
    image_alt: w.image_alt,
    images: i.images,
    note: [i.project ? `Project: ${i.project}` : "", i.notes].filter(Boolean).join("\n"),
    scheduled_at: slotTime(i.day, i.hourVn, i.minute ?? 30),
  });
  return { post, cost: w.cost, model: w.model };
}
