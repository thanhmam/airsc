import Link from "next/link";

/** Previous / next links for an admin table */
export function Pager({ page, pages, prev, next, labels }: { page: number; pages: number; prev: string; next: string; labels: { prev: string; next: string; page: string } }) {
  if (pages <= 1) return null;
  const link = "rounded-lg border border-line bg-card px-3 py-1.5 text-sm hover:bg-soft";
  return (
    <nav className="flex items-center justify-between gap-3 text-sm text-muted" aria-label="Pages">
      {page > 1 ? <Link href={prev} className={link}>← {labels.prev}</Link> : <span />}
      <span className="tabular-nums">{labels.page} {page} / {pages}</span>
      {page < pages ? <Link href={next} className={link}>{labels.next} →</Link> : <span />}
    </nav>
  );
}
