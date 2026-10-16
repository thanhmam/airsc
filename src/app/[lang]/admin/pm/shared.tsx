import { cn } from "@/lib/utils";

export function PmHeader({ title, intro, children }: { title: string; intro: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{intro}</p>
      </div>
      {children}
    </div>
  );
}

const TONE = {
  done: "bg-safe-soft text-safe",
  live: "bg-safe-soft text-safe",
  doing: "bg-accent-soft text-accent",
  partial: "bg-accent-soft text-accent",
  next: "bg-caution-soft text-caution",
  planned: "bg-caution-soft text-caution",
  idea: "bg-soft text-muted",
} as const;

export function StatusPill({ status, label }: { status: keyof typeof TONE; label: string }) {
  return <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", TONE[status])}>{label}</span>;
}

export const card = "rounded-2xl border border-line bg-card p-4";

/** "2026-10-15" → localized date; ranges like "a → b" keep their arrow */
export const fmtDay = (day: string, lang: string) =>
  day
    .split(" → ")
    .map((d) => new Date(`${d}T12:00:00+07:00`).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "numeric", month: "short", year: "numeric" }))
    .join(" → ");
