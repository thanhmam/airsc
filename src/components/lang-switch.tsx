"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

export function LangSwitch({ lang }: { lang: Locale }) {
  const path = usePathname() || "/";
  const bare = path === "/vi" ? "/" : path.startsWith("/vi/") ? path.slice(3) : path;
  const target = lang === "en" ? (bare === "/" ? "/vi" : `/vi${bare}`) : bare;
  return (
    <Link
      href={target}
      hrefLang={lang === "en" ? "vi" : "en"}
      className="rounded-lg px-3 py-3 text-xs font-semibold uppercase sm:px-2 sm:py-1 tracking-wide text-muted hover:bg-soft hover:text-fg"
    >
      {lang === "en" ? "VI" : "EN"}
    </Link>
  );
}
