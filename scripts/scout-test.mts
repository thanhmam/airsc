import { scout } from "../src/lib/engine/agents/scout";
const t = Date.now();
const hb = setInterval(() => console.log(`… ${Math.round((Date.now() - t) / 1000)}s`), 15_000);
const r = await scout({ log: (m) => console.log(m) });
console.log("top new:", r.fresh.slice(0, 12).map((c) => `${c.repo.full_name}(${c.repo.stargazers_count}) [${c.sources.join(",")}]`).join("\n  "));
console.log("top refresh:", r.refresh.slice(0, 5).map((c) => c.repo.full_name).join(", "));
clearInterval(hb);
console.log(`done in ${Math.round((Date.now() - t) / 1000)}s`);
