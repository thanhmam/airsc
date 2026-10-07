import type { GhTreeEntry } from "./github";
import type { InstallInfo, McpConfig, ResourceType } from "@/lib/types";

const isSkillFile = (p: string) => /(^|\/)SKILL\.md$/i.test(p);
const isAgentFile = (p: string) => /(^|\/)(\.claude\/)?agents\/[^/]+\.md$/i.test(p) && !/readme/i.test(p);
const isRuleFile = (p: string) => /(^|\/)\.cursor\/rules\/.+\.mdc?$|(^|\/)\.cursorrules$|\.mdc$/i.test(p);
const isMarketplace = (p: string) => p === ".claude-plugin/marketplace.json";
const isPluginManifest = (p: string) => /(^|\/)\.claude-plugin\/plugin\.json$/.test(p);

/** Refine the search-query type with what the repo actually contains */
export function detectType(queryType: ResourceType, entries: GhTreeEntry[]): ResourceType {
  const paths = entries.filter((e) => e.type === "blob").map((e) => e.path);
  if (paths.some(isMarketplace) || paths.some(isPluginManifest)) return "plugin";
  if (queryType === "mcp") return "mcp";
  if (paths.some(isSkillFile)) return "skill";
  if (queryType === "rule" || paths.some(isRuleFile)) return queryType === "agent" ? "agent" : "rule";
  return queryType;
}

/** Files worth fetching for the scan + install analysis */
export function pickFiles(entries: GhTreeEntry[]): string[] {
  const blobs = entries.filter((e) => e.type === "blob" && (e.size ?? 0) < 150_000).map((e) => e.path);
  const picked = [
    ...blobs.filter(isSkillFile).slice(0, 4),
    ...blobs.filter(isAgentFile).slice(0, 3),
    ...blobs.filter((p) => /^(\.cursor\/rules\/.+\.mdc?|\.cursorrules)$/i.test(p)).slice(0, 2),
    ...blobs.filter((p) => p === "package.json"),
    ...blobs.filter((p) => /^(install|setup)[^/]*\.(sh|ps1)$|^scripts\/[^/]*install[^/]*\.sh$/i.test(p)).slice(0, 2),
    ...blobs.filter(isMarketplace),
  ];
  return [...new Set(picked)];
}

export function readmePath(entries: GhTreeEntry[]): string | null {
  const root = entries.filter((e) => e.type === "blob" && !e.path.includes("/")).map((e) => e.path);
  return root.find((p) => /^readme\.md$/i.test(p)) ?? root.find((p) => /^readme/i.test(p)) ?? null;
}

/** Pull the first usable `mcpServers` entry out of README code blocks */
export function mcpFromReadme(readme: string): { name: string; config: McpConfig } | null {
  const blocks = readme.match(/```(?:json|jsonc)?\s*\n([\s\S]*?)```/g) ?? [];
  for (const block of blocks) {
    if (!block.includes("mcpServers") && !block.includes('"command"')) continue;
    const body = block
      .replace(/```(?:json|jsonc)?\s*\n?|```/g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/,\s*([}\]])/g, "$1");
    try {
      const json = JSON.parse(body);
      const servers = json.mcpServers ?? json.mcp?.servers ?? json.servers ?? json;
      for (const [name, cfg] of Object.entries(servers as Record<string, McpConfig>)) {
        if (cfg && typeof cfg === "object" && (typeof cfg.command === "string" || typeof cfg.url === "string")) {
          return {
            name,
            config: {
              ...(cfg.command ? { command: cfg.command } : {}),
              ...(Array.isArray(cfg.args) ? { args: cfg.args.map(String) } : {}),
              ...(cfg.env && typeof cfg.env === "object" ? { env: cfg.env } : {}),
              ...(cfg.url ? { url: cfg.url } : {}),
            },
          };
        }
      }
    } catch {
      // not valid JSON (placeholders, comments) — try the next block
    }
  }
  return null;
}

/** Fallback: derive a launch command from shell snippets (uvx / npx / `claude mcp add`) in the README */
export function mcpFromCommands(readme: string, repo: string): { name: string; config: McpConfig } | null {
  const name = repo.replace(/^mcp[-_]server[-_]|^mcp[-_]|[-_]mcp([-_]server)?$/gi, "") || repo;
  const remote = readme.match(/claude mcp add[^\n`]*?--transport (?:http|sse)\s+\S+\s+(https:\/\/[^\s`"']+)/i);
  if (remote) return { name, config: { url: remote[1] } };
  const pkg = "(@?[a-z0-9][\\w.-]*(?:\\/[\\w.-]+)?(?:@[\\w.^~-]+)?)";
  const uvx = readme.match(new RegExp(`(?:^|[\\s\`"'])uvx\\s+(?:--from\\s+\\S+\\s+)?${pkg}`, "im"));
  if (uvx && !uvx[1].startsWith("-")) return { name, config: { command: "uvx", args: [uvx[1]] } };
  const npx = readme.match(new RegExp(`(?:^|[\\s\`"'])npx\\s+(?:-y\\s+|--yes\\s+)?${pkg}`, "im"));
  if (npx && /mcp/i.test(npx[1]) && !npx[1].startsWith("-")) return { name, config: { command: "npx", args: ["-y", npx[1]] } };
  return null;
}

export function buildInstall(args: {
  type: ResourceType;
  fullName: string;
  repo: string;
  branch: string;
  entries: GhTreeEntry[];
  readme: string;
  packageJson: Record<string, unknown> | null;
}): { install: InstallInfo; npmPackage: string | null } {
  const { type, fullName, repo, entries, readme, packageJson } = args;
  const blobs = entries.filter((e) => e.type === "blob").map((e) => e.path);
  const clone = `git clone --depth 1 https://github.com/${fullName}.git /tmp/airsc-${repo}`;
  const pkgName =
    packageJson && typeof packageJson.name === "string" && !packageJson.private ? packageJson.name : null;

  if (type === "plugin" && blobs.some(isMarketplace)) {
    return {
      npmPackage: null,
      install: {
        kind: "plugin",
        commands: [
          { label: "Claude Code", cmd: `/plugin marketplace add ${fullName}` },
          { label: "Claude Code", cmd: `/plugin install <plugin-name>@${repo}` },
        ],
      },
    };
  }

  if (type === "mcp") {
    const fromReadme = mcpFromReadme(readme) ?? mcpFromCommands(readme, repo);
    const hasBin = !!packageJson?.bin;
    const mcp =
      fromReadme ??
      (pkgName && (hasBin || /mcp/i.test(pkgName))
        ? { name: repo.replace(/^mcp-|-mcp(-server)?$/g, "") || repo, config: { command: "npx", args: ["-y", pkgName] } }
        : null);
    return {
      npmPackage: pkgName,
      install: mcp ? { kind: "mcp", mcp } : { kind: "manual", commands: [{ label: "Clone", cmd: clone }] },
    };
  }

  if (type === "skill" || blobs.some(isSkillFile)) {
    const dirs = blobs.filter(isSkillFile).map((p) => p.replace(/\/?SKILL\.md$/i, "") || ".").slice(0, 20);
    const first = dirs[0] ?? ".";
    const skillName = first === "." ? repo : first.split("/").pop()!;
    return {
      npmPackage: null,
      install: {
        kind: "skill",
        paths: dirs,
        commands: [
          {
            label: "Claude Code",
            cmd: `${clone} && mkdir -p ~/.claude/skills && cp -R /tmp/airsc-${repo}/${first === "." ? "" : first} ~/.claude/skills/${skillName}`,
          },
        ],
      },
    };
  }

  if (type === "agent") {
    const files = blobs.filter(isAgentFile).slice(0, 50);
    const dir = files[0]?.replace(/\/[^/]+$/, "") ?? "agents";
    return {
      npmPackage: null,
      install: {
        kind: "agent",
        paths: files,
        commands: [{ label: "Claude Code", cmd: `${clone} && mkdir -p ~/.claude/agents && cp /tmp/airsc-${repo}/${dir}/*.md ~/.claude/agents/` }],
      },
    };
  }

  if (type === "rule") {
    const files = blobs.filter(isRuleFile).slice(0, 50);
    return {
      npmPackage: null,
      install: {
        kind: "rule",
        paths: files,
        commands: [{ label: "Cursor", cmd: `${clone} && mkdir -p .cursor/rules && cp -R /tmp/airsc-${repo}/.cursor/rules/. .cursor/rules/` }],
      },
    };
  }

  return { npmPackage: pkgName, install: { kind: "manual", commands: [{ label: "Clone", cmd: clone }] } };
}

/** Strip badges / HTML / images so the excerpt reads cleanly */
export function cleanReadme(md: string, max = 6000): string {
  return md
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(picture|p|div|a|img|br|h\d|source|details|summary|sup|sub|table|tr|td|th)[^>]*>/gi, "")
    .replace(/<\/(picture|p|div|a|h\d|details|summary|sup|sub|table|tr|td|th)>/gi, "")
    .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}
