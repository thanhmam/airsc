import { crawl } from "@/lib/crawler/run";

export const maxDuration = 800;

/** Daily refresh (vercel.ts cron). Vercel signs cron calls with CRON_SECRET. */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const logs: string[] = [];
  const result = await crawl({ limit: 400, log: (m) => logs.push(m) });
  return Response.json({ ...result, logs: logs.slice(-20) });
}
