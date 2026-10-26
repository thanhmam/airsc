-- Signals for the engine's feedback loops (P1 of the autonomous-engine plan).
-- search_log: every search (site, instant dropdown, MCP) with how many results it had, so the engine can see
-- what people look for and do not find. engine_scoreboard: the numbers /admin/engine shows, in one call.
-- Both RPCs are guarded by the same token as the other agent RPCs; the table has no policies, so the
-- public API cannot read or write it.

create table if not exists public.search_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  q text not null,
  results integer not null,
  source text not null check (source in ('web', 'browse', 'mcp')),
  job text
);
create index if not exists search_log_at_idx on public.search_log (at desc);
create index if not exists search_log_q_idx on public.search_log (lower(q));
alter table public.search_log enable row level security;

create or replace function public.log_search(p_token text, p_q text, p_results integer, p_source text, p_job text default null)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  if length(trim(coalesce(p_q, ''))) < 2 then return; end if;
  insert into public.search_log (q, results, source, job)
  values (left(lower(trim(p_q)), 120), greatest(p_results, 0), p_source, nullif(p_job, ''));
  -- the table is a signal, not an archive: keep 90 days
  delete from public.search_log where at < now() - interval '90 days' and id % 50 = 0;
end $function$;

create or replace function public.engine_scoreboard(p_token text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare result jsonb;
begin
  perform private.check_token(p_token);
  select jsonb_build_object(
    'searches', jsonb_build_object(
      'last7', (select count(*) from public.search_log where at >= now() - interval '7 days'),
      'prev7', (select count(*) from public.search_log where at >= now() - interval '14 days' and at < now() - interval '7 days'),
      'zero_last7', (select count(*) from public.search_log where at >= now() - interval '7 days' and results = 0),
      'zero_prev7', (select count(*) from public.search_log where at >= now() - interval '14 days' and at < now() - interval '7 days' and results = 0),
      'mcp_last7', (select count(*) from public.search_log where at >= now() - interval '7 days' and source = 'mcp'),
      'zero_queries', coalesce((
        select jsonb_agg(x) from (
          select q, count(*) as n from public.search_log
           where at >= now() - interval '14 days' and results = 0
           group by q order by count(*) desc, max(at) desc limit 15) x), '[]'::jsonb),
      'top_queries', coalesce((
        select jsonb_agg(x) from (
          select q, count(*) as n, round(avg(results)) as avg_results from public.search_log
           where at >= now() - interval '14 days'
           group by q order by count(*) desc, max(at) desc limit 15) x), '[]'::jsonb)
    ),
    'catalog', jsonb_build_object(
      'published', (select count(*) from public.resources where status = 'published'),
      'new7', (select count(*) from public.resources where status = 'published' and first_seen_at >= now() - interval '7 days'),
      'new_prev7', (select count(*) from public.resources where status = 'published' and first_seen_at >= now() - interval '14 days' and first_seen_at < now() - interval '7 days'),
      'hidden', (select count(*) from public.resources where status = 'hidden'),
      'unclassified', (select count(*) from public.resources where classified_at is null),
      'unlabelled', (select count(*) from public.resources where status = 'published' and jobs = '{}'),
      'views', (select coalesce(sum(views), 0) from public.resources),
      'opens', (select coalesce(sum(downloads), 0) from public.resources),
      'jobs', coalesce((
        select jsonb_object_agg(j, n) from (
          select j, count(*) as n from public.resources, unnest(jobs) as j where status = 'published' group by j) t), '{}'::jsonb)
    ),
    'runs', coalesce((
      select jsonb_agg(x order by x.started_at desc) from (
        select id, trigger, status, stats, started_at, finished_at
          from public.pipeline_runs order by started_at desc limit 14) x), '[]'::jsonb)
  ) into result;
  return result;
end $function$;
