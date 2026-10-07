import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  regions: ["sin1"],
  // hourly check; the route starts the run at the hour (Vietnam time) chosen in /admin
  crons: [{ path: "/api/cron/pipeline", schedule: "0 * * * *" }],
};
