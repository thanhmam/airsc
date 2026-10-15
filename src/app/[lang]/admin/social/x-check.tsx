"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { testXConnection } from "../actions";

export type XCheckCopy = { test: string; ok: string; fail: string; hint401: string; hint403: string };

/** Signs a read-only request with the deployment's X keys and shows which account they belong to */
export function XCheck({ c }: { c: XCheckCopy }) {
  const [res, setRes] = useState<{ ok: boolean; text: string; hint?: string } | null>(null);
  const [pending, start] = useTransition();
  const run = () =>
    start(async () => {
      const r = await testXConnection();
      if (r.ok) return setRes({ ok: true, text: `${c.ok} @${r.username}` });
      const hint = / 401/.test(r.error ?? "") ? c.hint401 : / 403/.test(r.error ?? "") ? c.hint403 : undefined;
      setRes({ ok: false, text: `${c.fail} ${r.error}`, hint });
    });
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="inline-flex h-8 w-fit items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium hover:border-accent/60 disabled:opacity-50"
      >
        {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
        {c.test}
      </button>
      {res && <p className={cn("break-all font-mono text-xs", res.ok ? "text-safe" : "text-danger")}>{res.text}</p>}
      {res?.hint && <p className="text-xs text-muted">{res.hint}</p>}
    </div>
  );
}
