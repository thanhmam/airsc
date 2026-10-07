import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KIT_ICON } from "@/components/icons";
import { ResourceCard } from "@/components/resource-card";
import { getKit } from "@/lib/data";
import { getDict, hasLocale, href } from "@/lib/i18n";
import { agentPrompt } from "@/lib/install-links";
import { CopyButton } from "@/components/copy-button";
import { getResource } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/[lang]/kits/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const data = await getKit(slug);
  if (!data) return {};
  return { title: lang === "vi" ? data.kit.title_vi : data.kit.title };
}

export default async function KitPage({ params }: PageProps<"/[lang]/kits/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const data = await getKit(slug);
  if (!data) notFound();
  const { kit, items } = data;
  const vi = lang === "vi";
  const Icon = KIT_ICON[kit.icon] ?? KIT_ICON.box;
  const full = await Promise.all(items.map((i) => getResource(i.slug)));
  const kitPrompt = [
    vi ? `Cài bộ "${kit.title_vi}" gồm các tài nguyên sau, từng cái một:` : `Install the "${kit.title}" kit, one item at a time:`,
    ...full.filter(Boolean).map((r, i) => `${i + 1}. ${agentPrompt(r!)}`),
  ].join("\n\n");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-muted">
        <Link href={href(lang, "/kits")} className="hover:text-fg">{t.kits.title}</Link>
      </nav>
      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
            <Icon className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">{vi ? kit.title_vi : kit.title}</h1>
          <p className="mt-2 max-w-2xl text-lg text-muted">{vi ? kit.description_vi : kit.description}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {items.map((r) => (
              <ResourceCard key={r.id} r={r} lang={lang} t={t} />
            ))}
          </div>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-4 rounded-2xl border border-line bg-card p-5">
            <p className="font-semibold">
              {items.length} {t.kits.items}
            </p>
            <p className="text-sm text-muted">{t.kits.kitCost}</p>
            <div className="space-y-2 border-t border-line pt-4">
              <p className="text-xs text-muted">{t.resource.promptIntro}</p>
              <div className="relative rounded-xl bg-soft">
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap p-3 pr-10 font-mono text-xs leading-relaxed">{kitPrompt}</pre>
                <CopyButton text={kitPrompt} copiedLabel={t.resource.copied} className="absolute right-1.5 top-1.5" />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
