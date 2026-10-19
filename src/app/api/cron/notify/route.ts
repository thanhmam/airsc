import { runDailyAlerts } from "@/lib/alerts";

/**
 * Daily cron (vercel.ts), after the Content Engine run. Turns changes to saved resources into notifications
 * and emails them. Vercel signs cron calls with CRON_SECRET. Safe to call again: nothing is sent twice.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json(await runDailyAlerts());
}
