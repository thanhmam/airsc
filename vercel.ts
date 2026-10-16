import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  regions: ["sin1"],
  // hourly checks (Vietnam time): the engine run at the hour chosen in /admin,
  // the X post about Today's picks at :30 from the hour chosen in /admin/social
  // (half an hour after the engine run, which takes about 10 minutes)
  crons: [
    { path: "/api/cron/pipeline", schedule: "0 * * * *" },
    { path: "/api/cron/social", schedule: "30 * * * *" },
  ],
};
