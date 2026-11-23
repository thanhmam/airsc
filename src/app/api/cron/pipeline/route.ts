import { db } from "@/lib/engine/db";
import { startEngine } from "@/lib/engine/start";

/**
 * Daily cron at 08:00 Vietnam (vercel.ts). Starts the Content Engine run once per Vietnam day; on Vercel
 * Hobby the cron fires once a day at a fixed time, so the hour chosen in /admin no longer moves it.
 * Vercel signs cron calls with CRON_SECRET.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const settings = await db.settings();
  if (!settings.enabled) return Response.json({ skipped: "disabled" });
  if (await db.cronRanToday()) return Response.json({ skipped: "already ran today" });
  return Response.json({ runId: await startEngine("full", "cron") });
}
