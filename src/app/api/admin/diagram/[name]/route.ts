import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { requireAdmin } from "@/lib/admin";
import { DIAGRAMS, type DiagramName } from "@/lib/pm/diagrams";

/** The Archify diagrams shown in /admin/pm/architecture (self-contained HTML, admin only) */
const FILES: Record<DiagramName, () => Promise<Buffer>> = {
  // literal paths so the files are traced into the deployment
  architecture: () => readFile(join(process.cwd(), "src/lib/pm/diagrams/architecture.html")),
  "content-engine": () => readFile(join(process.cwd(), "src/lib/pm/diagrams/content-engine.html")),
  "x-daily-post": () => readFile(join(process.cwd(), "src/lib/pm/diagrams/x-daily-post.html")),
};

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/diagram/[name]">) {
  if (!(await requireAdmin())) return new Response("Forbidden", { status: 403 });
  const { name } = await ctx.params;
  if (!DIAGRAMS.some((d) => d.name === name)) return new Response("Not found", { status: 404 });
  const html = await FILES[name as DiagramName]();
  return new Response(new Uint8Array(html), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, max-age=300", "X-Frame-Options": "SAMEORIGIN" },
  });
}
