/**
 * Dry run of the Previewer agent: no database writes, images saved to a local folder.
 * Uses the vision model when AI_GATEWAY_API_KEY is set, otherwise the README heuristic only.
 *
 *   node --env-file=.env.local --import tsx scripts/previews-dry.mts <out-dir> owner/repo[@branch] ...
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { preview, type PreviewStore } from "../src/lib/engine/agents/previewer";

const [out, ...repos] = process.argv.slice(2);
if (!out || !repos.length) throw new Error("usage: previews-dry.mts <out-dir> owner/repo[@branch] ...");

const store: PreviewStore = async (path, body) => {
  const file = join(out, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, body);
  return path;
};

const useVision = !!process.env.AI_GATEWAY_API_KEY;
const report = [];
let cost = 0;
for (const spec of repos) {
  const [full_name, branch = "main"] = spec.split("@");
  const slug = full_name.replace("/", "-").toLowerCase();
  const r = await preview({ full_name, slug, default_branch: branch }, { store, useVision }).catch((e) => ({ previews: [], cost: 0, considered: 0, error: String(e) }));
  cost += r.cost;
  report.push({ full_name, ...r });
  console.log(`${full_name}: ${r.considered} usable images, ${r.previews.length} kept${"error" in r ? ` (${r.error})` : ""}`);
}
await writeFile(join(out, "report.json"), JSON.stringify({ useVision, cost, report }, null, 2));
console.log(`vision: ${useVision} · cost $${cost.toFixed(4)}`);
