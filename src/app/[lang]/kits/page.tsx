import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KIT_ICON } from "@/components/icons";
import { getKits } from "@/lib/data";
import { getDict, hasLocale, href } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/kits">): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDict(hasLocale(lang) ? lang : "en").kits.title };
}

export default async function KitsPage({ params }: PageProps<"/[lang]/kits">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const kits = await getKits();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t.kits.title}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t.kits.sub}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kits.map((k) => {
          const Icon = KIT_ICON[k.icon] ?? KIT_ICON.box;
          return (
            <Link
              key={k.slug}
              href={href(lang, `/kits/${k.slug}`)}
              className="group flex flex-col gap-3 rounded-2xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:border-accent/50"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="text-lg font-semibold group-hover:text-accent">{lang === "vi" ? k.title_vi : k.title}</h2>
              <p className="text-sm leading-relaxed text-muted">{lang === "vi" ? k.description_vi : k.description}</p>
              <p className="mt-auto pt-2 text-xs text-muted">
                {k.count} {k.count === 1 && lang === "en" ? "resource" : t.kits.items} · {t.kits.kitCost}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
