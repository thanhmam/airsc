import { anonClient } from "@/lib/supabase/anon";

/**
 * Ko-fi webhook (Ko-fi → Settings → API → Webhook URL). Ko-fi posts form data with a `data` JSON
 * field that carries the Verification Token we compare with KOFI_VERIFICATION_TOKEN.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  let data: Record<string, unknown> | null = null;
  try {
    data = JSON.parse(String(form?.get("data") ?? ""));
  } catch {
    return new Response("Bad payload", { status: 400 });
  }
  const expected = process.env.KOFI_VERIFICATION_TOKEN;
  if (!expected || data?.verification_token !== expected) return new Response("Unauthorized", { status: 401 });

  const { error } = await anonClient().rpc("record_supporter", {
    p_token: process.env.AIRSC_INGEST_TOKEN!,
    p_row: {
      kofi_transaction_id: data.kofi_transaction_id ?? data.message_id,
      // keep names/messages only when the supporter chose to be public
      from_name: data.is_public ? data.from_name : null,
      message: data.is_public ? data.message : null,
      amount: data.amount,
      currency: data.currency,
      type: data.type,
      is_public: data.is_public,
    },
  });
  if (error) return new Response("Failed", { status: 500 });
  return new Response("ok");
}
