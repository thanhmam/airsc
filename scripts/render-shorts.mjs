/**
 * Renders the Airsc vertical short to out/*.mp4
 *   pnpm video:render                 → all six (a/b/c × vi/en)
 *   pnpm video:render a vi            → one variant + language
 *   pnpm video:render a               → variant a in both languages
 */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const [variantArg, langArg] = process.argv.slice(2);
const variants = variantArg ? [variantArg] : ["a", "b", "c"];
const langs = langArg ? [langArg] : ["vi", "en"];

mkdirSync("out", { recursive: true });
for (const v of variants) {
  for (const l of langs) {
    const id = `short-${v}-${l}`;
    console.log(`\n▶ ${id}`);
    const r = spawnSync("npx", ["remotion", "render", "src/video/index.ts", id, `out/airsc-${id}.mp4`], {
      stdio: "inherit",
      shell: true,
    });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
}
