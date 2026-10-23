import { CheckCircle2, Lock } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import lock from "../../../../../../stack.lock.json";
import pkg from "../../../../../../package.json";
import { CONVENTIONS, pmCopy, STACK, tr } from "../content";
import { card, PmHeader } from "../shared";

const VERSIONS: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
const CORE = lock.core as Record<string, string>;

/** Every package some entry of the list describes */
const DESCRIBED = new Set(STACK.flatMap((g) => g.items.flatMap((i) => [...(i.pkg ? [i.pkg] : []), ...(i.also ?? [])])));

export default async function PmStack({ params }: PageProps<"/[lang]/admin/pm/stack">) {
  const { lang } = (await params) as { lang: Locale };
  const t = pmCopy(lang);
  const s = t.stack;
  // packages in package.json that no entry above describes (a new dependency shows up here at once)
  const unlisted = Object.keys(VERSIONS).filter((name) => !DESCRIBED.has(name)).sort();

  return (
    <div className="space-y-6">
      <PmHeader title={t.tabs.stack} intro={s.intro}>
        <p className="inline-flex items-center gap-1.5 text-xs text-muted">
          <CheckCircle2 className="size-4 text-safe" aria-hidden /> {s.checked}
        </p>
      </PmHeader>

      <section className={card}>
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <Lock className="size-4 text-accent" aria-hidden /> {s.lockTitle}
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">{s.lockIntro}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(CORE).map(([name, major]) => (
            <li key={name} className="rounded-lg border border-line bg-bg px-2 py-1 font-mono text-xs" title={`${s.lockedBy} ${major}`}>
              {name} <span className="text-accent">{major}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {STACK.map((g) => (
          <section key={g.title.en} className={card}>
            <h2 className="mb-3 text-sm font-medium">{tr(g.title, lang)}</h2>
            <ul className="divide-y divide-line">
              {g.items.map((item) => {
                const version = item.pkg ? VERSIONS[item.pkg] : undefined;
                const locked = item.pkg ? CORE[item.pkg] : undefined;
                return (
                  <li key={item.name} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{item.name}</span>
                      {version && <span className="rounded-md bg-soft px-1.5 py-0.5 font-mono text-[11px] text-muted">{version.replace(/^\^/, "")}</span>}
                      {locked && (
                        <span title={s.coreHint} className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">
                          <Lock className="size-3" aria-hidden /> {s.core}
                        </span>
                      )}
                      {item.unused && <span className="rounded-md bg-caution-soft px-1.5 py-0.5 text-[11px] text-caution">{s.unused}</span>}
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
        <h2 className="mb-1 text-sm font-medium">{s.unlisted}</h2>
        {unlisted.length ? (
          <>
            <p className="text-sm text-muted">{s.unlistedIntro}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {unlisted.map((n) => (
                <li key={n} className="rounded-lg bg-caution-soft px-2 py-1 font-mono text-xs text-caution">
                  {n} {VERSIONS[n]}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted">{s.noneUnlisted}</p>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-3 text-sm font-medium">{s.conventions}</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted marker:text-line-strong">
          {CONVENTIONS.map((c) => (
            <li key={c.en}>{tr(c, lang)}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
