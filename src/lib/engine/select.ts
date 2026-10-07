// Pure helpers used inside the workflow function itself: keep this file free of runtime imports.
import type { GhRepo } from "@/lib/crawler/github";
import type { ResourceType } from "@/lib/types";

export type Candidate = { repo: GhRepo; type: ResourceType; sources: string[]; isNew: boolean };

export const chunks = <T,>(arr: T[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

/** Rank candidates: most-starred new repos first, then most-starred updates */
export function select(all: Candidate[], maxNew = 150, maxRefresh = 150) {
  const byStars = (a: Candidate, b: Candidate) => b.repo.stargazers_count - a.repo.stargazers_count;
  return {
    fresh: all.filter((c) => c.isNew).sort(byStars).slice(0, maxNew),
    refresh: all.filter((c) => !c.isNew).sort(byStars).slice(0, maxRefresh),
  };
}

