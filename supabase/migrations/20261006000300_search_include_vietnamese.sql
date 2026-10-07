-- Include Vietnamese descriptions/summaries in full-text search
drop index if exists public.resources_search_idx;
alter table public.resources drop column search;
alter table public.resources add column search tsvector generated always as (
  setweight(to_tsvector('simple', coalesce(name,'')), 'A') ||
  setweight(to_tsvector('simple', coalesce(private.text_array_join(topics),'')), 'B') ||
  setweight(to_tsvector('simple', coalesce(description,'')), 'B') ||
  setweight(to_tsvector('simple', coalesce(summary,'')), 'C') ||
  setweight(to_tsvector('simple', coalesce(description_vi,'') || ' ' || coalesce(summary_vi,'')), 'D')
) stored;
create index resources_search_idx on public.resources using gin (search);
