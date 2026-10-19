import "server-only";
import { createPolar, type models } from "@polar-sh/sdk/2026-04";
import { z } from "zod";
import { db, type OrderRecord } from "@/lib/engine/db";

/** Pasted env values often carry a stray space or newline */
export const polarEnv = (name: string) => process.env[name]?.trim() || null;

/**
 * Polar client for the API version chosen on the webhook in the Polar dashboard (2026-04).
 * Production and sandbox tokens are separate: POLAR_SERVER=sandbox while testing.
 */
export function polar() {
  const accessToken = polarEnv("POLAR_ACCESS_TOKEN");
  if (!accessToken) throw new Error("POLAR_ACCESS_TOKEN is not set");
  return createPolar({ accessToken, environment: isSandbox() ? "sandbox" : "production" });
}

export const isSandbox = () => polarEnv("POLAR_SERVER")?.toLowerCase() === "sandbox";

/** Where an admin goes to refund or look at a sale */
export const polarDashboardUrl = () => (isSandbox() ? "https://sandbox.polar.sh/dashboard" : "https://polar.sh/dashboard");

/** The Pro upgrade is only offered once the product is configured */
export const proProductId = () => polarEnv("POLAR_PRODUCT_PRO");

const STORED = ["paid", "partially_refunded", "refunded"] as const;

/**
 * A Polar order as we store it, or null for orders that are not money in the bank (drafts, pending, void).
 * The customer is the Airsc user id (external_customer_id set at checkout); amounts are net of discounts, before tax.
 */
export function orderRecord(o: models.Order): OrderRecord | null {
  const status = STORED.find((s) => s === o.status);
  if (!status) return null;
  const user = z.uuid().safeParse(o.customer.external_id);
  return {
    provider_order_id: o.id,
    user_id: user.success ? user.data : null,
    email: o.customer.email ?? null,
    product: o.product?.name ?? "Pro",
    amount_cents: o.net_amount,
    refunded_cents: o.refunded_amount,
    currency: o.currency,
    status,
    created_at: o.created_at,
  };
}

/** Pulls every order from Polar into public.orders (backfill, and repair after a missed webhook) */
export async function syncPolarOrders() {
  let stored = 0;
  for await (const order of polar().orders.iterList({ limit: 100 })) {
    const row = orderRecord(order);
    if (!row) continue;
    await db.recordOrder(row);
    stored++;
  }
  return stored;
}
