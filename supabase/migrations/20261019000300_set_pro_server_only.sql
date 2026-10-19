-- set_pro is called server-side only (Polar webhook, anon key + ingest token). The revoke in
-- 20261019000200 only removed authenticated's own grant, not the one it inherits from PUBLIC.
revoke execute on function public.set_pro(text, uuid, boolean) from public, authenticated;
grant execute on function public.set_pro(text, uuid, boolean) to anon;
