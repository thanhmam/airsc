-- Pro membership sold through Polar. The Polar webhook (customer.state_changed) tells us whether a customer
-- currently holds the Pro benefit; this sets profiles.fulltime to match. Idempotent, so retried and
-- out-of-order deliveries are harmless. Server-side only: called with the anon key + ingest token.

create or replace function public.set_pro(p_token text, p_user uuid, p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  update public.profiles
     set fulltime = p_enabled,
         fulltime_at = case when p_enabled and not fulltime then now() else fulltime_at end
   where id = p_user;
  return found;
end $function$;

revoke execute on function public.set_pro(text, uuid, boolean) from authenticated;
