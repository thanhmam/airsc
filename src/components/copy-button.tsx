"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  label,
  copiedLabel,
  className,
  variant = "ghost",
}: {
  text: string;
  label?: string;
  copiedLabel: string;
  className?: string;
  variant?: "ghost" | "solid";
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg text-sm font-medium transition",
        variant === "solid"
          ? "bg-fg px-3 py-2 text-bg hover:opacity-90"
          : "px-2 py-1 text-muted hover:bg-soft hover:text-fg",
        className,
      )}
    >
      {done ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {label && <span>{done ? copiedLabel : label}</span>}
      {!label && <span className="sr-only">{done ? copiedLabel : "Copy"}</span>}
    </button>
  );
}
