-- Social posts v2 (src/lib/social): several X posts a day instead of one Today's picks digest.
--   kind 'spotlight': one resource, drafted by the engine for each slot set in /admin/social
--   kind 'applied':   how the admin used a resource in a real project, written from their notes and screenshots
-- A post can tag the resource's author (mentions); X does not allow automated unsolicited mentions, so a
-- post with mentions goes out as written only once an admin approves it ('approved'), otherwise without
-- the @. The link goes in a reply (reply_text). X metrics are stored on the post, and every three days a
-- review (social_reviews) sums them up and rewrites the writing guidance.
-- Additive: code built on 20261015000100/200 keeps working (its posts are slot 1, kind 'picks').

alter table public.social_posts add column if not exists slot smallint not null default 1;
alter table public.social_posts add column if not exists kind text not null default 'picks';
alter table public.social_posts add column if not exists scheduled_at timestamptz;
alter table public.social_posts add column if not exists reply_text text;
alter table public.social_posts add column if not exists reply_post_id text;
alter table public.social_posts add column if not exists mentions text[] not null default '{}';
alter table public.social_posts add column if not exists note text;
alter table public.social_posts add column if not exists images text[] not null default '{}';
alter table public.social_posts add column if not exists impressions int;
alter table public.social_posts add column if not exists likes int;
alter table public.social_posts add column if not exists reposts int;
alter table public.social_posts add column if not exists replies int;
alter table public.social_posts add column if not exists quotes int;
alter table public.social_posts add column if not exists bookmarks int;
alter table public.social_posts add column if not exists profile_clicks int;
alter table public.social_posts add column if not exists link_clicks int;
alter table public.social_posts add column if not exists metrics_at timestamptz;

alter table public.social_posts drop constraint if exists social_posts_kind_check;
alter table public.social_posts add constraint social_posts_kind_check check (kind in ('picks', 'spotlight', 'applied'));

alter table public.social_posts drop constraint if exists social_posts_status_check;
alter table public.social_posts add constraint social_posts_status_check
  check (status in ('draft', 'approved', 'posting', 'posted', 'skipped', 'failed'));

alter table public.social_posts drop constraint if exists social_posts_day_channel_key;
alter table public.social_posts drop constraint if exists social_posts_day_channel_slot_key;
alter table public.social_posts add constraint social_posts_day_channel_slot_key unique (day, channel, slot);

-- the v1 draft writer, moved onto the new key (its posts are slot 1)
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
  on conflict (day, channel, slot) do update
    set text = excluded.text, highlight = excluded.highlight, slugs = excluded.slugs, image_alt = excluded.image_alt,
        status = 'draft', error = null, updated_at = now()
    where p_force and public.social_posts.status in ('draft', 'failed');
  return query select * from public.social_posts s where s.day = p_day and s.channel = p_channel and s.slot = 1;
end $function$;

-- Admin: skip, approve or un-approve a post, or settle one stuck in 'posting' after checking X by hand
create or replace function public.set_social_status(p_token text, p_id bigint, p_status text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  update public.social_posts set status = p_status, updated_at = now()
    where id = p_id and status <> 'posted' and p_status in ('skipped', 'posted', 'failed', 'draft', 'approved');
end $function$;

create or replace function public.admin_social_posts(p_token text, p_limit int default 14)
returns setof public.social_posts
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  -- slot 1 first within a day: v1 code takes the first row of the day as "today's post"
  return query select * from public.social_posts order by day desc, slot, id limit p_limit;
end $function$;

-- Creates the post for (day, channel, slot). Without p_force an existing post wins (an admin's edits are
-- never overwritten); with it (Write again) a draft or failed post is replaced.
create or replace function public.social_upsert(p_token text, p_row jsonb, p_force boolean default false)
returns setof public.social_posts
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_day date := (p_row->>'day')::date;
  v_channel text := coalesce(p_row->>'channel', 'x');
  v_slot smallint := (p_row->>'slot')::smallint;
begin
  perform private.check_token(p_token);
  insert into public.social_posts (day, channel, slot, kind, status, text, reply_text, highlight, slugs, mentions, image_alt, images, note, scheduled_at, headline, card_style)
  values (
    v_day, v_channel, v_slot,
    p_row->>'kind', 'draft', p_row->>'text', p_row->>'reply_text', p_row->>'highlight',
    coalesce(array(select jsonb_array_elements_text(p_row->'slugs')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p_row->'mentions')), '{}'),
    p_row->>'image_alt',
    coalesce(array(select jsonb_array_elements_text(p_row->'images')), '{}'),
    p_row->>'note', (p_row->>'scheduled_at')::timestamptz, p_row->>'headline', p_row->>'card_style'
  )
  on conflict (day, channel, slot) do update
    set kind = excluded.kind, status = 'draft', text = excluded.text, reply_text = excluded.reply_text,
        highlight = excluded.highlight, slugs = excluded.slugs, mentions = excluded.mentions, image_alt = excluded.image_alt,
        images = excluded.images, note = excluded.note, scheduled_at = excluded.scheduled_at,
        headline = excluded.headline, card_style = excluded.card_style, error = null, updated_at = now()
    where p_force and public.social_posts.status in ('draft', 'failed');
  return query select * from public.social_posts s where s.day = v_day and s.channel = v_channel and s.slot = v_slot;
end $function$;

-- Edits a post that has not gone out: only the keys present in p_patch change. Returns no row when it has.
create or replace function public.social_update(p_token text, p_id bigint, p_patch jsonb)
returns setof public.social_posts
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  return query
    with u as (
      update public.social_posts s set
        text = case when p_patch ? 'text' then p_patch->>'text' else s.text end,
        reply_text = case when p_patch ? 'reply_text' then p_patch->>'reply_text' else s.reply_text end,
        mentions = case when p_patch ? 'mentions' then coalesce(array(select jsonb_array_elements_text(p_patch->'mentions')), '{}') else s.mentions end,
        scheduled_at = case when p_patch ? 'scheduled_at' then (p_patch->>'scheduled_at')::timestamptz else s.scheduled_at end,
        highlight = case when p_patch ? 'highlight' then p_patch->>'highlight' else s.highlight end,
        headline = case when p_patch ? 'headline' then p_patch->>'headline' else s.headline end,
        card_style = case when p_patch ? 'card_style' then p_patch->>'card_style' else s.card_style end,
        image_alt = case when p_patch ? 'image_alt' then p_patch->>'image_alt' else s.image_alt end,
        images = case when p_patch ? 'images' then coalesce(array(select jsonb_array_elements_text(p_patch->'images')), '{}') else s.images end,
        note = case when p_patch ? 'note' then p_patch->>'note' else s.note end,
        updated_at = now()
      where s.id = p_id and s.status in ('draft', 'approved', 'failed')
      returning s.*
    )
    select * from u;
end $function$;

-- After a send: status, the post and its link reply, and any error (a failed reply keeps the post 'posted')
create or replace function public.social_finish(p_token text, p_id bigint, p_patch jsonb)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  update public.social_posts set
    status = p_patch->>'status',
    post_id = coalesce(p_patch->>'post_id', post_id),
    post_url = coalesce(p_patch->>'post_url', post_url),
    reply_post_id = coalesce(p_patch->>'reply_post_id', reply_post_id),
    error = p_patch->>'error',
    posted_at = case when p_patch->>'status' = 'posted' then coalesce(posted_at, now()) else posted_at end,
    updated_at = now()
  where id = p_id;
end $function$;

-- Metrics read from X, by post id: [{id, impressions, likes, reposts, replies, quotes, bookmarks, profile_clicks, link_clicks}]
create or replace function public.social_set_metrics(p_token text, p_rows jsonb)
returns int
language plpgsql
security definer
set search_path to ''
as $function$
declare n int;
begin
  perform private.check_token(p_token);
  update public.social_posts s set
    impressions = (r->>'impressions')::int,
    likes = (r->>'likes')::int,
    reposts = (r->>'reposts')::int,
    replies = (r->>'replies')::int,
    quotes = (r->>'quotes')::int,
    bookmarks = (r->>'bookmarks')::int,
    profile_clicks = (r->>'profile_clicks')::int,
    link_clicks = (r->>'link_clicks')::int,
    metrics_at = now()
  from jsonb_array_elements(p_rows) r
  where s.id = (r->>'id')::bigint;
  get diagnostics n = row_count;
  return n;
end $function$;

-- X handles of GitHub owners (GitHub profile `twitter_username`), cached so each owner is looked up once a month
create table if not exists public.x_handles (
  owner text primary key,
  handle text,
  checked_at timestamptz not null default now()
);
alter table public.x_handles enable row level security;
revoke all on public.x_handles from anon, authenticated;

create or replace function public.x_handles_get(p_token text, p_owners text[])
returns setof public.x_handles
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  return query select * from public.x_handles where lower(owner) = any(select lower(o) from unnest(p_owners) o)
    and checked_at > now() - interval '30 days';
end $function$;

create or replace function public.x_handles_set(p_token text, p_rows jsonb)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  insert into public.x_handles (owner, handle, checked_at)
  select r->>'owner', nullif(r->>'handle', ''), now() from jsonb_array_elements(p_rows) r
  on conflict (owner) do update set handle = excluded.handle, checked_at = now();
end $function$;

-- Every three days: how the posts did and what to change (shown in /admin/social)
create table if not exists public.social_reviews (
  id bigint generated always as identity primary key,
  period_start timestamptz not null,
  period_end timestamptz not null,
  stats jsonb not null default '{}',
  summary text not null,
  guidance text,
  model text,
  cost_usd numeric,
  created_at timestamptz not null default now()
);
alter table public.social_reviews enable row level security;
revoke all on public.social_reviews from anon, authenticated;

create or replace function public.social_review_add(p_token text, p_row jsonb)
returns setof public.social_reviews
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  return query
    with i as (
      insert into public.social_reviews (period_start, period_end, stats, summary, guidance, model, cost_usd)
      values ((p_row->>'period_start')::timestamptz, (p_row->>'period_end')::timestamptz, coalesce(p_row->'stats', '{}'),
              p_row->>'summary', p_row->>'guidance', p_row->>'model', (p_row->>'cost_usd')::numeric)
      returning *
    )
    select * from i;
end $function$;

create or replace function public.social_reviews_list(p_token text, p_limit int default 5)
returns setof public.social_reviews
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  return query select * from public.social_reviews order by created_at desc limit p_limit;
end $function$;

-- Only called server-side with the anon key + token (Content Engine, cron, /admin)
revoke execute on function public.social_upsert(text, jsonb, boolean) from public, authenticated;
revoke execute on function public.social_update(text, bigint, jsonb) from public, authenticated;
revoke execute on function public.social_finish(text, bigint, jsonb) from public, authenticated;
revoke execute on function public.social_set_metrics(text, jsonb) from public, authenticated;
revoke execute on function public.x_handles_get(text, text[]) from public, authenticated;
revoke execute on function public.x_handles_set(text, jsonb) from public, authenticated;
revoke execute on function public.social_review_add(text, jsonb) from public, authenticated;
revoke execute on function public.social_reviews_list(text, int) from public, authenticated;
grant execute on function public.social_upsert(text, jsonb, boolean) to anon;
grant execute on function public.social_update(text, bigint, jsonb) to anon;
grant execute on function public.social_finish(text, bigint, jsonb) to anon;
grant execute on function public.social_set_metrics(text, jsonb) to anon;
grant execute on function public.x_handles_get(text, text[]) to anon;
grant execute on function public.x_handles_set(text, jsonb) to anon;
grant execute on function public.social_review_add(text, jsonb) to anon;
grant execute on function public.social_reviews_list(text, int) to anon;
