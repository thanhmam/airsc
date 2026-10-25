// Mobile audit of the public pages, driven through the Playwright MCP server (microsoft/playwright-mcp)
// as an MCP client over stdio, so it adds no package to package.json (the server is fetched by npx).
//
//   node scripts/mobile-audit.mjs [baseUrl] [--json]
//
// Per page, at 390x844: horizontal overflow (page wider than the screen and which elements stick out),
// text fields under 16px (iOS zooms into them on tap), tap targets under 40px, and console errors.
import { spawn } from "node:child_process";

const base = (process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100").replace(/\/$/, "");
const asJson = process.argv.includes("--json");
const PAGES = ["/", "/vi", "/browse", "/kits", "/guides", "/mcp", "/pricing", "/login", "/r/tt-a1i-archify", "/vi/r/tt-a1i-archify"];

const server = spawn("npx", ["-y", "@playwright/mcp@latest", "--headless", "--isolated", "--viewport-size", "390x844"], {
  stdio: ["pipe", "pipe", "inherit"],
  shell: process.platform === "win32",
});

let seq = 0;
let buffer = "";
const waiting = new Map();
server.stdout.on("data", (chunk) => {
  buffer += chunk;
  for (let i; (i = buffer.indexOf("\n")) >= 0; ) {
    const line = buffer.slice(0, i).trim();
    buffer = buffer.slice(i + 1);
    if (!line.startsWith("{")) continue;
    const msg = JSON.parse(line);
    if (msg.id !== undefined) waiting.get(msg.id)?.(msg);
  }
});
const rpc = (method, params) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => reject(new Error(`${method} timed out`)), 120_000);
    waiting.set(id, (m) => (clearTimeout(timer), m.error ? reject(new Error(m.error.message)) : resolve(m.result)));
    server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  });
const call = async (name, args) => {
  const r = await rpc("tools/call", { name, arguments: args });
  const text = r.content?.map((c) => c.text ?? "").join("\n") ?? "";
  if (r.isError) throw new Error(`${name}: ${text.slice(0, 300)}`);
  return text;
};

/** Runs in the page */
const inspect = `() => {
  const w = window.innerWidth;
  const doc = document.documentElement;
  const name = (el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\\s+/).slice(0, 2).join(".") : "");
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
  const sticking = [...document.body.querySelectorAll("*")].filter((el) => {
    if (!visible(el)) return false;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX)) return false;
    return el.getBoundingClientRect().right > w + 1;
  }).slice(0, 3).map(name);
  const fields = [...document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea")].filter(visible);
  const small = [...document.querySelectorAll("a[href], button, [role=button], input:not([type=hidden]), select, textarea, summary")].filter(visible).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.height < 40 && !el.closest("p, li > a:only-child") ;
  });
  return JSON.stringify({
    scrollWidth: doc.scrollWidth,
    innerWidth: w,
    overflowBy: Math.max(0, doc.scrollWidth - w),
    sticking,
    fieldsUnder16px: fields.filter((f) => parseFloat(getComputedStyle(f).fontSize) < 16).length,
    fields: fields.length,
    tapTargetsUnder40px: small.length,
    tapSamples: small.slice(0, 8).map((el) => name(el) + " " + Math.round(el.getBoundingClientRect().width) + "x" + Math.round(el.getBoundingClientRect().height) + " " + (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 20)),
    height: doc.scrollHeight,
    stickyHeader: Math.round(document.querySelector('body > div.sticky')?.getBoundingClientRect().height ?? 0),
  });
}`;

const results = [];
try {
  await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "airsc-mobile-audit", version: "1" } });
  server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
  for (const path of PAGES) {
    const row = { path };
    try {
      await call("browser_navigate", { url: base + path });
      await call("browser_wait_for", { time: 2 });
      const out = await call("browser_evaluate", { function: inspect });
      const json = out.match(/\{[\s\S]*?\}(?=\s*(?:\n|$))/)?.[0] ?? out.match(/"(\{.*\})"/)?.[1]?.replace(/\\"/g, '"');
      Object.assign(row, JSON.parse(json));
      const logs = await call("browser_console_messages", { level: "error" });
      row.consoleErrors = (logs.match(/\[ERROR\]/g) ?? []).length;
    } catch (e) {
      row.error = String(e.message ?? e).slice(0, 200);
    }
    results.push(row);
  }
} finally {
  server.kill();
}

if (asJson) console.log(JSON.stringify(results, null, 2));
else {
  console.log(`Mobile audit, 390x844, ${base}\n`);
  console.log("page".padEnd(24), "overflow".padEnd(9), "fields<16".padEnd(10), "taps<40".padEnd(8), "errors");
  for (const r of results)
    console.log(
      r.path.padEnd(24),
      r.error ? `ERROR ${r.error}` : `${String(r.overflowBy)}px`.padEnd(9),
      r.error ? "" : `${r.fieldsUnder16px}/${r.fields}`.padEnd(10),
      r.error ? "" : String(r.tapTargetsUnder40px).padEnd(8),
      r.error ? "" : r.consoleErrors,
      r.sticking?.length ? `  sticks out: ${r.sticking.join(", ")}` : "",
    );
  const bad = results.filter((r) => r.error || r.overflowBy > 0);
  const sum = (k) => results.reduce((n, r) => n + (r[k] ?? 0), 0);
  console.log(
    `\n${results.length} pages, ${bad.length} wider than the screen or failed. Tap targets under 40px: ${sum("tapTargetsUnder40px")}. Text fields under 16px: ${sum("fieldsUnder16px")}. Sticky header: ${results[0]?.stickyHeader}px.`,
  );
}
process.exit(0);
