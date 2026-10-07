import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { getKit, getKits, getResource, searchResources } from "@/lib/data";
import { agentPrompt } from "@/lib/install-links";
import { anonClient } from "@/lib/supabase/anon";
import { RESOURCE_TYPES } from "@/lib/types";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://airsc.vercel.app";
const text = (value: unknown) => ({
  content: [{ type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
});

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
      async ({ query, type, safe_only, limit }) => {
        const { items, total } = await searchResources({
          q: query,
          type: type as (typeof RESOURCE_TYPES)[number] | undefined,
          safeOnly: safe_only,
          pageSize: limit ?? 8,
        });
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
        description: "Get full details for one resource: GitHub source, summary, safety notes, license, level, use cases and exact install instructions. Free.",
        inputSchema: z.object({ slug: z.string() }),
      },
      async ({ slug }) => {
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
          install: r.install,
          install_instructions: agentPrompt(r),
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
      async () => {
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
      async ({ slug }) => {
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
          "Get the GitHub source and step-by-step install instructions for a resource, ready to follow. Free, no key needed (an optional Airsc API key keeps a history in the user's account). Always tell the user the safety rating before installing anything rated caution or danger.",
        inputSchema: z.object({ slug: z.string() }),
      },
      async ({ slug }, ctx) => {
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
    serverInfo: { name: "airsc", version: "0.1.2" },
    instructions:
      "Airsc is a searchable, safety-checked library of ready-made AI agent resources: Claude skills, MCP servers, Claude Code plugins, subagents and Cursor rules. " +
      "Use it whenever the user wants to add a capability to their agent or project (e.g. payments, auth, database, landing page design, SEO, deploy, email, charts, a chatbot), " +
      "asks for a skill/MCP/plugin/rule/subagent, or asks 'is there a tool for X'. " +
      "Workflow: search_resources (free) -> get_resource for the best match (free, shows safety notes) -> tell the user the safety label -> install_resource (free) and follow its instructions. " +
      "For a whole goal, try list_kits / get_kit first. Prefer resources rated 'safe'; ask before installing anything rated 'caution' or 'danger'.",
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

export { authed as GET, authed as POST, authed as DELETE };
