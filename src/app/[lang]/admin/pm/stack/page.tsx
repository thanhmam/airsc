import type { Locale } from "@/lib/i18n";
import pkg from "../../../../../../package.json";
import { CONVENTIONS, pmCopy, STACK, tr } from "../content";
import { card, PmHeader } from "../shared";

const VERSIONS: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };

export default async function PmStack({ params }: PageProps<"/[lang]/admin/pm/stack">) {
  const { lang } = (await params) as { lang: Locale };
  const t = pmCopy(lang);

  return (
    <div className="space-y-6">
      <PmHeader title={t.tabs.stack} intro={t.stack.intro} />

      <div className="grid gap-4 lg:grid-cols-2">
        {STACK.map((g) => (
          <section key={g.title.en} className={card}>
            <h2 className="mb-3 text-sm font-medium">{tr(g.title, lang)}</h2>
            <ul className="divide-y divide-line">
              {g.items.map((item) => {
                const version = item.pkg ? VERSIONS[item.pkg] : undefined;
                return (
                  <li key={item.name} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{item.name}</span>
                      {version && <span className="rounded-md bg-soft px-1.5 py-0.5 font-mono text-[11px] text-muted">{version.replace(/^\^/, "")}</span>}
                      {item.unused && <span className="rounded-md bg-caution-soft px-1.5 py-0.5 text-[11px] text-caution">{t.stack.unused}</span>}
                    </div>
                    <p className="text-sm text-muted">{tr(item.role, lang)}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <section className={card}>
        <h2 className="mb-3 text-sm font-medium">{t.stack.conventions}</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted marker:text-line-strong">
          {CONVENTIONS.map((c) => (
            <li key={c.en}>{tr(c, lang)}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
