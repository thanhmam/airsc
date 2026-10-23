import { LATEST } from "@/lib/pm/diagrams";
import { architectureStatus, mergedPrs, type MergedPr } from "@/lib/pm/github";
import { CHANGELOG } from "./content";

/** Pull request numbers the changelog already covers (an entry can cover several with `also`) */
export const coveredPrs = () => new Set(CHANGELOG.flatMap((c) => [c.pr, ...(c.also ?? [])]).filter((n): n is number => typeof n === "number"));

/** Merged pull requests that have no changelog entry; null when GitHub cannot be reached */
export async function missingFromChangelog(): Promise<MergedPr[] | null> {
  const merged = await mergedPrs();
  if (!merged) return null;
  const covered = coveredPrs();
  // the architecture refresh pull requests only add snapshots and are not product changes
  return merged.filter((p) => !covered.has(p.number) && !/^Architecture snapshot/i.test(p.title));
}

/** What the admin nav shows: the architecture notice and the number of pull requests missing from the changelog */
export async function pmHealth() {
  const [architecture, missing] = await Promise.all([architectureStatus(LATEST.revision), missingFromChangelog()]);
  return {
    architecture: architecture?.stale ? Math.max(architecture.prs.length, 1) : 0,
    changelog: missing?.length ?? 0,
  };
}
