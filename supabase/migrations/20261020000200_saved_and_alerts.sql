-- Saved resources and daily alerts: a user saves resources; when a saved repo is pushed to or its safety rating
-- changes, a notification appears in their account and goes out in one daily email.
--  * resources get a change log through a trigger, so the crawler needs no changes
--  * notifications are generated once a day (cron) for the users who saved the resource
--  * users manage their own saves and notifications through RPCs (auth.uid()); the daily job runs with the
--    anon key + ingest token, like the other server-side RPCs

alter table public.profiles add column if not exists email_alerts boolean not null default true;
alter table public.profiles add column if not exists locale text check (locale in ('en', 'vi'));

-- ---------------------------------------------------------------- saved resources
create table if not exists public.saved_resources (
  user_id uuid not null references auth.users (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);
alter table public.saved_resources enable row level security;
drop policy if exists "read own saves" on public.saved_resources;
create policy "read own saves" on public.saved_resources for select to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------- change log
create table if not exists public.resource_changes (
  id bigint generated always as identity primary key,
  resource_id uuid not null references public.resources (id) on delete cascade,
  kind text not null check (kind in ('update', 'safety')),
  old_value text,
  new_value text,
  detail jsonb,
  day date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date),
  created_at timestamptz not null default now(),
  unique (resource_id, kind, day)
);
alter table public.resource_changes enable row level security;
drop policy if exists "changes are public" on public.resource_changes;
create policy "changes are public" on public.resource_changes for select to anon, authenticated using (true);

-- One row per resource, kind and day: a busy repo does not produce an alert per commit
create or replace function public.record_resource_change()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.safety is distinct from old.safety then
    insert into public.resource_changes (resource_id, kind, old_value, new_value)
    values (new.id, 'safety', old.safety, new.safety)
    on conflict (resource_id, kind, day) do update set new_value = excluded.new_value, created_at = now();
  end if;
  if (old.pushed_at is not null and new.pushed_at > old.pushed_at)
     or (old.version is not null and new.version is distinct from old.version) then
    -- a new version when there is one, otherwise the date of the last push
    insert into public.resource_changes (resource_id, kind, old_value, new_value, detail)
    values (new.id, 'update',
            case when old.version is not null and new.version is distinct from old.version then old.version else old.pushed_at::date::text end,
            case when old.version is not null and new.version is distinct from old.version then new.version else new.pushed_at::date::text end,
            jsonb_build_object('pushed_at', new.pushed_at, 'version', new.version, 'old_version', old.version))
    -- created_at moves forward so a user who saved the resource earlier the same day still gets the alert
    on conflict (resource_id, kind, day) do update set new_value = excluded.new_value, detail = excluded.detail, created_at = now();
  end if;
  return new;
end $function$;

drop trigger if exists resources_change_log on public.resources;
create trigger resources_change_log
  after update of pushed_at, safety, version on public.resources
  for each row
  when (old.pushed_at is distinct from new.pushed_at or old.safety is distinct from new.safety or old.version is distinct from new.version)
  execute function public.record_resource_change();

-- ---------------------------------------------------------------- notifications
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  change_id bigint not null references public.resource_changes (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  emailed_at timestamptz,
  unique (user_id, change_id)
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications for select to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------- user RPCs (signed in)
-- Saves a resource. Free accounts keep up to p_free_limit; Pro is unlimited. p_lang remembers the email language.
create or replace function public.save_resource(p_slug text, p_lang text default null, p_free_limit int default 10)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare uid uuid := auth.uid(); rid uuid; pro boolean; n int;
begin
  if uid is null then raise exception 'auth required' using errcode = '42501'; end if;
  select id into rid from public.resources where slug = p_slug and status = 'published';
  if rid is null then return jsonb_build_object('saved', false, 'reason', 'not_found'); end if;
  if p_lang in ('en', 'vi') then update public.profiles set locale = p_lang where id = uid; end if;
  if exists (select 1 from public.saved_resources where user_id = uid and resource_id = rid) then
    return jsonb_build_object('saved', true);
  end if;
  select coalesce(fulltime, false) into pro from public.profiles where id = uid;
  select count(*) into n from public.saved_resources where user_id = uid;
  if not coalesce(pro, false) and n >= p_free_limit then
    return jsonb_build_object('saved', false, 'reason', 'limit', 'count', n, 'limit', p_free_limit);
  end if;
  insert into public.saved_resources (user_id, resource_id) values (uid, rid);
  return jsonb_build_object('saved', true, 'count', n + 1);
end $function$;

create or replace function public.unsave_resource(p_slug text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if auth.uid() is null then raise exception 'auth required' using errcode = '42501'; end if;
  delete from public.saved_resources
   where user_id = auth.uid() and resource_id = (select id from public.resources where slug = p_slug);
end $function$;

create or replace function public.mark_notifications_read()
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if auth.uid() is null then raise exception 'auth required' using errcode = '42501'; end if;
  update public.notifications set read_at = now() where user_id = auth.uid() and read_at is null;
end $function$;

create or replace function public.set_my_email_alerts(p_on boolean)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if auth.uid() is null then raise exception 'auth required' using errcode = '42501'; end if;
  update public.profiles set email_alerts = p_on where id = auth.uid();
end $function$;

-- ---------------------------------------------------------------- daily job RPCs (server only)
-- Turns the last 3 days of changes into notifications for the users who saved the resource before the change.
-- p_pro_only: alerts are a Pro feature.
create or replace function public.generate_notifications(p_token text, p_pro_only boolean default true)
returns int
language plpgsql
security definer
set search_path to ''
as $function$
declare n int;
begin
  perform private.check_token(p_token);
  insert into public.notifications (user_id, change_id, resource_id)
  select s.user_id, c.id, c.resource_id
    from public.resource_changes c
    join public.resources r on r.id = c.resource_id and r.status = 'published'
    join public.saved_resources s on s.resource_id = c.resource_id and c.created_at >= s.created_at
    join public.profiles p on p.id = s.user_id and (p.fulltime or not p_pro_only)
   where c.created_at > now() - interval '3 days'
     -- a rating that changed and changed back the same day is not a change
     and (c.kind <> 'safety' or c.old_value is distinct from c.new_value)
  on conflict (user_id, change_id) do nothing;
  get diagnostics n = row_count;
  return n;
end $function$;

-- One entry per user with notifications not emailed yet (and alerts switched on)
create or replace function public.pending_digests(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  return coalesce((
    select jsonb_agg(jsonb_build_object('user_id', u.user_id, 'email', u.email, 'locale', u.locale, 'items', u.items))
      from (
        select n.user_id, p.email, p.locale,
               jsonb_agg(jsonb_build_object('id', n.id, 'slug', r.slug, 'name', r.name, 'kind', c.kind,
                                            'old', c.old_value, 'new', c.new_value, 'detail', c.detail, 'at', n.created_at)
                         order by n.created_at desc) as items
          from public.notifications n
          join public.profiles p on p.id = n.user_id and p.email_alerts and p.email is not null
          join public.resources r on r.id = n.resource_id
          join public.resource_changes c on c.id = n.change_id
         where n.emailed_at is null and n.created_at > now() - interval '3 days'
           and (c.kind <> 'safety' or c.old_value is distinct from c.new_value)
         group by n.user_id, p.email, p.locale) u
  ), '[]'::jsonb);
end $function$;

create or replace function public.mark_notifications_emailed(p_token text, p_ids bigint[])
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  update public.notifications set emailed_at = now() where id = any (p_ids);
end $function$;

-- The unsubscribe link in the email (the route checks a signed link first)
create or replace function public.set_email_alerts_for(p_token text, p_user uuid, p_on boolean)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  update public.profiles set email_alerts = p_on where id = p_user;
end $function$;

-- ---------------------------------------------------------------- who can call what
revoke execute on function
  public.save_resource(text, text, int), public.unsave_resource(text), public.mark_notifications_read(), public.set_my_email_alerts(boolean)
  from public, anon;
grant execute on function
  public.save_resource(text, text, int), public.unsave_resource(text), public.mark_notifications_read(), public.set_my_email_alerts(boolean)
  to authenticated;

revoke execute on function
  public.generate_notifications(text, boolean), public.pending_digests(text),
  public.mark_notifications_emailed(text, bigint[]), public.set_email_alerts_for(text, uuid, boolean)
  from public, authenticated;
grant execute on function
  public.generate_notifications(text, boolean), public.pending_digests(text),
  public.mark_notifications_emailed(text, bigint[]), public.set_email_alerts_for(text, uuid, boolean)
  to anon;
