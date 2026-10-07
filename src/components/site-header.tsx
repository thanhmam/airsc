import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { href, type Dict, type Locale } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";

export async function SiteHeader({ lang, t }: { lang: Locale; t: Dict }) {
  const { user } = await currentUser();
  const nav = [
    { label: t.nav.browse, path: "/browse" },
    { label: t.nav.kits, path: "/kits" },
    { label: t.nav.guides, path: "/guides" },
    { label: t.nav.mcp, path: "/mcp" },
    { label: t.nav.pricing, path: "/support" },
  ];
  return (
    <header className="border-b border-line/80 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href={href(lang)} className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-fg">A</span>
          <span>{process.env.NEXT_PUBLIC_SITE_NAME ?? "Airsc"}</span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {nav.map((n) => (
            <Link key={n.path} href={href(lang, n.path)} className="rounded-lg px-3 py-1.5 text-muted hover:bg-soft hover:text-fg">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LangSwitch lang={lang} />
          {user ? (
            <Link
              href={href(lang, "/account")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:border-fg/30"
            >
              <span>{t.nav.account}</span>

            </Link>
          ) : (
            <Link
              href={href(lang, "/login")}
              className="rounded-lg bg-fg px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90"
            >
              {t.nav.signIn}
            </Link>
          )}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-line/60 px-3 py-1.5 text-sm md:hidden">
        {nav.map((n) => (
          <Link key={n.path} href={href(lang, n.path)} className="shrink-0 rounded-lg px-3 py-1 text-muted hover:bg-soft hover:text-fg">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
