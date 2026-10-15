import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  regions: ["sin1"],
  // hourly checks (Vietnam time): the engine run at the hour chosen in /admin,
  // the X post about Today's picks from the hour chosen in /admin/social
  crons: [
    { path: "/api/cron/pipeline", schedule: "0 * * * *" },
    { path: "/api/cron/social", schedule: "5 * * * *" },
  ],
};
