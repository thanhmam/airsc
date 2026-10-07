"use client";

import { useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { sendMagicLink } from "@/app/actions";

export function LoginForm({
  lang,
  next,
  labels,
}: {
  lang: string;
  next?: string;
  labels: { email: string; send: string; sent: string };
}) {
  const [state, action, pending] = useActionState(sendMagicLink, null);
  if (state?.ok)
    return (
      <p className="flex items-center gap-2 rounded-xl bg-safe-soft px-4 py-3 text-sm text-safe">
        <MailCheck className="size-4" aria-hidden /> {labels.sent}
      </p>
    );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="lang" value={lang} />
      {next && <input type="hidden" name="next" value={next} />}
      <label className="block text-sm font-medium" htmlFor="email">{labels.email}</label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        className="h-11 w-full rounded-xl border border-line bg-card px-3 outline-none focus:border-accent focus:ring-4 focus:ring-accent/15"
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        disabled={pending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {labels.send}
      </button>
    </form>
  );
}
