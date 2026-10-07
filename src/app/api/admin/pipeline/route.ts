import { requireAdmin } from "@/lib/admin";
import { startEngine, type Preset } from "@/lib/engine/start";
import { start } from "workflow/api";
import { contentEngine, type EngineOptions } from "@/workflows/content-engine";

/** Manual run: signed-in admin, or CRON_SECRET for scripts. Body: { preset } or explicit EngineOptions */
export async function POST(req: Request) {
  const viaSecret = !!process.env.CRON_SECRET && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  if (!viaSecret && !(await requireAdmin())) return new Response("Forbidden", { status: 403 });
  const body = (await req.json().catch(() => ({}))) as EngineOptions & { preset?: Preset };
  if (body.preset) return Response.json({ runId: await startEngine(body.preset, "manual") });
  const run = await start(contentEngine, [{ ...body, trigger: body.trigger ?? "manual" }]);
  return Response.json({ runId: run.runId });
}
