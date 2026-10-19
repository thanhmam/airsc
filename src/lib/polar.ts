import "server-only";
import { createPolar } from "@polar-sh/sdk/2026-04";

/**
 * Polar client for the API version chosen on the webhook in the Polar dashboard (2026-04).
 * Production and sandbox tokens are separate: POLAR_SERVER=sandbox while testing.
 */
export function polar() {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) throw new Error("POLAR_ACCESS_TOKEN is not set");
  return createPolar({ accessToken, environment: process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production" });
}

/** The Pro upgrade is only offered once the product is configured */
export const proProductId = () => process.env.POLAR_PRODUCT_PRO || null;
