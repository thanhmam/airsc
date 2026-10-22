"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import type { SocialPost } from "@/lib/engine/db";
import { POST_MAX, weightedLength } from "@/lib/social/length";
import { cn } from "@/lib/utils";
import { postSocialNow, rewriteSocial, saveSocialPost, setSocialStatus, setSocialTime, type SocialResult } from "../actions";

export type EditorCopy = {
  post: string;
  reply: string;
  replyHint: string;
  save: string;
  saved: string;
  approve: string;
  approveHint: string;
  unapprove: string;
  postNow: string;
  posted: string;
  skip: string;
  rewrite: string;
  rewriteOther: string;
  time: string;
  tags: string;
  tagsAuto: string;
  markPosted: string;
  markFailed: string;
  stuck: string;
  confirmPost: string;
  chars: string;
  fits: string;
  notConfigured: string;
};

const btn = "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium transition hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50";

/** X shows about this many characters before "Show more" */
const VISIBLE = 280;

const hourOf = (iso: string | null) =>
  iso ? Number(new Date(iso).toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" })) % 24 : 20;

/** One post: edit it and its link reply, set its hour, approve it (keeps the @mentions), post now, write again or skip */
export function PostEditor({ post, configured, c }: { post: SocialPost; configured: boolean; c: EditorCopy }) {
  const [text, setText] = useState(post.text);
  const [reply, setReply] = useState(post.reply_text ?? "");
  const [other, setOther] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string; url?: string } | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<SocialResult>, okText: string) =>
    start(async () => {
      const r = await fn();
      setMsg({ ok: r.ok, text: r.ok ? `${okText}${r.error ? ` (${r.error})` : ""}` : (r.error ?? "error"), url: r.url });
    });

  const editable = post.status === "draft" || post.status === "approved" || post.status === "failed";
  const len = weightedLength(text);
  const dirty = text.trim() !== post.text || reply.trim() !== (post.reply_text ?? "");
  const tagged = [...new Set([...text.matchAll(/(?:^|[^\w@])@(\w{1,15})\b/g)].map((m) => m[1]))];

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">{c.post}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          readOnly={!editable}
          rows={post.kind === "applied" ? 10 : 7}
          className="w-full rounded-xl border border-line bg-bg p-3 font-mono text-[13px] leading-relaxed outline-none focus:border-accent read-only:opacity-80"
        />
      </label>
      <p className={cn("text-right text-xs tabular-nums", len > POST_MAX ? "text-danger" : len > VISIBLE ? "text-caution" : "text-muted")}>
        {len} / {POST_MAX} {c.chars}
        {len <= VISIBLE && ` · ${c.fits}`}
      </p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">
          {c.reply} <span className="text-xs">({c.replyHint})</span>
        </span>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          readOnly={!editable}
          rows={2}
          className="w-full rounded-xl border border-line bg-bg p-3 font-mono text-[13px] leading-relaxed outline-none focus:border-accent read-only:opacity-80"
        />
      </label>
      {tagged.length > 0 && editable && (
        <p className="rounded-lg bg-accent-soft/60 p-2 text-xs">
          {c.tags} {tagged.map((h) => `@${h}`).join(" ")}. {post.status === "approved" ? "" : c.tagsAuto}
        </p>
      )}
      {editable && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">{c.time}</span>
            <select
              value={hourOf(post.scheduled_at)}
              disabled={pending}
              onChange={(e) => run(() => setSocialTime(post.id, Number(e.target.value)), c.saved)}
              className="h-9 rounded-lg border border-line bg-bg px-2 text-sm"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{`${String(h).padStart(2, "0")}:30`}</option>
              ))}
            </select>
          </label>
          <button className={btn} disabled={pending || !dirty} onClick={() => run(() => saveSocialPost(post.id, { text, reply_text: reply }), c.saved)}>
            {c.save}
          </button>
          {post.status === "approved" ? (
            <button className={btn} disabled={pending} onClick={() => run(() => setSocialStatus(post.id, "draft"), c.saved)}>
              {c.unapprove}
            </button>
          ) : (
            <button
              className={cn(btn, "border-transparent bg-accent text-accent-fg hover:opacity-90")}
              disabled={pending || dirty}
              title={c.approveHint}
              onClick={() => run(() => setSocialStatus(post.id, "approved"), c.saved)}
            >
              {c.approve}
            </button>
          )}
          <button
            className={btn}
            disabled={pending || dirty || !configured}
            title={configured ? undefined : c.notConfigured}
            onClick={() => window.confirm(c.confirmPost) && run(() => postSocialNow(post.id), c.posted)}
          >
            {c.postNow}
          </button>
          <button className={btn} disabled={pending} onClick={() => run(() => setSocialStatus(post.id, "skipped"), c.saved)}>
            {c.skip}
          </button>
          {pending && <Loader2 className="size-4 animate-spin text-muted" aria-hidden />}
        </div>
      )}
      {editable && post.kind === "spotlight" && (
        <div className="flex flex-wrap items-center gap-2">
          <button className={btn} disabled={pending} onClick={() => run(() => rewriteSocial(post.id, other), c.saved)}>
            {c.rewrite}
          </button>
          <input
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder={c.rewriteOther}
            className="h-9 min-w-56 flex-1 rounded-lg border border-line bg-bg px-3 font-mono text-xs outline-none focus:border-accent"
          />
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
