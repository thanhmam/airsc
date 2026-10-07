"use client";

import { useState, useTransition } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { createApiKey } from "@/app/actions";
import { CopyButton } from "@/components/copy-button";

export function ApiKeyPanel({
  prefix,
  labels,
}: {
  prefix: string | null;
  labels: { generate: string; regenerate: string; keyOnce: string; copied: string };
}) {
  const [key, setKey] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      {key ? (
        <>
          <div className="flex items-center gap-2 rounded-xl bg-term-bg px-3 py-2 font-mono text-xs text-term-fg">
            <span className="min-w-0 flex-1 truncate">{key}</span>
            <CopyButton text={key} copiedLabel={labels.copied} className="text-white/70 hover:bg-white/10 hover:text-white" />
          </div>
          <p className="text-xs font-medium text-caution">{labels.keyOnce}</p>
        </>
      ) : (
        prefix && <p className="font-mono text-sm text-muted">{prefix}••••••••••••</p>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setKey((await createApiKey()).key ?? null))}
        className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium hover:border-fg/30 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <KeyRound className="size-4" aria-hidden />}
        {prefix || key ? labels.regenerate : labels.generate}
      </button>
    </div>
  );
}
