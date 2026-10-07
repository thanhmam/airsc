import type { InstallInfo, McpConfig } from "@/lib/types";

const b64 = (s: string) =>
  typeof window === "undefined" ? Buffer.from(s, "utf8").toString("base64") : btoa(unescape(encodeURIComponent(s)));

/** https://docs.cursor.com/context/mcp — one-click install deeplink */
export function cursorDeeplink(name: string, config: McpConfig): string {
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(name)}&config=${encodeURIComponent(
    b64(JSON.stringify(config)),
  )}`;
}

export function claudeDesktopConfig(name: string, config: McpConfig): string {
  // Claude desktop's config file only launches local (stdio) servers; remote URLs go through mcp-remote
  const entry = config.url ? { command: "npx", args: ["-y", "mcp-remote", config.url] } : config;
  return JSON.stringify({ mcpServers: { [name]: entry } }, null, 2);
}

export function zipUrl(fullName: string, branch: string) {
  return `https://codeload.github.com/${fullName}/zip/refs/heads/${branch}`;
}

/** A prompt the user can paste into any coding agent to install the resource for them */
export function agentPrompt(r: {
  name: string;
  type: string;
  full_name: string;
  default_branch: string;
  install: InstallInfo;
}): string {
  const repo = `https://github.com/${r.full_name}`;
  const i = r.install;
  if (i.kind === "mcp" && i.mcp) {
    return `Add the MCP server "${i.mcp.name}" (${repo}) to my MCP config with this entry:\n${JSON.stringify(
      { [i.mcp.name]: i.mcp.config },
      null,
      2,
    )}\nIf it needs API keys, tell me where to get them before editing anything.`;
  }
  if (i.kind === "plugin") {
    return `Install the Claude Code plugin marketplace ${r.full_name}: run "/plugin marketplace add ${r.full_name}", then list its plugins and install the one I need.`;
  }
  if (i.kind === "skill") {
    const path = i.paths?.[0] && i.paths[0] !== "." ? `/tree/${r.default_branch}/${i.paths[0]}` : "";
    return `Install the agent skill "${r.name}" from ${repo}${path} into ~/.claude/skills/ (copy the whole folder that contains SKILL.md). Read SKILL.md first and tell me what it does and whether it runs any scripts.`;
  }
  if (i.kind === "agent") {
    return `Install the Claude Code subagents from ${repo} into ~/.claude/agents/ (the .md files${
      i.paths?.[0] ? ` in ${i.paths[0].replace(/\/[^/]+$/, "")}` : ""
    }). Show me the list of agents you installed.`;
  }
  if (i.kind === "rule") {
    return `Add the Cursor rules from ${repo} to this project's .cursor/rules/ folder. Show me which rules you added.`;
  }
  return `Look at ${repo}, explain what it does in two sentences, and install it into this project following its README. Ask me before running any script.`;
}
