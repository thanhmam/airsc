import { Search } from "lucide-react";
import { href, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Plain GET form: works without JS and keeps URLs shareable */
export function SearchBox({
  lang,
  placeholder,
  defaultValue,
  size = "md",
  hidden,
}: {
  lang: Locale;
  placeholder: string;
  defaultValue?: string;
  size?: "md" | "lg";
  hidden?: Record<string, string | undefined>;
}) {
  return (
    <form action={href(lang, "/browse")} role="search" className="relative w-full">
      <Search
        className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted", size === "lg" ? "left-4 size-5" : "left-3 size-4")}
        aria-hidden
      />
      <input
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "w-full rounded-2xl border border-line bg-card outline-none transition placeholder:text-muted/80 focus:border-accent focus:ring-4 focus:ring-accent/15",
          size === "lg" ? "h-14 pl-12 pr-4 text-base shadow-sm" : "h-11 pl-9 pr-3 text-sm",
        )}
      />
      {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
    </form>
  );
}
