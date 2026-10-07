import Link from "next/link";
import { href, type Dict, type Locale } from "@/lib/i18n";

export function SiteFooter({ lang, t }: { lang: Locale; t: Dict }) {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
        <div className="max-w-sm space-y-2">
          <p className="font-semibold text-fg">{process.env.NEXT_PUBLIC_SITE_NAME ?? "Airsc"}</p>
          <p>{t.footer.tagline}</p>
          <p className="text-xs">{t.footer.rights}</p>
        </div>
        <div className="flex gap-10">
          <ul className="space-y-2">
            <li><Link href={href(lang, "/browse")} className="hover:text-fg">{t.nav.browse}</Link></li>
            <li><Link href={href(lang, "/kits")} className="hover:text-fg">{t.nav.kits}</Link></li>
            <li><Link href={href(lang, "/guides")} className="hover:text-fg">{t.nav.guides}</Link></li>
            <li><Link href={href(lang, "/mcp")} className="hover:text-fg">{t.nav.mcp}</Link></li>
          </ul>
          <ul className="space-y-2">
            <li><Link href={href(lang, "/support")} className="hover:text-fg">{t.nav.pricing}</Link></li>
            <li><Link href={href(lang, "/account")} className="hover:text-fg">{t.nav.account}</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
