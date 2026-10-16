import type { Locale } from "@/lib/i18n";
import { FEATURES, pmCopy, tr } from "../content";
import { PmHeader, StatusPill } from "../shared";

export default async function PmFeatures({ params }: PageProps<"/[lang]/admin/pm/features">) {
  const { lang } = (await params) as { lang: Locale };
  const t = pmCopy(lang);

  return (
    <div className="space-y-6">
      <PmHeader title={t.tabs.features} intro={t.features.intro} />
      {FEATURES.map((g) => (
        <section key={g.title.en}>
          <h2 className="mb-2 text-sm font-medium">
            {tr(g.title, lang)} <span className="text-muted">· {g.items.length}</span>
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <tbody className="divide-y divide-line">
                {g.items.map((f) => (
                  <tr key={f.name.en} className="align-top hover:bg-soft/60">
                    <td className="w-44 px-3 py-2.5 font-medium">{tr(f.name, lang)}</td>
                    <td className="px-3 py-2.5 text-muted">{tr(f.desc, lang)}</td>
                    <td className="w-56 px-3 py-2.5 font-mono text-xs text-muted">{f.code}</td>
                    <td className="w-24 px-3 py-2.5 text-right">
                      <StatusPill status={f.status} label={t.features.status[f.status]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
