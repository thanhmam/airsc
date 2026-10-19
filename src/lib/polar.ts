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

/** The launch discount in Polar (percentage off, limited seats), applied automatically at checkout */
export const proDiscountId = () => polarEnv("POLAR_DISCOUNT_PRO");

export type ProOffer = {
  currency: string;
  /** the regular price, in cents: what Pro costs once the launch is over */
  regularCents: number;
  /** price with the launch discount, or null when it is not running (no discount, ended, or sold out) */
  launchCents: number | null;
  percentOff: number | null;
  /** launch seats: how many in total and how many are left; null when the discount has no limit */
  seats: { total: number; left: number } | null;
};

let offerCache: { at: number; value: ProOffer | null } | null = null;

/**
 * What Pro costs right now, read from Polar so the page can never promise a price or a number of seats
 * that checkout will not honour. Cached for a minute; null when Polar cannot be reached.
 */
export async function proOffer(): Promise<ProOffer | null> {
  if (offerCache && Date.now() - offerCache.at < 60_000) return offerCache.value;
  let value: ProOffer | null = null;
  try {
    const productId = proProductId();
    if (productId) {
      const client = polar();
      const product = await client.products.get(productId);
      const price = product.prices.find((p) => "price_amount" in p && p.amount_type === "fixed" && !p.is_archived);
      if (price && "price_amount" in price) {
        value = { currency: price.price_currency ?? "usd", regularCents: price.price_amount, launchCents: null, percentOff: null, seats: null };
        const discountId = proDiscountId();
        if (discountId) {
          const d = await client.discounts.get(discountId);
          const now = Date.now();
          const running = (!d.starts_at || new Date(d.starts_at).getTime() <= now) && (!d.ends_at || new Date(d.ends_at).getTime() > now);
          const left = d.max_redemptions == null ? null : d.max_redemptions - d.redemptions_count;
          if (running && (left === null || left > 0) && "basis_points" in d) {
            value.percentOff = Math.round(d.basis_points / 100);
            value.launchCents = Math.round((price.price_amount * (10_000 - d.basis_points)) / 10_000);
            if (left !== null && d.max_redemptions != null) value.seats = { total: d.max_redemptions, left };
          }
        }
      }
    }
  } catch (e) {
    console.error("polar offer failed", e);
  }
  offerCache = { at: Date.now(), value };
  return value;
}

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
