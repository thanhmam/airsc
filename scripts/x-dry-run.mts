/**
 * Dry run of the spotlight choice for today, from public data only (no DB token, no AI, nothing posted):
 * GITHUB_TOKEN=$(gh auth token) node --env-file=.env.local --import tsx scripts/x-dry-run.mts
 */
import { loadPicks, loadPool, scanLine, vnDay } from "../src/lib/social/compose";
import { chooseSpotlights, eligible, xScore } from "../src/lib/social/spotlight";

const day = vnDay();
const [picks, pool] = await Promise.all([loadPicks(day), loadPool()]);
const all = [...new Map([...picks, ...pool].map((r) => [r.slug, r])).values()];
const front = all.filter(eligible).sort((a, b) => b.stars - a.stars).slice(0, 40);
const handles = new Map<string, string | null>();
for (const r of [...picks, ...front]) {
  if (handles.has(r.owner.toLowerCase())) continue;
  const res = await fetch(`https://api.github.com/users/${r.owner}`, { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } });
  handles.set(r.owner.toLowerCase(), res.ok ? (((await res.json()) as { twitter_username?: string }).twitter_username ?? null) : null);
}
const today = new Set(picks.map((r) => r.slug));
const chosen = chooseSpotlights(all, 3, { posted: new Set(), handles, today });
console.log(`pool ${all.length}, eligible ${all.filter(eligible).length}, picks today ${picks.length}`);
for (const r of chosen) {
  const h = handles.get(r.owner.toLowerCase());
  console.log(`\n${r.slug} [${r.category}] ★${r.stars} score ${xScore(r, { handle: !!h, today: today.has(r.slug) }).toFixed(1)} @${h ?? "-"}`);
  console.log(`  ${r.summary}`);
  console.log(`  ${scanLine(r)}`);
}
