-- Social posts: one post per channel per Vietnam day announcing Today's picks (src/lib/social).
-- The Content Engine writes a draft after choosing the picks; /api/cron/social publishes it at the
-- hour set in /admin; admins can edit, skip or post it from /admin/social. Private: RPCs only.

create table if not exists public.social_posts (
  id bigint generated always as identity primary key,
  day date not null,
  channel text not null default 'x',
  status text not null default 'draft' check (status in ('draft', 'posting', 'posted', 'skipped', 'failed')),
  text text not null,
  highlight text,
  slugs text[] not null default '{}',
  image_alt text,
  post_id text,
  post_url text,
  error text,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (day, channel)
);

alter table public.social_posts enable row level security;
revoke all on public.social_posts from anon, authenticated;

-- Stores a draft. Without p_force the first draft of the day wins (an admin's edits are never
-- overwritten by the engine); with p_force (Regenerate) it replaces a draft or failed post.
create or replace function public.save_social_draft(
  p_token text, p_day date, p_channel text, p_text text, p_highlight text, p_slugs text[], p_image_alt text, p_force boolean default false
)
returns setof public.social_posts
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  insert into public.social_posts (day, channel, text, highlight, slugs, image_alt)
  values (p_day, p_channel, p_text, p_highlight, p_slugs, p_image_alt)
  on conflict (day, channel) do update
    set text = excluded.text, highlight = excluded.highlight, slugs = excluded.slugs, image_alt = excluded.image_alt,
        status = 'draft', error = null, updated_at = now()
    where p_force and public.social_posts.status in ('draft', 'failed');
  return query select * from public.social_posts s where s.day = p_day and s.channel = p_channel;
end $function$;

create or replace function public.update_social_text(p_token text, p_id bigint, p_text text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  update public.social_posts set text = p_text, updated_at = now() where id = p_id and status in ('draft', 'failed');
end $function$;

-- The lock that keeps a post from going out twice: only one caller moves it to 'posting'.
-- Returns no row when the post is not in one of p_from.
create or replace function public.claim_social_post(p_token text, p_id bigint, p_from text[])
returns setof public.social_posts
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  return query
    with u as (
      update public.social_posts set status = 'posting', error = null, updated_at = now()
      where id = p_id and status = any(p_from)
      returning *
    )
    select * from u;
end $function$;

create or replace function public.finish_social_post(p_token text, p_id bigint, p_status text, p_post_id text, p_post_url text, p_error text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  update public.social_posts
    set status = p_status, post_id = p_post_id, post_url = p_post_url, error = p_error,
        posted_at = case when p_status = 'posted' then now() else posted_at end, updated_at = now()
    where id = p_id;
end $function$;

-- Admin: skip a post, or mark one stuck in 'posting' as posted/failed after checking X by hand
create or replace function public.set_social_status(p_token text, p_id bigint, p_status text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  update public.social_posts set status = p_status, updated_at = now()
    where id = p_id and status <> 'posted' and p_status in ('skipped', 'posted', 'failed', 'draft');
end $function$;

create or replace function public.admin_social_posts(p_token text, p_limit int default 14)
returns setof public.social_posts
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  return query select * from public.social_posts order by day desc, channel limit p_limit;
end $function$;

-- Only called server-side with the anon key + token (Content Engine, cron, /admin)
revoke execute on function public.save_social_draft(text, date, text, text, text, text[], text, boolean) from public, authenticated;
revoke execute on function public.update_social_text(text, bigint, text) from public, authenticated;
revoke execute on function public.claim_social_post(text, bigint, text[]) from public, authenticated;
revoke execute on function public.finish_social_post(text, bigint, text, text, text, text) from public, authenticated;
revoke execute on function public.set_social_status(text, bigint, text) from public, authenticated;
revoke execute on function public.admin_social_posts(text, int) from public, authenticated;
grant execute on function public.save_social_draft(text, date, text, text, text, text[], text, boolean) to anon;
grant execute on function public.update_social_text(text, bigint, text) to anon;
grant execute on function public.claim_social_post(text, bigint, text[]) to anon;
grant execute on function public.finish_social_post(text, bigint, text, text, text, text) to anon;
grant execute on function public.set_social_status(text, bigint, text) to anon;
grant execute on function public.admin_social_posts(text, int) to anon;
