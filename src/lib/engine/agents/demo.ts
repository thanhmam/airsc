import { Sandbox } from "@vercel/sandbox";
import type { Resource } from "@/lib/types";

/**
 * Minimal MCP stdio client, run with `node` inside the sandbox: starts the server, performs the
 * initialize handshake, lists tools and prints them as one JSON line. Gives slow servers 60s.
 */
export const CLIENT = String.raw`
const { spawn } = require("child_process");
const [cmd, ...args] = JSON.parse(process.argv[1]);
const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "inherit"], env: process.env });
const NL = String.fromCharCode(10);
let buf = "", id = 0;
const pending = new Map();
child.stdout.on("data", (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf(NL)) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line.startsWith("{")) continue;
    try { const m = JSON.parse(line); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } } catch {}
  }
});
const send = (msg) => child.stdin.write(JSON.stringify(msg) + NL);
const call = (method, params) => new Promise((res) => { const n = ++id; pending.set(n, res); send({ jsonrpc: "2.0", id: n, method, params }); });
const fail = (msg) => { console.log(JSON.stringify({ error: msg })); child.kill(); process.exit(0); };
setTimeout(() => fail("timeout after 60s"), 60000);
child.on("exit", (code) => fail("server exited with code " + code));
(async () => {
  const init = await call("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "airsc-demo", version: "1" } });
  if (init.error) fail("initialize: " + init.error.message);
  send({ jsonrpc: "2.0", method: "notifications/initialized" });
  const list = await call("tools/list", {});
  // print only names + short descriptions: full schemas can exceed the 64KB output limit
  const tools = list.result && list.result.tools ? list.result.tools.map((t) => ({ name: t.name, description: (t.description || "").slice(0, 200) })) : null;
  console.log(JSON.stringify(tools ? { tools } : { error: list.error ? list.error.message : "no tools" }));
  child.kill(); process.exit(0);
})();
`;

export type McpToolsDemo = {
  kind: "mcp_tools";
  ok: boolean;
  tools?: { name: string; description?: string }[];
  command?: string;
  error?: string;
  verified_at: string;
};

/** Servers that need API keys or a local app can't start unattended: skip rather than fail */
export function demoable(r: Resource): boolean {
  const cfg = r.install.mcp?.config;
  // npx only for now: the node24 sandbox runtime has no Python/uv for uvx servers
  if (cfg?.command !== "npx") return false;
  const needsSecrets = Object.keys(cfg.env ?? {}).some((k) => /key|token|secret|password|auth/i.test(k));
  return !needsSecrets;
}

/**
 * Demo agent: boots the MCP server inside an isolated Vercel Sandbox VM and records its real
 * tool list via the MCP Inspector CLI. The repo's code never runs on Airsc's own servers.
 */
export async function demoMcp(r: Resource): Promise<McpToolsDemo> {
  const cfg = r.install.mcp!.config;
  const command = [cfg.command!, ...(cfg.args ?? [])].join(" ");
  const verified_at = new Date().toISOString();
  let sandbox: Sandbox | undefined;
  try {
    sandbox = await Sandbox.create({ runtime: "node24", timeout: 5 * 60_000, resources: { vcpus: 2 } });
    // Pre-install the server and the inspector so the server starts within the inspector's 15s connect window
    const args = cfg.args ?? [];
    const pkgIndex = args.findIndex((a) => !a.startsWith("-"));
    if (pkgIndex < 0) return { kind: "mcp_tools", ok: false, command, error: "no package in args", verified_at };
    const pkg = args[pkgIndex];
    const serverArgs = args.slice(pkgIndex + 1);
    const install = await sandbox.runCommand({
      cmd: "sh",
      args: ["-c", `mkdir -p /tmp/m && cd /tmp/m && npm init -y >/dev/null && npm i --no-audit --no-fund --loglevel=error ${JSON.stringify(pkg)}`],
      signal: AbortSignal.timeout(150_000),
    });
    if (install.exitCode !== 0) {
      return { kind: "mcp_tools", ok: false, command, error: `install failed: ${(await install.stderr()).slice(-160)}`, verified_at };
    }
    const run = await sandbox.runCommand({
      cmd: "node",
      args: ["-e", CLIENT, JSON.stringify(["npx", "--no-install", pkg, ...serverArgs])],
      cwd: "/tmp/m",
      env: { ...(cfg.env ?? {}), CI: "1", NO_COLOR: "1" },
      signal: AbortSignal.timeout(90_000),
    });
    const out = await run.stdout();
    if (!out.includes("{")) {
      return { kind: "mcp_tools", ok: false, command, error: (await run.stderr()).trim().split("\n").pop()?.slice(0, 200) ?? "no output", verified_at };
    }
    const json = out.slice(out.indexOf("{"));
    const parsed = JSON.parse(json.split("\n")[0]) as { tools?: { name: string; description?: string }[]; error?: string };
    if (parsed.error) return { kind: "mcp_tools", ok: false, command, error: parsed.error.slice(0, 200), verified_at };
    const tools = (parsed.tools ?? []).map((t) => ({ name: t.name, description: t.description?.slice(0, 200) }));
    return tools.length
      ? { kind: "mcp_tools", ok: true, tools: tools.slice(0, 60), command, verified_at }
      : { kind: "mcp_tools", ok: false, command, error: "no tools listed", verified_at };
  } catch (e) {
    return { kind: "mcp_tools", ok: false, command, error: String((e as Error).message).slice(0, 200), verified_at };
  } finally {
    await sandbox?.stop().catch(() => {});
  }
}
