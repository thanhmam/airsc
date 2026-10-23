import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  // the admin's Archify diagrams are read from disk at request time
  outputFileTracingIncludes: { "/api/admin/diagram/*": ["src/lib/pm/diagrams/snapshots/**/*.html"] },
  // screenshots for applied X posts go up through a server action (the browser shrinks them first)
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default withWorkflow(nextConfig);
