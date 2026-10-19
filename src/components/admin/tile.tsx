import { cn } from "@/lib/utils";

/** One KPI on an admin dashboard */
export function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "accent" | "warn" }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-4", tone === "accent" ? "border-accent/60" : tone === "warn" ? "border-caution/60" : "border-line")}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}
