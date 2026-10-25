import { Sparkles } from "lucide-react";

/** Slim bar on every page; the layout pins it to the top together with the header */
export function DonateBar({ text, cta, pricingHref }: { text: string; cta: string; pricingHref: string }) {
  return (
    <div className="border-b border-line bg-accent-soft text-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:px-6 sm:py-1.5">
        <Sparkles className="size-4 shrink-0 text-accent" aria-hidden />
        <p className="min-w-0 flex-1 truncate">{text}</p>
        <a href={pricingHref} className="shrink-0 -my-3 rounded-full bg-accent px-3 py-3 text-xs font-medium text-accent-fg hover:opacity-90 sm:my-0 sm:py-0.5">
          {cta}
        </a>
      </div>
    </div>
  );
}
