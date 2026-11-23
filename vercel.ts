import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  regions: ["sin1"],
  // Vercel Hobby runs a cron at most once a day, somewhere within its hour (times in UTC):
  // the engine run at 08:00 Vietnam, and the X run at 20:30 Vietnam, which drafts the day's
  // spotlights and sends the one post whose time has come
  crons: [
    { path: "/api/cron/pipeline", schedule: "0 1 * * *" },
    { path: "/api/cron/social", schedule: "30 13 * * *" },
  ],
};
