/** Re-apply the current safety policy to stored scan notes without re-crawling GitHub */
import { mcpFromCommands, mcpFromReadme } from "../src/lib/crawler/install";
import { finalizeSafety } from "../src/lib/crawler/scan";
import { anonClient } from "../src/lib/supabase/anon";
import type { InstallInfo, SafetyNote } from "../src/lib/types";

const db = anonClient();
const data: Record<string, unknown>[] = [];
for (let from = 0; ; from += 1000) {
  const { data: page, error } = await db.from("resources").select("*").order("full_name").range(from, from + 999);
  if (error) throw error;
  data.push(...page);
  if (page.length < 1000) break;
}
const counts: Record<string, number> = {};
const rows = data.map(({ id, search, downloads, created_at, ...r }) => {
  const { safety, notes } = finalizeSafety((r as { safety_notes: SafetyNote[] }).safety_notes);
  counts[safety] = (counts[safety] ?? 0) + 1;
  let install = r.install as InstallInfo;
  if (r.type === "mcp" && install.kind === "manual") {
    const readme = String(r.readme_excerpt ?? "");
    const mcp = mcpFromReadme(readme) ?? mcpFromCommands(readme, String(r.name));
    if (mcp) {
      install = { kind: "mcp", mcp };
      counts.mcp_upgraded = (counts.mcp_upgraded ?? 0) + 1;
    }
  }
  return { ...r, safety, safety_notes: notes, install };
});
for (let i = 0; i < rows.length; i += 100) {
  const { error: e } = await db.rpc("ingest_resources", { p_token: process.env.AIRSC_INGEST_TOKEN, p_rows: rows.slice(i, i + 100) });
  if (e) throw e;
}
console.log(`rescored ${rows.length}`, counts);
