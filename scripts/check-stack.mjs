/**
 * Guards the core tech stack (stack.lock.json). Runs before every build, so a preview or production deploy
 * fails when package.json drifts from the lock: a package nobody approved, a core package removed, or a core
 * package on another major. Plain Node, no dependencies: node scripts/check-stack.mjs
 */
import { readFileSync } from "node:fs";

const read = (f) => JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), "utf8"));
const pkg = read("package.json");
const lock = read("stack.lock.json");

/** "^0.35.5" → "0.35", "16.3.8" → "16", "^7.0.127" → "7", "^4" → "4" */
const key = (range) => {
  const m = String(range).match(/(\d+)(?:\.(\d+))?/);
  if (!m) return String(range);
  return m[1] === "0" ? `0.${m[2] ?? 0}` : m[1];
};

const deps = { ...pkg.dependencies, ...pkg.devDependencies };
const core = lock.core ?? {};
const extra = new Set(lock.extra ?? []);
const problems = [];

for (const [name, range] of Object.entries(deps)) {
  if (name in core) {
    if (key(range) !== core[name]) problems.push(`core package ${name} is on ${key(range)} (${range}), the lock says ${core[name]}`);
  } else if (!extra.has(name)) {
    problems.push(`${name} (${range}) is not in stack.lock.json: a new package needs a decision`);
  }
}
for (const name of Object.keys(core)) if (!(name in deps)) problems.push(`core package ${name} was removed from package.json`);

const pm = String(pkg.packageManager ?? "").replace(/\+.*$/, "");
if (lock.packageManager && !pm.startsWith(`${lock.packageManager}.`) && pm !== lock.packageManager) problems.push(`packageManager is ${pm}, the lock says ${lock.packageManager}`);

if (problems.length) {
  console.error("\nTech stack check failed (stack.lock.json):\n" + problems.map((p) => `  - ${p}`).join("\n"));
  console.error(
    "\nIf the change is intended: write the reason in docs/decisions, then update stack.lock.json and the Tech stack list in\nsrc/app/[lang]/admin/pm/content.ts in the same pull request. If an agent made the change, undo it and ask first.\n",
  );
  process.exit(1);
}
console.log(`Tech stack check passed: ${Object.keys(core).length} core packages locked, ${extra.size} extra allowed.`);
