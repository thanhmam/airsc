-- Public supporter wall: names + masked email only, never amounts.
-- Only the masked email is stored (e.g. "th***@gmail.com"), so the full address never lands in the DB.

alter table public.supporters add column if not exists email_masked text;

create or replace function private.mask_email(p_email text)
returns text
language sql
immutable
set search_path to ''
as $$
  select case
    when p_email is null or position('@' in p_email) < 2 then null
    else left(split_part(p_email, '@', 1), least(2, length(split_part(p_email, '@', 1)) - 1))
         || '***@' || split_part(p_email, '@', 2)
  end
$$;

create or replace function public.record_supporter(p_token text, p_row jsonb)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  insert into public.supporters (kofi_transaction_id, name, message, amount, currency, type, is_public, email_masked)
  values (p_row->>'kofi_transaction_id', p_row->>'from_name', p_row->>'message', (p_row->>'amount')::numeric,
          p_row->>'currency', p_row->>'type', coalesce((p_row->>'is_public')::boolean, true),
          private.mask_email(p_row->>'email'))
  on conflict (kofi_transaction_id) do nothing;
end $function$;

-- Every donation is listed so donors can see it was recorded; private donors show no name/message.
create or replace function public.public_supporters(p_limit int default 100)
returns table (name text, message text, email_masked text, created_at timestamptz)
language sql
stable
security definer
set search_path to ''
as $$
  select case when s.is_public then s.name end,
         case when s.is_public then s.message end,
         s.email_masked,
         s.created_at
  from public.supporters s
  order by s.created_at desc
  limit least(greatest(p_limit, 1), 200)
$$;

grant execute on function public.public_supporters(int) to anon, authenticated;

-- Amounts stay server-side: the browser reads supporters only through public_supporters().
drop policy if exists "public supporters are visible" on public.supporters;
revoke all on public.supporters from anon, authenticated;
