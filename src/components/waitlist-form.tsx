"use client";

import { useActionState } from "react";
import { joinTeamWaitlist } from "@/app/actions";

export function WaitlistForm({ label, done, placeholder }: { label: string; done: string; placeholder: string }) {
  const [state, action, pending] = useActionState(joinTeamWaitlist, null);
  if (state?.ok) return <p className="text-sm font-medium text-safe">{done}</p>;
  return (
    <form action={action} className="flex gap-2">
      <input
        name="email"
        type="email"
        required
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 text-sm outline-none focus:border-accent"
      />
      <button disabled={pending} className="h-10 shrink-0 rounded-xl border border-line px-4 text-sm font-medium hover:border-fg/30 disabled:opacity-60">
        {label}
      </button>
    </form>
  );
}
