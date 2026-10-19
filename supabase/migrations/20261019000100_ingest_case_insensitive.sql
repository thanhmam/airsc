-- GitHub names are case-insensitive: a repo renamed only in case (jub0t/concat -> jub0t/Concat) must
-- update its row, not insert a second one that collides on slug and fails the whole engine run.
-- slug is unique and derived from lower(full_name), so no existing rows clash on this index.

create unique index if not exists resources_full_name_lower_key on public.resources (lower(full_name));

create or replace function public.ingest_resources(p_token text, p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare n int;
begin
  perform private.check_token(p_token);
  insert into public.resources (
    slug, type, name, full_name, owner, repo_url, homepage, description, description_vi,
    summary, summary_vi, readme_excerpt, stars, forks, license, license_ok, topics, language,
    default_branch, pushed_at, version, safety, safety_notes, install, npm_package, crawled_at
  )
  select x.slug, x.type, x.name, x.full_name, x.owner, x.repo_url, x.homepage, x.description, x.description_vi,
         x.summary, x.summary_vi, x.readme_excerpt, coalesce(x.stars,0), coalesce(x.forks,0), x.license,
         coalesce(x.license_ok,false), coalesce(x.topics,'{}'), x.language, coalesce(x.default_branch,'main'),
         x.pushed_at, x.version, coalesce(x.safety,'caution'), coalesce(x.safety_notes,'[]'),
         coalesce(x.install,'{}'), x.npm_package, now()
    from jsonb_to_recordset(p_rows) as x(
      slug text, type text, name text, full_name text, owner text, repo_url text, homepage text,
      description text, description_vi text, summary text, summary_vi text, readme_excerpt text,
      stars int, forks int, license text, license_ok boolean, topics text[], language text,
      default_branch text, pushed_at timestamptz, version text, safety text, safety_notes jsonb,
      install jsonb, npm_package text)
  -- slug is kept on conflict so resource URLs, picks and posts stay stable
  on conflict ((lower(full_name))) do update set
    full_name = excluded.full_name, owner = excluded.owner,
    type = excluded.type, name = excluded.name, repo_url = excluded.repo_url, homepage = excluded.homepage,
    description = excluded.description,
    description_vi = coalesce(excluded.description_vi, public.resources.description_vi),
    summary = coalesce(excluded.summary, public.resources.summary),
    summary_vi = coalesce(excluded.summary_vi, public.resources.summary_vi),
    readme_excerpt = excluded.readme_excerpt, stars = excluded.stars, forks = excluded.forks,
    license = excluded.license, license_ok = excluded.license_ok, topics = excluded.topics,
    language = excluded.language, default_branch = excluded.default_branch, pushed_at = excluded.pushed_at,
    version = excluded.version, safety = excluded.safety, safety_notes = excluded.safety_notes,
    install = excluded.install, npm_package = excluded.npm_package, crawled_at = now();
  get diagnostics n = row_count;
  return n;
end $function$;
