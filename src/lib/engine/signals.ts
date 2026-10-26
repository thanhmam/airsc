import { after } from "next/server";
import { db } from "@/lib/engine/db";

export type SearchSource = "web" | "browse" | "mcp";

/**
 * Records a search (what was asked and how many results it had) after the response is sent. A signal, never a
 * dependency: any failure, including the table not existing yet, is swallowed. Instant-search answers served from
 * the CDN cache are not counted, so the numbers lean low rather than high.
 */
export function logSearch(o: { q: string | undefined; results: number; source: SearchSource; job?: string }) {
  const q = o.q?.trim();
  if (!q || q.length < 2) return;
  after(() => db.logSearch(q, o.results, o.source, o.job).catch(() => {}));
}
