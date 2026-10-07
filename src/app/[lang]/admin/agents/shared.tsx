import { cn } from "@/lib/utils";

export type Run = {
  id: number;
  run_id: string;
  trigger: string;
  status: string;
  stats: Record<string, number>;
  log: { at: string; msg: string }[];
  started_at: string;
  finished_at: string | null;
};

export const duration = (a: string, b: string | null) => {
  const s = Math.round(((b ? new Date(b) : new Date()).getTime() - new Date(a).getTime()) / 1000);
  return s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m` : s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
};

export const StatusPill = ({ status }: { status: string }) => (
  <span
    className={cn(
      "rounded-full px-2 py-0.5 text-xs font-medium",
      status === "completed" ? "bg-safe-soft text-safe" : status === "failed" ? "bg-danger-soft text-danger" : "bg-caution-soft text-caution",
    )}
  >
    {status}
  </span>
);
