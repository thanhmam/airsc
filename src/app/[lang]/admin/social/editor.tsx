"use client";

import { Loader2 } from "lucide-react";
import { type ReactNode, useState, useTransition } from "react";
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
  postNowHint: string;
  saveFirst: string;
  posted: string;
  skip: string;
  rewrite: string;
  rewriteOther: string;
  time: string;
  hourLabel: string;
  minuteLabel: string;
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

const btn = "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium transition hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9";
const sel = "h-10 rounded-lg border border-line bg-bg px-2 text-sm tabular-nums sm:h-9";
/** on phones a field grows with its text (rowsFor counts desktop-wide lines), so the page scrolls instead of the field */
const area = "w-full resize-y rounded-xl border border-line bg-bg p-3 font-mono text-[13px] leading-relaxed outline-none focus:border-accent read-only:opacity-80 max-sm:field-sizing-content max-sm:font-sans";

/** X shows about this many characters before "Show more" */
const VISIBLE = 280;

/** Hour and minute of an instant in Vietnam time */
const clock = (iso: string | null) => {
  const [h, m] = (iso ? new Date(iso) : new Date(Date.UTC(2000, 0, 1, 13, 30)))
    .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" })
    .split(":")
    .map(Number);
  return { hour: h % 24, minute: m };
};

/** Rows a textarea needs for its text, at about `width` characters a line */
const rowsFor = (text: string, width: number, min: number, max: number) =>
  Math.min(max, Math.max(min, text.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / width)), 0) + 1));

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * One queued post: its text and link reply on the left, `preview` (the card or the image) on the right,
 * and below them the hour and minute it goes out and what can be done with it.
 */
export function PostEditor({ post, configured, c, preview }: { post: SocialPost; configured: boolean; c: EditorCopy; preview: ReactNode }) {
  const [text, setText] = useState(post.text);
  const [reply, setReply] = useState(post.reply_text ?? "");
  const [at, setAt] = useState(clock(post.scheduled_at));
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
  const minutes = [...new Set([...Array.from({ length: 12 }, (_, i) => i * 5), at.minute])].sort((a, b) => a - b);
  // why Post now is off, in words, instead of only a greyed-out button
  const blocked = !configured ? c.notConfigured : dirty ? c.saveFirst : null;

  const reschedule = (next: { hour: number; minute: number }) => {
    setAt(next);
    run(() => setSocialTime(post.id, next.hour, next.minute), c.saved);
  };

  return (
    <div>
      <div className="grid gap-5 p-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{c.post}</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              readOnly={!editable}
              rows={rowsFor(text, 58, 6, 18)}
              className={cn(area, "max-sm:min-h-36")}
            />
          </label>
          <p className={cn("-mt-1.5 text-right text-xs tabular-nums", len > POST_MAX ? "text-danger" : len > VISIBLE ? "text-caution" : "text-muted")}>
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
              rows={rowsFor(reply, 58, 3, 6)}
              className={cn(area, "max-sm:min-h-20")}
            />
          </label>
          {tagged.length > 0 && editable && (
            <p className="rounded-lg bg-accent-soft/60 p-2 text-xs">
              {c.tags} {tagged.map((h) => `@${h}`).join(" ")}. {post.status === "approved" ? "" : c.tagsAuto}
            </p>
          )}
        </div>
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">{preview}</div>
      </div>

      {editable && (
        <div className="flex flex-col gap-2 border-t border-line bg-soft/40 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="mr-1 text-muted">{c.time}</span>
              <select aria-label={c.hourLabel} value={at.hour} disabled={pending} onChange={(e) => reschedule({ ...at, hour: Number(e.target.value) })} className={sel}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {pad(h)}
                  </option>
                ))}
              </select>
              <span aria-hidden>:</span>
              <select aria-label={c.minuteLabel} value={at.minute} disabled={pending} onChange={(e) => reschedule({ ...at, minute: Number(e.target.value) })} className={sel}>
                {minutes.map((m) => (
                  <option key={m} value={m}>
                    {pad(m)}
                  </option>
                ))}
              </select>
              {pending && <Loader2 className="ml-auto size-4 animate-spin text-muted sm:hidden" aria-hidden />}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
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
                disabled={pending || !!blocked}
                title={blocked ?? c.postNowHint}
                onClick={() => window.confirm(c.confirmPost) && run(() => postSocialNow(post.id), c.posted)}
              >
                {c.postNow}
              </button>
              <button className={btn} disabled={pending} onClick={() => run(() => setSocialStatus(post.id, "skipped"), c.saved)}>
                {c.skip}
              </button>
              {pending && <Loader2 className="hidden size-4 animate-spin text-muted sm:block" aria-hidden />}
            </div>
          </div>
          {post.kind === "spotlight" && (
            <div className="flex flex-wrap items-center gap-2">
              <button className={btn} disabled={pending} onClick={() => run(() => rewriteSocial(post.id, other), c.saved)}>
                {c.rewrite}
              </button>
              <input
                value={other}
                onChange={(e) => setOther(e.target.value)}
                placeholder={c.rewriteOther}
                className="h-10 min-w-56 flex-1 sm:h-9 rounded-lg border border-line bg-bg px-3 font-mono text-xs outline-none focus:border-accent"
              />
            </div>
          )}
          {blocked && <p className="text-xs text-muted">{blocked}</p>}
          {msg && (
            <p className={cn("break-words text-sm", msg.ok ? "text-safe" : "text-danger")}>
              {msg.text}{" "}
              {msg.url && (
                <a href={msg.url} target="_blank" rel="noreferrer" className="text-accent underline">
                  {msg.url}
                </a>
              )}
            </p>
          )}
        </div>
      )}

      {post.status === "posting" && (
        <div className="m-4 mt-0 flex flex-wrap items-center gap-2 rounded-xl border border-caution/60 bg-caution-soft/40 p-3 text-sm">
          <span className="flex-1">{c.stuck}</span>
          <button className={btn} disabled={pending} onClick={() => run(() => setSocialStatus(post.id, "posted"), c.saved)}>
            {c.markPosted}
          </button>
          <button className={btn} disabled={pending} onClick={() => run(() => setSocialStatus(post.id, "failed"), c.saved)}>
            {c.markFailed}
          </button>
        </div>
      )}
    </div>
  );
}
