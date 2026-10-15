-- The card attached to each social post can be art-directed from /admin/social: style, featured pick
-- and the headline Sonnet writes for it. Additive only, so code using 20261015000100 keeps working.

alter table public.social_posts add column if not exists headline text;
alter table public.social_posts add column if not exists card_style text;

create or replace function public.get_social_post(p_token text, p_day date, p_channel text default 'x')
returns setof public.social_posts
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  return query select * from public.social_posts s where s.day = p_day and s.channel = p_channel;
end $function$;

-- Card settings for a post that has not gone out yet
create or replace function public.set_social_card(p_token text, p_id bigint, p_highlight text, p_headline text, p_card_style text, p_image_alt text)
returns setof public.social_posts
language plpgsql
security definer
set search_path to ''
as $function$
begin
  perform private.check_token(p_token);
  return query
    with u as (
      update public.social_posts
        set highlight = p_highlight, headline = p_headline, card_style = p_card_style, image_alt = p_image_alt, updated_at = now()
        where id = p_id and status in ('draft', 'failed')
        returning *
    )
    select * from u;
end $function$;

revoke execute on function public.get_social_post(text, date, text) from public, authenticated;
revoke execute on function public.set_social_card(text, bigint, text, text, text, text) from public, authenticated;
grant execute on function public.get_social_post(text, date, text) to anon;
grant execute on function public.set_social_card(text, bigint, text, text, text, text) to anon;
