import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { anonClient } from "@/lib/supabase/anon";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BadgeCheck, ExternalLink, GitFork, Star } from "lucide-react";
import { Previews } from "@/components/previews";
import { ShowcasePlayer } from "@/components/showcase/player";
import { categoryLabel } from "@/lib/taxonomy";
import { CopyButton } from "@/components/copy-button";
import { GetResource } from "@/components/get-resource";
import { InstallPreview } from "@/components/demos";
import { KIT_ICON, TYPE_ICON } from "@/components/icons";
import { SafetyBadge } from "@/components/safety-badge";
import { runFor } from "@/lib/airsc-runs";
import { getResource, kitsForResource } from "@/lib/data";
import { getDict, hasLocale, href } from "@/lib/i18n";
import { fmtDate, tzFor } from "@/lib/time";
import { compact, timeAgo } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[lang]/r/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const r = await getResource(slug);
  if (!r) return {};
  const vi = lang === "vi";
  return {
    title: `${r.name} · ${r.owner}`,
    description: (vi ? r.summary_vi || r.description_vi : r.summary) || r.description || undefined,
    alternates: { languages: { en: `/r/${slug}`, vi: `/vi/r/${slug}` } },
  };
}

export default async function ResourcePage({ params }: PageProps<"/[lang]/r/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const r = await getResource(slug);
  if (!r) notFound();
  const [kits, h] = await Promise.all([kitsForResource(r.id), headers()]);
  // count the view after the response is sent; skip crawlers and link previews
  if (!/bot|crawl|spider|slurp|preview|headless|lighthouse|curl|wget/i.test(h.get("user-agent") ?? "bot")) {
    after(async () => {
      await anonClient().rpc("track_view", { p_slug: r.slug });
    });
  }
  const vi = lang === "vi";
  const Icon = TYPE_ICON[r.type];
  const summary = (vi ? r.summary_vi : r.summary) || r.description;
  // early machine translations sometimes contain whole README chunks: fall back to the GitHub description
  const viDescription = r.description_vi && r.description_vi.length < 400 ? r.description_vi : null;
  const description = vi ? viDescription || r.description : r.description;
  const showcase = r.showcase?.[lang];
  const run = runFor(r.slug);
  const mcp = r.install.mcp;
  const previewLines = r.install.commands?.length
    ? r.install.commands.map((c) => c.cmd.split(" && ")).flat().slice(0, 4)
    : mcp
      ? [`${mcp.config.command ?? "npx"} ${(mcp.config.args ?? []).join(" ")}`.trim()]
      : [`git clone https://github.com/${r.full_name}`];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-muted">
        <Link href={href(lang, "/browse")} className="hover:text-fg">{t.nav.browse}</Link>
        <span className="mx-2">/</span>
        <Link href={href(lang, `/browse?type=${r.type}`)} className="hover:text-fg">{t.typesPlural[r.type]}</Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-soft px-2.5 py-1 font-medium text-fg">
                <Icon className="size-3.5" aria-hidden /> {t.types[r.type]}
              </span>
              <SafetyBadge safety={r.safety} t={t} />
              {r.category && (
                <Link href={href(lang, `/browse?category=${r.category}`)} className="rounded-full border border-line px-2.5 py-0.5 text-xs hover:border-fg/30">
                  {categoryLabel(r.category, lang)}
                </Link>
              )}
              {r.level && <span className="rounded-full border border-line px-2.5 py-0.5 text-xs">{t.content.level[r.level]}</span>}
              {r.demo?.ok && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                  <BadgeCheck className="size-3.5" aria-hidden /> {t.content.verified}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight break-words sm:text-4xl">{r.name}</h1>
            <p className="text-sm text-muted">
              {r.owner} · <a href={`/go/${r.slug}`} target="_blank" rel="noreferrer" className="hover:text-fg">{r.full_name}</a>
            </p>
            {summary && <p className="max-w-2xl text-lg leading-relaxed text-pretty">{summary}</p>}
            {description && description !== summary && <p className="line-clamp-3 max-w-2xl text-muted">{description}</p>}
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1"><Star className="size-4" aria-hidden />{compact(r.stars)} {t.resource.stars}</span>
              <span className="inline-flex items-center gap-1"><GitFork className="size-4" aria-hidden />{compact(r.forks)}</span>
              <span>{t.resource.license}: {r.license ?? t.resource.noLicense}</span>
              <span>{t.resource.updated} {timeAgo(r.pushed_at, lang)}</span>
              <span>{compact(r.downloads)} {t.resource.downloads}</span>
            </div>
          </header>

          {(run || (r.previews?.length ?? 0) > 0) && (
            <Previews name={r.name} owner={r.owner} repoUrl={r.repo_url} run={run} previews={r.previews ?? []} lang={lang} t={t} />
          )}

          {showcase?.length ? (
            <section aria-labelledby="showcase" className="space-y-2">
              <h2 id="showcase" className="text-lg font-semibold">{t.content.showcase}</h2>
              <ShowcasePlayer scenes={showcase} name={r.name} label={t.content.showcase} />
              <p className="text-xs text-muted">{t.content.illustrative}</p>
            </section>
          ) : (
            <section aria-labelledby="preview" className="space-y-3">
              <h2 id="preview" className="text-lg font-semibold">{t.resource.preview}</h2>
              <InstallPreview lines={previewLines} doneLabel={vi ? "Đã cài xong" : "Installed"} />
            </section>
          )}

          {r.use_cases?.length > 0 && (
            <section aria-labelledby="usecases" className="space-y-3">
              <h2 id="usecases" className="text-lg font-semibold">{t.content.useCases}</h2>
              <ul className="grid gap-2 sm:grid-cols-3">
                {r.use_cases.map((u) => (
                  <li key={u.en} className="rounded-xl border border-line bg-card p-4 text-sm leading-relaxed">{vi ? u.vi : u.en}</li>
                ))}
              </ul>
            </section>
          )}

          {r.prompts?.length > 0 && (
            <section aria-labelledby="prompts" className="space-y-3">
              <h2 id="prompts" className="text-lg font-semibold">{t.content.tryAsking}</h2>
              <ul className="space-y-2">
                {r.prompts.map((p) => {
                  const text = vi ? p.vi : p.en;
                  return (
                    <li key={p.en} className="flex items-start justify-between gap-3 rounded-xl bg-soft px-4 py-3 text-sm">
                      <span>“{text}”</span>
                      <CopyButton text={text} copiedLabel={t.resource.copied} className="-my-1 shrink-0" />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {r.demo?.ok && r.demo.tools?.length ? (
            <section aria-labelledby="demo" className="space-y-3">
              <h2 id="demo" className="flex items-center gap-2 text-lg font-semibold">
                <BadgeCheck className="size-5 text-accent" aria-hidden /> {t.content.verified} · {r.demo.tools.length} {t.content.tools}
              </h2>
              <p className="text-sm text-muted">{t.content.verifiedDesc}</p>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
                {r.demo.tools.slice(0, 15).map((tool) => (
                  <li key={tool.name} className="px-4 py-2.5 text-sm">
                    <code className="font-mono text-xs font-semibold">{tool.name}</code>
                    {tool.description && <p className="mt-0.5 line-clamp-2 text-muted">{tool.description}</p>}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted">
                <code>{r.demo.command}</code> · {fmtDate(r.demo.verified_at, lang, tzFor(lang))}
              </p>
            </section>
          ) : null}

          <section aria-labelledby="safety" className="space-y-3">
            <h2 id="safety" className="text-lg font-semibold">{t.resource.safetyTitle}</h2>
            <div className="rounded-2xl border border-line bg-card p-5">
              <div className="flex items-center gap-3">
                <SafetyBadge safety={r.safety} t={t} size="lg" />
                <p className="text-sm text-muted">{t.safety[`${r.safety}Hint`]}</p>
              </div>
              {r.safety_notes.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm">
                  {r.safety_notes.map((n) => (
                    <li key={n.code} className="flex gap-2">
                      <span className={n.level === "danger" ? "text-danger" : "text-caution"}>●</span>
                      <span>
                        {vi ? n.vi : n.en}
                        {n.file && <code className="ml-1.5 rounded bg-soft px-1.5 py-0.5 text-xs text-muted">{n.file}</code>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs text-muted">{t.resource.scannedNote}</p>
            </div>
          </section>

          {r.readme_excerpt && (
            <section aria-labelledby="readme" className="space-y-3">
              <h2 id="readme" className="text-lg font-semibold">{t.resource.readme}</h2>
              <div className="prose-readme rounded-2xl border border-line bg-card p-5 text-[15px]">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  skipHtml
                  urlTransform={(url) =>
                    /^(https?:|mailto:|#)/.test(url)
                      ? url
                      : `https://github.com/${r.full_name}/blob/${r.default_branch}/${url.replace(/^\.?\//, "")}`
                  }
                  components={{ a: (p) => <a {...p} target="_blank" rel="noreferrer nofollow" /> }}
                >
                  {r.readme_excerpt}
                </Markdown>
              </div>
              <a href={`/go/${r.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
                {t.resource.source} <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <GetResource r={r} lang={lang} t={t} />

          {kits.length > 0 && (
            <div className="rounded-2xl border border-line bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold">{t.resource.inKits}</h2>
              <ul className="space-y-2">
                {kits.map((k) => {
                  const KIcon = KIT_ICON[k.icon] ?? KIT_ICON.box;
                  return (
                    <li key={k.slug}>
                      <Link href={href(lang, `/kits/${k.slug}`)} className="flex items-center gap-2 text-sm hover:text-accent">
                        <KIcon className="size-4 text-accent" aria-hidden /> {vi ? k.title_vi : k.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
