-- Today's picks: the four resources featured on the homepage stage, chosen once per Vietnam day
-- by the Content Engine (src/lib/engine/picks.ts). The history is what keeps picks from repeating.

create table if not exists public.daily_picks (
  day date primary key,
  slugs text[] not null,
  created_at timestamptz not null default now()
);

alter table public.daily_picks enable row level security;

drop policy if exists "daily picks are public" on public.daily_picks;
create policy "daily picks are public" on public.daily_picks
  for select to anon, authenticated using (true);

revoke all on public.daily_picks from anon, authenticated;
grant select on public.daily_picks to anon, authenticated;

-- Stores today's picks. The first call of the day wins, so the homepage stays the same all day;
-- returns the slugs that are in effect.
create or replace function public.set_daily_picks(p_token text, p_slugs text[])
returns text[]
language plpgsql
security definer
set search_path to ''
as $function$
declare
  d date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  perform private.check_token(p_token);
  insert into public.daily_picks (day, slugs) values (d, p_slugs) on conflict (day) do nothing;
  return (select p.slugs from public.daily_picks p where p.day = d);
end $function$;

-- Only called server-side with the anon key + token (Content Engine)
revoke execute on function public.set_daily_picks(text, text[]) from public, authenticated;
grant execute on function public.set_daily_picks(text, text[]) to anon;
