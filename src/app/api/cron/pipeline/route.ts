import { db } from "@/lib/engine/db";
import { startEngine, vnHour } from "@/lib/engine/start";

/**
 * Hourly cron (vercel.ts). Starts the daily Content Engine run once per Vietnam day, at the hour
 * chosen in /admin. Vercel signs cron calls with CRON_SECRET.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const settings = await db.settings();
  if (!settings.enabled) return Response.json({ skipped: "disabled" });
  if (vnHour() !== settings.run_hour_vn) return Response.json({ skipped: "not the scheduled hour", hourVN: vnHour() });
  if (await db.cronRanToday()) return Response.json({ skipped: "already ran today" });
  return Response.json({ runId: await startEngine("full", "cron") });
}
