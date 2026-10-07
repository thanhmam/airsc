import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Coffee, Heart } from "lucide-react";
import { DONATE_URL, DonateAmounts } from "@/components/donate";
import { getDict, hasLocale, href } from "@/lib/i18n";
import { anonClient } from "@/lib/supabase/anon";

export async function generateMetadata({ params }: PageProps<"/[lang]/support">): Promise<Metadata> {
  const { lang } = await params;
  const t = getDict(hasLocale(lang) ? lang : "en");
  return { title: t.support.title, description: t.support.sub };
}

export default async function Support({ params }: PageProps<"/[lang]/support">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const s = t.support;
  const { data: supporters } = await anonClient()
    .from("supporters")
    .select("name,message,created_at")
    .not("name", "is", null)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Heart className="size-6" aria-hidden />
      </span>
      <h1 className="mt-5 text-4xl font-semibold tracking-tight">{s.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">{s.sub}</p>

      <section className="mt-10 rounded-2xl border border-accent/40 bg-card p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <Coffee className="size-5 text-accent" aria-hidden /> {s.give}
        </h2>
        {DONATE_URL ? (
          <DonateAmounts supportHref={href(lang, "/support")} className="mt-4" />
        ) : (
          <p className="mt-3 text-sm text-muted">{s.soon}</p>
        )}
      </section>

      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="font-semibold">{s.why}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{s.whyText}</p>
        </div>
        <div>
          <h2 className="font-semibold">{s.costs}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted">
            {s.costsList.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-semibold">{s.supporters}</h2>
        {supporters?.length ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {supporters.map((p, i) => (
              <li key={i} className="rounded-xl border border-line bg-card p-3 text-sm">
                <p className="font-medium">{p.name}</p>
                {p.message && <p className="mt-0.5 text-muted">“{p.message}”</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">{s.noSupporters}</p>
        )}
      </section>
    </div>
  );
}
