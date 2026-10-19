-- Admin: users and payments. Payments come from Polar (webhook order.paid / order.refunded and the
-- "Sync from Polar" button) into public.orders. Everything here is server-side only: called with the anon
-- key + ingest token from /admin, never by signed-in users.

alter table public.orders add column if not exists status text not null default 'paid'
  check (status in ('paid', 'partially_refunded', 'refunded'));
alter table public.orders add column if not exists refunded_cents integer not null default 0;
alter table public.orders add column if not exists email text;

-- One order from Polar. Idempotent on provider_order_id, so webhook retries and re-syncs are harmless.
-- amount_cents is the net amount (after discounts, before tax); refunded_cents is what was given back.
create or replace function public.record_order(p_token text, p_row jsonb)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare uid uuid := nullif(p_row->>'user_id', '')::uuid;
begin
  perform private.check_token(p_token);
  if uid is not null and not exists (select 1 from auth.users where id = uid) then uid := null; end if;
  insert into public.orders (user_id, provider_order_id, product, amount_cents, currency, status, refunded_cents, email, created_at)
  values (uid, p_row->>'provider_order_id', coalesce(p_row->>'product', 'Pro'), (p_row->>'amount_cents')::int,
          upper(p_row->>'currency'), coalesce(p_row->>'status', 'paid'), coalesce((p_row->>'refunded_cents')::int, 0),
          p_row->>'email', coalesce((p_row->>'created_at')::timestamptz, now()))
  on conflict (provider_order_id) do update set
    user_id = coalesce(excluded.user_id, public.orders.user_id), product = excluded.product,
    amount_cents = excluded.amount_cents, currency = excluded.currency, status = excluded.status,
    refunded_cents = excluded.refunded_cents, email = coalesce(excluded.email, public.orders.email);
end $function$;

-- Users with what they paid and used. p_filter: all | pro | free | paid. p_sort: newest | active | spent.
create or replace function public.admin_users(p_token text, p_q text default null, p_filter text default 'all',
                                              p_sort text default 'newest', p_limit int default 50, p_offset int default 0)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  return (
    with base as (
      select p.id, coalesce(p.email, u.email) as email, p.created_at, u.last_sign_in_at,
             u.raw_app_meta_data->>'provider' as provider, p.fulltime, p.fulltime_at, p.founding,
             (select count(*) from public.downloads d where d.user_id = p.id) as downloads,
             exists (select 1 from public.api_keys k where k.user_id = p.id) as has_key,
             (select count(*) from public.orders o where o.user_id = p.id) as orders,
             (select coalesce(sum(o.amount_cents - o.refunded_cents), 0) from public.orders o where o.user_id = p.id) as paid_cents
        from public.profiles p left join auth.users u on u.id = p.id
       where coalesce(p_q, '') = '' or coalesce(p.email, u.email) ilike '%' || p_q || '%'
    ), f as (
      select * from base
       where case p_filter when 'pro' then fulltime when 'free' then not fulltime when 'paid' then paid_cents > 0 else true end
    )
    select jsonb_build_object(
      'total', (select count(*) from f),
      'rows', coalesce((select jsonb_agg(to_jsonb(x)) from (
          select * from f
           order by case when p_sort = 'active' then last_sign_in_at end desc nulls last,
                    case when p_sort = 'spent' then paid_cents end desc nulls last,
                    created_at desc
           limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)) x), '[]'::jsonb)
    )
  );
end $function$;

-- Payments list. p_status: all | paid | refunded (refunded includes partial).
create or replace function public.admin_payments(p_token text, p_status text default 'all', p_limit int default 50, p_offset int default 0)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  return (
    with f as (
      select o.id, o.provider_order_id, o.user_id, coalesce(o.email, p.email) as email, o.product, o.amount_cents,
             o.refunded_cents, o.currency, o.status, o.created_at
        from public.orders o left join public.profiles p on p.id = o.user_id
       where case p_status when 'paid' then o.status = 'paid' when 'refunded' then o.status <> 'paid' else true end
    )
    select jsonb_build_object(
      'total', (select count(*) from f),
      'rows', coalesce((select jsonb_agg(to_jsonb(x)) from (
          select * from f order by created_at desc limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)) x), '[]'::jsonb)
    )
  );
end $function$;

-- Numbers for the billing dashboard. Amounts are USD (the only currency we sell in).
create or replace function public.admin_billing(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  perform private.check_token(p_token);
  return jsonb_build_object(
    'revenue', (select jsonb_build_object(
        'gross', coalesce(sum(amount_cents), 0) / 100.0,
        'refunded', coalesce(sum(refunded_cents), 0) / 100.0,
        'net', coalesce(sum(amount_cents - refunded_cents), 0) / 100.0,
        'orders', count(*),
        'orders_30d', count(*) filter (where created_at > now() - interval '30 days'),
        'net_30d', coalesce(sum(amount_cents - refunded_cents) filter (where created_at > now() - interval '30 days'), 0) / 100.0,
        'payers', count(distinct user_id) filter (where amount_cents - refunded_cents > 0)
      ) from public.orders),
    'users', (select jsonb_build_object(
        'total', count(*),
        'new_7d', count(*) filter (where created_at > now() - interval '7 days'),
        'pro', count(*) filter (where fulltime),
        'new_pro_30d', count(*) filter (where fulltime_at > now() - interval '30 days'),
        'pro_without_order', count(*) filter (where fulltime and not exists (select 1 from public.orders o where o.user_id = profiles.id))
      ) from public.profiles),
    'by_product', coalesce((select jsonb_agg(x) from (
        select product, count(*) as orders, coalesce(sum(amount_cents - refunded_cents), 0) / 100.0 as net
          from public.orders group by product order by 3 desc) x), '[]'::jsonb),
    'daily', (select jsonb_agg(jsonb_build_object(
          'day', d.day::date, 'revenue', coalesce(o.net, 0) / 100.0, 'signups', coalesce(u.n, 0), 'pro', coalesce(p.n, 0)) order by d.day)
        from generate_series(today - 29, today, interval '1 day') as d(day)
        left join (select (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day, sum(amount_cents - refunded_cents) as net
                     from public.orders group by 1) o on o.day = d.day::date
        left join (select (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day, count(*) as n
                     from public.profiles group by 1) u on u.day = d.day::date
        left join (select (fulltime_at at time zone 'Asia/Ho_Chi_Minh')::date as day, count(*) as n
                     from public.profiles where fulltime_at is not null group by 1) p on p.day = d.day::date)
  );
end $function$;

revoke execute on function
  public.record_order(text, jsonb),
  public.admin_users(text, text, text, text, int, int),
  public.admin_payments(text, text, int, int),
  public.admin_billing(text)
  from public, authenticated;
grant execute on function
  public.record_order(text, jsonb),
  public.admin_users(text, text, text, text, int, int),
  public.admin_payments(text, text, int, int),
  public.admin_billing(text)
  to anon;
