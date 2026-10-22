"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { SocialResult } from "../actions";

/** Runs one server action and says how it went (Draft today, Refresh numbers, Review now) */
export function ActionButton({ action, label, done }: { action: () => Promise<SocialResult>; label: string; done: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await action();
            setMsg({ ok: r.ok, text: r.ok ? `${done}${r.error ? ` (${r.error})` : ""}` : (r.error ?? "error") });
          })
        }
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium hover:border-accent/60 disabled:opacity-50"
      >
        {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
        {label}
      </button>
      {msg && <span className={cn("text-xs", msg.ok ? "text-safe" : "text-danger")}>{msg.text}</span>}
    </span>
  );
}
