import { href, type Locale } from "@/lib/i18n";
import { RUN_PRESETS } from "@/lib/social/applied";
import { loadResources, vnDay } from "@/lib/social/compose";
import { anonClient } from "@/lib/supabase/anon";
import { AppliedForm } from "../applied-form";
import { T } from "../copy";

/** A new applied post: how a resource was used in a real project */
export default async function SocialNew({ params }: PageProps<"/[lang]/admin/social/new">) {
  const { lang } = (await params) as { lang: Locale };
  const t = T[lang];
  const [resources, presetRows] = await Promise.all([
    anonClient()
      .from("resources")
      .select("slug,name")
      .order("stars", { ascending: false })
      .limit(600)
      .then((r) => (r.data ?? []) as { slug: string; name: string }[]),
    loadResources(RUN_PRESETS.map((p) => p.slug)),
  ]);
  const presets = RUN_PRESETS.flatMap((p) => {
    const r = presetRows.find((x) => x.slug === p.slug);
    return r ? [{ ...p, name: r.name }] : [];
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t.applied.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{t.applied.intro}</p>
      </div>
      <ol className="max-w-3xl list-decimal space-y-1 pl-5 text-sm text-muted">
        {t.newSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <AppliedForm presets={presets} resources={resources} today={vnDay()} queueHref={href(lang, "/admin/social")} queueLabel={t.openQueue} c={t.applied} />
    </div>
  );
}
