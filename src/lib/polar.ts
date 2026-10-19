import "server-only";
import { createPolar } from "@polar-sh/sdk/2026-04";

/** Pasted env values often carry a stray space or newline */
export const polarEnv = (name: string) => process.env[name]?.trim() || null;

/**
 * Polar client for the API version chosen on the webhook in the Polar dashboard (2026-04).
 * Production and sandbox tokens are separate: POLAR_SERVER=sandbox while testing.
 */
export function polar() {
  const accessToken = polarEnv("POLAR_ACCESS_TOKEN");
  if (!accessToken) throw new Error("POLAR_ACCESS_TOKEN is not set");
  return createPolar({ accessToken, environment: polarEnv("POLAR_SERVER")?.toLowerCase() === "sandbox" ? "sandbox" : "production" });
}

/** The Pro upgrade is only offered once the product is configured */
export const proProductId = () => polarEnv("POLAR_PRODUCT_PRO");
