import { webhooks } from "@polar-sh/sdk/2026-04";
import { z } from "zod";
import { db } from "@/lib/engine/db";
import { orderRecord, polar, polarEnv } from "@/lib/polar";
import { anonClient } from "@/lib/supabase/anon";

/**
 * Polar webhook (Polar → Settings → Webhooks, format Raw, API version 2026-04, events customer.state_changed,
 * order.paid and order.refunded).
 * order.* events are stored for /admin/payments. A customer is the Airsc user id (external_customer_id set
 * at checkout). On customer.state_changed we re-read the customer's current state from Polar and set Pro to
 * match, so retried or out-of-order deliveries cannot leave the wrong value behind. Pro = the
 * POLAR_BENEFIT_PRO benefit (a feature flag on the Pro product).
 */
export async function POST(req: Request) {
  const secret = polarEnv("POLAR_WEBHOOK_SECRET");
  const benefit = polarEnv("POLAR_BENEFIT_PRO");
  if (!secret || !benefit) return Response.json({ error: "Not configured" }, { status: 500 });

  let event;
  try {
    event = await webhooks.validateEvent(
      await req.text(),
      {
        "webhook-id": req.headers.get("webhook-id") ?? "",
        "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
        "webhook-signature": req.headers.get("webhook-signature") ?? "",
      },
      secret,
    );
  } catch (e) {
    if (e instanceof webhooks.PolarWebhookVerificationError) return Response.json({ error: "Invalid signature" }, { status: 403 });
    // signed but an event type this SDK version does not know: acknowledge so Polar stops retrying
    if (e instanceof webhooks.PolarWebhookUnknownTypeError) return Response.json({ received: true }, { status: 202 });
    if (e instanceof webhooks.PolarWebhookError) return Response.json({ error: "Invalid payload" }, { status: 400 });
    throw e;
  }

  // payments for /admin/payments; refunds arrive as order.refunded
  if (event.type === "order.paid" || event.type === "order.updated" || event.type === "order.refunded") {
    const row = orderRecord(event.data);
    if (row) {
      try {
        await db.recordOrder(row);
      } catch {
        return Response.json({ error: "Failed" }, { status: 500 }); // Polar retries
      }
    }
    return Response.json({ received: true });
  }
  if (event.type !== "customer.state_changed") return Response.json({ received: true }, { status: 202 });
  const userId = z.uuid().safeParse(event.data.external_id);
  if (!userId.success) return Response.json({ received: true, ignored: "no Airsc user" }, { status: 202 });

  const state = await polar().customers.getStateExternal(userId.data);
  const enabled = state.granted_benefits.some((g) => g.benefit_id === benefit);
  const { error } = await anonClient().rpc("set_pro", { p_token: process.env.AIRSC_INGEST_TOKEN!, p_user: userId.data, p_enabled: enabled });
  if (error) return Response.json({ error: "Failed" }, { status: 500 }); // Polar retries
  return Response.json({ received: true, pro: enabled });
}
