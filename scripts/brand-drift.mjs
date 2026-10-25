// Brand drift on the live DOM, measured through the Playwright MCP server with design-dna's CIE colour maths:
// every painted background and text colour on the public pages against the tokens of src/app/globals.css (BRAND.md).
// A colour more than 3 dE from every token is off-brand. Illustrations (traffic-light dots, placeholder greys) show up here too.
//
//   node scripts/brand-drift.mjs [light|dark] [baseUrl]
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deltaE, parseHex } from "../.claude/skills/design-dna/scripts/color-math.mjs";
const scheme = process.argv[2] === "dark" ? "dark" : "light";
const base = (process.argv[3] ?? "http://localhost:3100").replace(/\/$/, "");
const urls = ["/", "/vi", "/browse", "/pricing", "/kits", "/guides", "/mcp", "/login", "/r/tt-a1i-archify"].map((p) => base + p);
const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const hexes = (t) => Object.fromEntries([...t.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
const darkRe = /@media \(prefers-color-scheme: dark\) \{\s*:root \{([\s\S]*?)\}\s*\}/g;
const darkCss = [...css.matchAll(darkRe)].map((m) => m[1]).join(" ");
const light = hexes(css.replace(darkRe, ""));
const tokens = scheme === "dark" ? { ...light, ...hexes(darkCss) } : light;
const extra = { "panel-bg": "#0f0f14", "panel-ok": "#4cc58a", "panel-fg": "#e8e8ee", white: "#ffffff", black: "#000000", "panel-accent": "#8f7bff" };
const all = { ...tokens, ...extra };
const cfg = join(tmpdir(), `airsc-pw-${scheme}.json`);
writeFileSync(cfg, JSON.stringify({ browser: { contextOptions: { colorScheme: scheme, viewport: { width: 1440, height: 900 } } } }));
const s = spawn("npx", ["-y", "@playwright/mcp@latest", "--headless", "--isolated", "--config", cfg], { stdio: ["pipe", "pipe", "inherit"], shell: true });
let id = 0, buf = ""; const w = new Map();
s.stdout.on("data", (c) => { buf += c; for (let i; (i = buf.indexOf("\n")) >= 0; ) { const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (l.startsWith("{")) { const m = JSON.parse(l); if (m.id) w.get(m.id)?.(m); } } });
const rpc = (method, params) => new Promise((res, rej) => { const n = ++id; const t = setTimeout(() => rej(new Error(method + " timeout")), 120000); w.set(n, (m) => { clearTimeout(t); if (m.error) rej(new Error(m.error.message)); else res(m.result); }); s.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: n, method, params }) + "\n"); });
const call = async (name, args) => (await rpc("tools/call", { name, arguments: args })).content.map((c) => c.text).join("\n");
const fn = `() => {
  const out = [];
  const cv = document.createElement("canvas"); cv.width = cv.height = 1; const ctx = cv.getContext("2d", { willReadFrequently: true });
  const toRgb = (css) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#000"; ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const name = (el) => el.tagName.toLowerCase() + (typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : "");
  for (const el of document.body.querySelectorAll("*")) {
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    if (r.width < 2 || r.height < 2 || cs.display === "none" || cs.visibility === "hidden" || el.closest("svg, canvas, img, video")) continue;
    const p = toRgb(cs.backgroundColor);
    if (p[3] > 0.9) out.push({ kind: "bg", rgb: p.slice(0, 3), area: r.width * r.height, el: name(el) });
    if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) { const t = toRgb(cs.color); if (t[3] > 0.9) out.push({ kind: "text", rgb: t.slice(0, 3), area: r.width * r.height, el: name(el) }); }
  }
  return JSON.stringify(out);
}`;
await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "drift", version: "1" } });
s.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
const rows = [];
for (const u of urls) {
  await call("browser_navigate", { url: u }); await call("browser_wait_for", { time: 2 });
  const txt = await call("browser_evaluate", { function: fn });
const line = txt.split(String.fromCharCode(10)).map((l) => l.trim()).find((l) => l.startsWith('"[') || l.startsWith("[{")) ?? "";
if (!line) console.error("RAW", txt.slice(0, 300));
let json = JSON.parse(line); if (typeof json === "string") json = JSON.parse(json);
  for (const r of json) rows.push({ ...r, page: new URL(u).pathname });
}
s.kill();
const hex = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const byColor = new Map();
for (const r of rows) {
  const h = hex(r.rgb);
  const near = Object.entries(all).map(([n, t]) => [n, deltaE(r.rgb, parseHex(t))]).sort((a, b) => a[1] - b[1])[0];
  const k = `${r.kind} ${h}`;
  const e = byColor.get(k) ?? { kind: r.kind, hex: h, near: near[0], de: near[1], n: 0, pages: new Set(), els: new Map() };
  e.n++; e.pages.add(r.page); e.els.set(r.el, (e.els.get(r.el) ?? 0) + 1); byColor.set(k, e);
}
const off = [...byColor.values()].filter((e) => e.de > 3).sort((a, b) => b.n - a.n);
const totalPainted = rows.length, offN = off.reduce((a, e) => a + e.n, 0);
console.log(`${scheme}: ${urls.length} pages, ${totalPainted} painted colours (backgrounds + text), ${byColor.size} distinct, ${off.length} distinct off-token (dE>3) covering ${offN} (${((offN / totalPainted) * 100).toFixed(1)}%)`);
for (const e of off.slice(0, 14)) console.log(`  ${e.kind.padEnd(4)} ${e.hex} x${String(e.n).padEnd(4)} nearest ${e.near} dE ${e.de.toFixed(1)}  e.g. ${[...e.els.keys()][0].slice(0, 60)} @${[...e.pages][0]}`);
process.exit(0);
