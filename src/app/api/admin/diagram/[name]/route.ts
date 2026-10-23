import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { requireAdmin } from "@/lib/admin";
import { snapshotById } from "@/lib/pm/diagrams";

/**
 * One Archify diagram of a snapshot shown in /admin/pm/architecture (self-contained HTML, admin only):
 * /api/admin/diagram/architecture?v=2026-10-16-aa0701e. Without ?v= it is the latest snapshot. The snapshot and
 * the diagram must be in the registry, so the path read from disk is never built from anything else.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/admin/diagram/[name]">) {
  if (!(await requireAdmin())) return new Response("Forbidden", { status: 403 });
  const { name } = await ctx.params;
  const snapshot = snapshotById(new URL(req.url).searchParams.get("v"));
  if (!snapshot.diagrams.some((d) => d.name === name)) return new Response("Not found", { status: 404 });
  // the folders are listed in outputFileTracingIncludes (next.config.ts) so they are part of the deployment
  const html = await readFile(join(process.cwd(), "src/lib/pm/diagrams/snapshots", snapshot.id, `${name}.html`));
  return new Response(new Uint8Array(html), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, max-age=300", "X-Frame-Options": "SAMEORIGIN" },
  });
}
