import { SAFETY_ICON } from "@/components/icons";
import type { Dict } from "@/lib/i18n";
import type { Safety } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLE: Record<Safety, string> = {
  safe: "bg-safe-soft text-safe",
  caution: "bg-caution-soft text-caution",
  danger: "bg-danger-soft text-danger",
};

export function SafetyBadge({ safety, t, size = "sm" }: { safety: Safety; t: Dict; size?: "sm" | "lg" }) {
  const Icon = SAFETY_ICON[safety];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs",
        STYLE[safety],
      )}
    >
      <Icon className={size === "lg" ? "size-4" : "size-3.5"} aria-hidden />
      {t.safety[safety]}
    </span>
  );
}
