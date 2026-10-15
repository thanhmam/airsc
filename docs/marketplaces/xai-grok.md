# xAI marketplace submission (Grok Bot, Cursor)

Form: https://x.ai/bot/marketplace/submit-a-plugin. Values to paste, kept here so the next update
uses the same wording. Re-check the live server (bottom of this file) before submitting.

| Field | Value |
|---|---|
| Organization Name | Airsc |
| Organization Handle | `airsc` |
| Website URL | https://airsc.vercel.app |
| Logotype URL | https://airsc.vercel.app/brand/airsc-app-icon-512.png (512×512 PNG, Violet plate) |
| Distribution Platforms | Grok Bot, Cursor (and Grok when it opens) |
| MCP Server URL | https://airsc.vercel.app/api/mcp |

## Brief Description

Airsc is a safety-checked library of 1,100+ ready-made AI agent resources: Claude skills, MCP servers,
Claude Code plugins, subagents and Cursor rules, found daily on GitHub, npm and the MCP Registry,
scanned for risky code and summarised. The Airsc MCP server lets your agent find the right one before
writing a capability from scratch: search by what you want to build, read a resource's safety rating,
license and source, browse goal-based kits (payments, auth, landing pages, SEO…), and get exact install
steps. Free, no account or API key, Streamable HTTP.

## Testing Instructions

No key or sign-in needed. Remote MCP server, Streamable HTTP: `https://airsc.vercel.app/api/mcp`

Cursor: Settings → MCP → Add a custom MCP server, or `~/.cursor/mcp.json`:

```json
{ "mcpServers": { "airsc": { "url": "https://airsc.vercel.app/api/mcp" } } }
```

Then ask the agent:

1. "Find me a skill for landing page design." → `search_resources` returns ranked resources with safety
   rating, stars, license and a link.
2. "Tell me more about archify. Is it safe?" → `get_resource` (slug `tt-a1i-archify`) returns the GitHub
   source, summary, safety notes, license and install instructions.
3. "What kits do you have?" then "Show the beautiful-landing-page kit." → `list_kits`, `get_kit`.
4. "Install archify." → `install_resource` returns the source and step-by-step install instructions; the
   agent should state the safety rating first.

Tools: `search_resources`, `get_resource`, `list_kits`, `get_kit` (read-only) and `install_resource`
(returns instructions only; it never runs anything on the user's machine). An optional `airsc_…` API key
(`Authorization: Bearer` or `?key=`) only adds an install history to the user's Airsc account.

## Check before submitting

```sh
curl -s -X POST https://airsc.vercel.app/api/mcp \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Expect five tools. Then `tools/call` `search_resources` with `{"query":"landing page design"}` should
return results.
