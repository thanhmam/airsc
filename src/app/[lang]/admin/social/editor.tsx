"use client";

import { useState, useTransition } from "react";
import type { SocialPost } from "@/lib/engine/db";
import { POST_MAX, weightedLength } from "@/lib/social/length";
import { cn } from "@/lib/utils";
import { postSocialNow, regenerateSocial, saveSocialText, setSocialStatus, type SocialResult } from "../actions";

export type EditorCopy = {
  save: string;
  saved: string;
  postNow: string;
  posted: string;
  skip: string;
  regenerate: string;
  generate: string;
  markPosted: string;
  markFailed: string;
  stuck: string;
  confirmPost: string;
  chars: string;
  notConfigured: string;
};

const btn = "h-9 rounded-lg border border-line px-3 text-sm font-medium transition hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50";

/** Today's post: edit the text, post it now, skip it or write it again */
export function SocialEditor({ day, post, configured, c }: { day: string; post: SocialPost | null; configured: boolean; c: EditorCopy }) {
  const [text, setText] = useState(post?.text ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string; url?: string } | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<SocialResult>, okText: string) =>
    start(async () => {
      const r = await fn();
      setMsg({ ok: r.ok, text: r.ok ? okText : (r.error ?? "error"), url: r.url });
    });

  if (!post) {
    return (
      <button className={btn} disabled={pending} onClick={() => run(() => regenerateSocial(day), c.saved)}>
        {c.generate}
      </button>
    );
  }

  const editable = post.status === "draft" || post.status === "failed";
  const len = weightedLength(text);
  const dirty = text.trim() !== post.text;

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={!editable}
        rows={14}
        className="w-full rounded-xl border border-line bg-bg p-3 font-mono text-[13px] leading-relaxed outline-none focus:border-accent read-only:opacity-80"
      />
      <p className={cn("text-right text-xs tabular-nums", len > POST_MAX ? "text-danger" : "text-muted")}>
        {len} / {POST_MAX} {c.chars}
      </p>
      {editable && (
        <div className="flex flex-wrap gap-2">
          <button className={btn} disabled={pending || !dirty} onClick={() => run(() => saveSocialText(post.id, text), c.saved)}>
            {c.save}
          </button>
          <button
            className={cn(btn, "border-transparent bg-accent text-accent-fg hover:opacity-90")}
            disabled={pending || dirty || !configured}
            title={configured ? undefined : c.notConfigured}
            onClick={() => window.confirm(c.confirmPost) && run(() => postSocialNow(post.id), c.posted)}
          >
            {c.postNow}
          </button>
          <button className={btn} disabled={pending} onClick={() => run(() => regenerateSocial(day), c.saved)}>
            {c.regenerate}
          </button>
          <button className={btn} disabled={pending} onClick={() => run(() => setSocialStatus(post.id, "skipped"), c.saved)}>
            {c.skip}
          </button>
        </div>
      )}
      {post.status === "posting" && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-caution/60 bg-caution-soft/40 p-3 text-sm">
          <span className="flex-1">{c.stuck}</span>
          <button className={btn} disabled={pending} onClick={() => run(() => setSocialStatus(post.id, "posted"), c.saved)}>
            {c.markPosted}
          </button>
          <button className={btn} disabled={pending} onClick={() => run(() => setSocialStatus(post.id, "failed"), c.saved)}>
            {c.markFailed}
          </button>
        </div>
      )}
      {msg && (
        <p className={cn("text-sm", msg.ok ? "text-safe" : "text-danger")}>
          {msg.text}{" "}
          {msg.url && (
            <a href={msg.url} target="_blank" rel="noreferrer" className="text-accent underline">
              {msg.url}
            </a>
          )}
        </p>
      )}
    </div>
  );
}
