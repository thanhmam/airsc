import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { getKit, getKits, getResource, searchResources } from "@/lib/data";
import { logSearch } from "@/lib/engine/signals";
import { agentPrompt } from "@/lib/install-links";
import { LIMITS, quota } from "@/lib/quota";
import { anonClient } from "@/lib/supabase/anon";
import { RESOURCE_TYPES } from "@/lib/types";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://airsc.vercel.app";
const text = (value: unknown) => ({
  content: [{ type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
});

/** Salted hash of the caller's IP, set per request: the Free limit of a caller without a key */
const caller = new AsyncLocalStorage<string>();
const hashIp = (req: Request) => {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  return ip ? createHash("sha256").update(ip + (process.env.AIRSC_INGEST_TOKEN ?? "")).digest("hex").slice(0, 32) : undefined;
};

type Ctx = { http?: { authInfo?: { token?: string } } };

/**
 * Free tier limits (Pro is unlimited). Returns a message for the agent to relay when the limit is reached.
 * "mcp" counts every tool call; "install" counts resources whose install instructions are handed out.
 */
async function gate(ctx: Ctx, kind: "mcp" | "install", slug?: string): Promise<string | null> {
  const apiKey = ctx.http?.authInfo?.token || undefined;
  const q = await quota(kind, { apiKey, anon: caller.getStore() }, { slug });
  if (q.allowed) return null;
  const what = kind === "install" ? "install instructions for new resources" : "Airsc requests";
  const rest = q.signed_in
    ? `It resets at midnight (Vietnam time). Airsc Pro is unlimited: ${site}/pricing`
    : `Create a free key at ${site}/account to get ${LIMITS.free[kind]} a day, or go Pro for unlimited use: ${site}/pricing`;
  return `Daily limit reached: ${q.used} of ${q.limit} ${what} used today. ${rest} Tell the user this.`;
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "search_resources",
      {
        title: "Search Airsc",
        annotations: { readOnlyHint: true, openWorldHint: false },
        description:
          "Find ready-made Claude skills, MCP servers, Claude Code plugins, subagents and Cursor rules for what the user wants to build or add (payments, auth, database, UI design, SEO, deploy, email, browser automation…). " +
          "Use this before writing a capability from scratch. Query with plain English keywords, e.g. 'stripe payments', 'supabase', 'landing page design'. Free.",
        inputSchema: z.object({
          query: z.string().describe("What the user wants, e.g. 'stripe payments' or 'landing page design'"),
          type: z.enum(RESOURCE_TYPES as [string, ...string[]]).optional(),
          safe_only: z.boolean().optional().describe("Only return resources rated Safe"),
          limit: z.number().int().min(1).max(20).optional(),
        }),
      },
      async ({ query, type, safe_only, limit }, ctx) => {
        const denied = await gate(ctx, "mcp");
        if (denied) return text(denied);
        const { items, total } = await searchResources({
          q: query,
          type: type as (typeof RESOURCE_TYPES)[number] | undefined,
          safeOnly: safe_only,
          pageSize: limit ?? 8,
        });
        logSearch({ q: query, results: total, source: "mcp" });
        return text({
          total,
          results: items.map((r) => ({
            slug: r.slug,
            name: r.name,
            type: r.type,
            safety: r.safety,
            stars: r.stars,
            license: r.license,
            summary: r.summary ?? r.description,
            url: `${site}/r/${r.slug}`,
          })),
        });
      },
    );

    server.registerTool(
      "get_resource",
      {
        title: "Resource details",
        annotations: { readOnlyHint: true, openWorldHint: false },
        description: "Get details for one resource: GitHub source, summary, safety notes, license, level and use cases. Use install_resource for the install instructions. Free (daily limit without Pro).",
        inputSchema: z.object({ slug: z.string() }),
      },
      async ({ slug }, ctx) => {
        const denied = await gate(ctx, "mcp");
        if (denied) return text(denied);
        const r = await getResource(slug);
        if (!r) return text(`No resource with slug "${slug}".`);
        return text({
          slug: r.slug,
          name: r.name,
          type: r.type,
          source: r.repo_url,
          summary: r.summary ?? r.description,
          category: r.category,
          level: r.level,
          use_cases: r.use_cases.map((u) => u.en),
          safety: r.safety,
          safety_notes: r.safety_notes.map((n) => `${n.level}: ${n.en}${n.file ? ` (${n.file})` : ""}`),
          license: r.license,
          next: `Call install_resource with slug "${r.slug}" for the exact install instructions.`,
          url: `${site}/r/${r.slug}`,
        });
      },
    );

    server.registerTool(
      "list_kits",
      {
        title: "List kits",
        annotations: { readOnlyHint: true, openWorldHint: false },
        description: "List goal-based kits (bundles of the best resources for payments, auth, landing pages, SEO, etc.).",
        inputSchema: z.object({}),
      },
      async (_input, ctx) => {
        const denied = await gate(ctx, "mcp");
        if (denied) return text(denied);
        const kits = await getKits();
        return text(kits.map((k) => ({ slug: k.slug, title: k.title, description: k.description, items: k.count })));
      },
    );

    server.registerTool(
      "get_kit",
      {
        title: "Kit details",
        annotations: { readOnlyHint: true, openWorldHint: false },
        description: "List the resources inside one kit.",
        inputSchema: z.object({ slug: z.string() }),
      },
      async ({ slug }, ctx) => {
        const denied = await gate(ctx, "mcp");
        if (denied) return text(denied);
        const data = await getKit(slug);
        if (!data) return text(`No kit with slug "${slug}".`);
        return text({
          title: data.kit.title,
          description: data.kit.description,
          resources: data.items.map((r) => ({ slug: r.slug, name: r.name, type: r.type, safety: r.safety })),
        });
      },
    );

    server.registerTool(
      "install_resource",
      {
        title: "Install a resource",
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        description:
          "Get the GitHub source and step-by-step install instructions for a resource, ready to follow. Free with a daily limit (no key needed: an optional free Airsc API key raises the limit and keeps a history in the user's account; Pro is unlimited). Always tell the user the safety rating before installing anything rated caution or danger.",
        inputSchema: z.object({ slug: z.string() }),
      },
      async ({ slug }, ctx) => {
        const denied = (await gate(ctx, "mcp")) ?? (await gate(ctx, "install", slug));
        if (denied) return text(denied);
        const key = ctx.http?.authInfo?.token ?? "";
        const { data, error } = await anonClient().rpc("mcp_download", { p_api_key: key, p_slug: slug });
        if (error) return text(`Install failed: ${error.message}`);
        if (!data.ok) return text(`No resource with slug "${slug}".`);
        const r = await getResource(slug);
        return text({
          source: data.repo_url,
          instructions: r ? agentPrompt(r) : undefined,
          commands: r?.install.commands,
          mcp_config: r?.install.mcp,
          safety: r?.safety,
        });
      },
    );
  },
  {
    serverInfo: { name: "airsc", version: "0.1.3" },
    instructions:
      "Airsc is a searchable, safety-checked library of ready-made AI agent resources: Claude skills, MCP servers, Claude Code plugins, subagents and Cursor rules. " +
      "Use it whenever the user wants to add a capability to their agent or project (e.g. payments, auth, database, landing page design, SEO, deploy, email, charts, a chatbot), " +
      "asks for a skill/MCP/plugin/rule/subagent, or asks 'is there a tool for X'. " +
      "Workflow: search_resources (free) -> get_resource for the best match (free, shows safety notes) -> tell the user the safety label -> install_resource (free) and follow its instructions. " +
      "For a whole goal, try list_kits / get_kit first. Prefer resources rated 'safe'; ask before installing anything rated 'caution' or 'danger'. " +
      "Free use has a daily limit: if a tool says the limit is reached, pass that message on to the user as it is.",
  },
);

/** Key comes from `Authorization: Bearer airsc_…` or `?key=airsc_…` (for clients that only take a URL) */
const authed = withMcpAuth(
  handler,
  (req, bearer) => {
    const token = bearer ?? new URL(req.url).searchParams.get("key") ?? undefined;
    return token?.startsWith("airsc_") ? { token, clientId: "airsc-user", scopes: [] } : undefined;
  },
  { required: false },
);

/**
 * Browser-based MCP clients (Grok, Cursor's web views, the MCP Inspector) need CORS. Any origin is fine:
 * nothing rides on cookies, the optional key travels in a header or the URL.
 */
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version, WWW-Authenticate",
  "Access-Control-Max-Age": "86400",
};

const withCors = (h: (req: Request) => Promise<Response>) => async (req: Request) => {
  const ip = hashIp(req);
  const res = ip ? await caller.run(ip, () => h(req)) : await h(req);
  // a fresh Response keeps the (streamed) body and lets us add headers
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(CORS)) out.headers.set(k, v);
  return out;
};

const cors = withCors(authed);

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export { cors as GET, cors as POST, cors as DELETE };
