-- Daily limits for the Free tier. A "subject" is a signed-in user (their uuid) or, for the Airsc MCP without
-- a key, a salted hash of the caller's IP ("ip:..."). Pro (profiles.fulltime) is never limited.
-- Days are Vietnam days, like the rest of the app. Server-side only: anon key + ingest token.

create table if not exists public.usage_daily (
  subject text not null,
  day date not null,
  kind text not null check (kind in ('mcp', 'install')),
  n int not null default 0,
  primary key (subject, day, kind)
);

-- Install options unlocked today: the same resource twice in a day costs one unlock
create table if not exists public.install_unlocks (
  subject text not null,
  day date not null,
  slug text not null,
  primary key (subject, day, slug)
);

alter table public.usage_daily enable row level security;
alter table public.install_unlocks enable row level security;

-- p_kind 'mcp': one Airsc MCP tool call. 'install': unlock the install options of p_slug.
-- p_consume false only reports where the subject stands (used to render the page).
create or replace function public.quota_use(
  p_token text, p_kind text, p_user uuid default null, p_api_key text default null, p_anon text default null,
  p_slug text default null, p_free int default 5, p_anon_limit int default 2, p_consume boolean default true)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  uid uuid := p_user;
  subj text;
  pro boolean := false;
  lim int;
  today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  used int := 0;
  unlocked boolean := false;
  ok boolean;
begin
  perform private.check_token(p_token);
  if p_kind not in ('mcp', 'install') then raise exception 'bad kind'; end if;
  if uid is null and p_api_key is not null then uid := private.user_for_key(p_api_key); end if;
  if uid is null and coalesce(p_anon, '') = '' then raise exception 'no subject'; end if;
  subj := coalesce(uid::text, 'ip:' || p_anon);
  if uid is not null then
    select coalesce(fulltime, false) into pro from public.profiles where id = uid;
    pro := coalesce(pro, false);
  end if;
  lim := case when pro then null when uid is not null then p_free else p_anon_limit end;
  perform pg_advisory_xact_lock(hashtext(subj || ':' || p_kind));

  if p_kind = 'install' then
    select count(*) into used from public.install_unlocks where subject = subj and day = today;
    unlocked := p_slug is not null and exists (
      select 1 from public.install_unlocks where subject = subj and day = today and slug = p_slug);
    ok := unlocked or lim is null or used < lim;
    if p_consume and ok and not unlocked and p_slug is not null then
      insert into public.install_unlocks (subject, day, slug) values (subj, today, p_slug) on conflict do nothing;
      used := used + 1;
      unlocked := true;
    end if;
  else
    select coalesce(n, 0) into used from public.usage_daily where subject = subj and day = today and kind = 'mcp';
    used := coalesce(used, 0);
    ok := lim is null or used < lim;
    if p_consume and ok then
      insert into public.usage_daily (subject, day, kind, n) values (subj, today, 'mcp', 1)
        on conflict (subject, day, kind) do update set n = public.usage_daily.n + 1;
      used := used + 1;
    end if;
  end if;

  return jsonb_build_object('allowed', ok, 'used', used, 'limit', lim, 'pro', pro, 'signed_in', uid is not null, 'unlocked', unlocked);
end $function$;

revoke execute on function public.quota_use(text, text, uuid, text, text, text, int, int, boolean) from public, authenticated;
grant execute on function public.quota_use(text, text, uuid, text, text, text, int, int, boolean) to anon;
