-- Previewer agent: real-result images per resource (README screenshots/demos, or an Airsc run).
-- previews is a jsonb array of { src, thumb, width, height, kind, animated, caption: {en, vi}, source }.
-- previews_at marks a resource as checked, also when nothing usable was found ([]).

alter table public.resources add column if not exists previews jsonb;
alter table public.resources add column if not exists previews_at timestamptz;

-- Next resources to check: published, never checked, best first
create or replace function public.agent_preview_queue(p_token text, p_limit int default 40)
returns table (full_name text, slug text, default_branch text)
language plpgsql
stable
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  return query
    select r.full_name, r.slug, r.default_branch
    from public.resources r
    where r.status = 'published' and r.previews_at is null and r.safety <> 'danger'
    order by r.quality desc nulls last, r.stars desc
    limit least(greatest(p_limit, 1), 500);
end $function$;

-- p_rows: [{ full_name, previews }]. Rows whose previews include an Airsc run keep those run images.
create or replace function public.set_previews(p_token text, p_rows jsonb)
returns int
language plpgsql
security definer
set search_path to ''
as $function$
declare
  n int;
begin
  perform private.check_token(p_token);
  update public.resources r
  set previews = coalesce(
        (select jsonb_agg(p) from jsonb_array_elements(coalesce(r.previews, '[]'::jsonb)) p where p->>'kind' = 'run'),
        '[]'::jsonb
      ) || coalesce(x.value->'previews', '[]'::jsonb),
      previews_at = now()
  from jsonb_array_elements(p_rows) x
  where r.full_name = x.value->>'full_name';
  get diagnostics n = row_count;
  return n;
end $function$;

-- Admin: check a resource again on the next run
create or replace function public.reset_previews(p_token text, p_slug text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  update public.resources set previews_at = null where slug = p_slug;
end $function$;

-- Only called server-side with the anon key + token (Content Engine, admin)
revoke execute on function public.agent_preview_queue(text, int), public.set_previews(text, jsonb),
  public.reset_previews(text, text) from authenticated;
