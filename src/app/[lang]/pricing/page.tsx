import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { startProCheckout } from "@/app/actions";
import { getDict, hasLocale, href } from "@/lib/i18n";
import { proProductId } from "@/lib/polar";
import { currentUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[lang]/pricing">): Promise<Metadata> {
  const { lang } = await params;
  const t = getDict(hasLocale(lang) ? lang : "en");
  return { title: t.nav.pricing, description: t.pricing.sub };
}

function Features({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-2.5 text-sm">
      {items.map((f) => (
        <li key={f} className="flex gap-2.5">
          <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function Pricing({ params, searchParams }: PageProps<"/[lang]/pricing">) {
  const { lang } = await params;
  const { billing } = await searchParams;
  if (!hasLocale(lang)) notFound();
  const p = getDict(lang).pricing;
  const { supabase, user } = await currentUser();
  const isPro = user ? !!(await supabase.from("profiles").select("fulltime").maybeSingle()).data?.fulltime : false;
  const canBuy = !!proProductId();
  const button = "mt-6 flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold";

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.08em] text-accent">{p.eyebrow}</p>
      <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight">{p.title}</h1>
      <p className="mt-3 max-w-2xl text-pretty text-lg leading-relaxed text-muted">{p.sub}</p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <section className="flex flex-col rounded-2xl border border-line bg-card p-6">
          <h2 className="font-semibold">{p.free.name}</h2>
          <p className="mt-3 flex items-baseline gap-1.5">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">{p.free.price}</span>
          </p>
          <p className="mt-1 text-sm text-muted">{p.free.note}</p>
          <Features items={p.free.features} />
          <div className="mt-auto">
            <Link href={href(lang, "/browse")} className={cn(button, "border border-line bg-card hover:border-accent hover:text-accent")}>
              {p.free.cta}
            </Link>
          </div>
        </section>

        <section className="flex flex-col rounded-2xl border-2 border-accent bg-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">{p.pro.name}</h2>
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">{p.pro.badge}</span>
          </div>
          <p className="mt-3 flex items-baseline gap-1.5">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">{p.pro.price}</span>
            <span className="text-sm text-muted">{p.pro.per}</span>
          </p>
          <p className="mt-1 text-sm text-muted">{p.pro.note}</p>
          <Features items={p.pro.features} />
          <div className="mt-auto">
            {isPro ? (
              <>
                <p className="mt-6 rounded-xl bg-accent-soft px-4 py-3 text-center text-sm font-medium text-accent">{p.pro.active}</p>
                <Link href={href(lang, "/account")} className="mt-2 block text-center text-sm text-muted hover:text-fg">{p.pro.account} →</Link>
              </>
            ) : !user ? (
              <Link href={href(lang, `/login?next=${encodeURIComponent(href(lang, "/pricing"))}`)} className={cn(button, "bg-accent text-accent-fg hover:opacity-90")}>
                {p.pro.signIn}
              </Link>
            ) : canBuy ? (
              <form action={startProCheckout.bind(null, lang, "/pricing")}>
                {billing === "error" && <p role="alert" className="mt-6 rounded-xl bg-caution-soft px-4 py-2.5 text-center text-sm text-caution">{p.pro.error}</p>}
                <button className={cn(button, "bg-accent text-accent-fg hover:opacity-90")}>{p.pro.cta} · {p.pro.price}</button>
              </form>
            ) : (
              <p className={cn(button, "bg-soft text-muted")}>{p.pro.soon}</p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-14 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-semibold">{p.why.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{p.why.text}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted">
            {p.why.list.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold">{p.faq.title}</h2>
          <dl className="mt-2 space-y-4 text-sm">
            {p.faq.items.map((f) => (
              <div key={f.q}>
                <dt className="font-medium">{f.q}</dt>
                <dd className="mt-1 leading-relaxed text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
