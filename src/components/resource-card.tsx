import Link from "next/link";
import { Star } from "lucide-react";
import { TYPE_ICON } from "@/components/icons";
import { SafetyBadge } from "@/components/safety-badge";
import type { ResourceCard as Card } from "@/lib/data";
import { href, type Dict, type Locale } from "@/lib/i18n";
import { compact } from "@/lib/utils";

export function ResourceCard({ r, lang, t }: { r: Card; lang: Locale; t: Dict }) {
  const Icon = TYPE_ICON[r.type];
  const blurb = (lang === "vi" ? r.summary_vi || r.description_vi : r.summary) || r.description || "";
  return (
    <Link
      href={href(lang, `/r/${r.slug}`)}
      className="group flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[0_8px_30px_-12px_rgba(90,61,240,0.35)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
          <Icon className="size-3.5" aria-hidden />
          {t.types[r.type]}
        </span>
        <SafetyBadge safety={r.safety} t={t} />
      </div>
      <div className="min-w-0">
        <h3 className="truncate font-semibold tracking-tight group-hover:text-accent">{r.name}</h3>
        <p className="truncate text-xs text-muted">{r.owner}</p>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-muted">{blurb}</p>
      <div className="mt-auto flex items-center gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Star className="size-3.5" aria-hidden />
          {compact(r.stars)}
        </span>
        {r.license && <span>{r.license}</span>}
      </div>
    </Link>
  );
}
