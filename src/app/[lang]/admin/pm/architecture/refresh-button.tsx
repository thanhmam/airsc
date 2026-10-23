"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { refreshArchitecture } from "../actions";

export type RefreshCopy = { update: string; updating: string; started: string; notConfigured: string; command: string };

const COMMAND = "/refresh-architecture";

/** Starts the architecture update on GitHub; without the token it shows the command to run in Claude Code instead */
export function RefreshButton({ configured, running, highlight, c }: { configured: boolean; running: boolean; highlight: boolean; c: RefreshCopy }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={pending || running || !configured}
        onClick={() =>
          start(async () => {
            const r = await refreshArchitecture();
            setMsg({ ok: r.ok, text: r.ok ? c.started : (r.error ?? "error") });
          })
        }
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50",
          highlight ? "bg-accent text-accent-fg hover:opacity-90" : "border border-line hover:border-accent/60",
        )}
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
        {pending ? c.updating : c.update}
      </button>
      {!configured && (
        <p className="max-w-xl text-xs text-muted">
          {c.notConfigured} <code className="rounded bg-soft px-1.5 py-0.5 font-mono">{COMMAND}</code>
        </p>
      )}
      {msg && <p className={cn("max-w-xl text-sm", msg.ok ? "text-safe" : "text-danger")}>{msg.text}</p>}
    </div>
  );
}
