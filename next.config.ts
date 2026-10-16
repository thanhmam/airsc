import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  // the admin's Archify diagrams are read from disk at request time
  outputFileTracingIncludes: { "/api/admin/diagram/*": ["src/lib/pm/diagrams/*.html"] },
};

export default withWorkflow(nextConfig);
