-- Ingest + purchase grants are only called server-side (crawler, Polar webhook) with the anon key + token
revoke execute on function public.ingest_resources(text, jsonb), public.ingest_kits(text, jsonb),
  public.grant_purchase(text, uuid, text, text, int, text) from authenticated;
