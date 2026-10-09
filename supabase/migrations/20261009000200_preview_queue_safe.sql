-- Previewer queue: only safe resources, and only the 300 best (quality, then stars).
-- Pictures matter most on the cards people actually open, and every vision call costs credit.

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
    where r.id in (
            select t.id from public.resources t
            where t.status = 'published' and t.safety = 'safe'
            order by t.quality desc nulls last, t.stars desc
            limit 300
          )
      and r.previews_at is null
    order by r.quality desc nulls last, r.stars desc
    limit least(greatest(p_limit, 1), 500);
end $function$;
