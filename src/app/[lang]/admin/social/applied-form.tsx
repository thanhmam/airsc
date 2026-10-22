"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { createApplied } from "../actions";

export type AppliedCopy = {
  title: string;
  intro: string;
  preset: string;
  presetNone: string;
  resource: string;
  resourceHint: string;
  project: string;
  projectHint: string;
  notes: string;
  notesHint: string;
  images: string;
  imagesHint: string;
  day: string;
  hour: string;
  submit: string;
  working: string;
  done: string;
};

export type Preset = { slug: string; name: string; notes: string; images: string[] };

/** Screenshots go up through a server action (4 MB limit): long side 2000 px, PNG when it fits, else JPEG */
async function shrink(file: File): Promise<File> {
  if (file.type === "image/gif") return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  if (scale === 1 && file.size < 900_000) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = (type: string, q?: number) => new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), type, q));
  let out = await blob("image/png");
  if (out.size > 900_000) out = await blob("image/jpeg", 0.9);
  return new File([out], file.name.replace(/\.\w+$/, out.type === "image/png" ? ".png" : ".jpg"), { type: out.type });
}

/** A post about using a resource in a real project: notes + screenshots in, Sonnet's draft out (in the queue) */
export function AppliedForm({
  presets,
  resources,
  today,
  queueHref,
  queueLabel,
  c,
}: {
  presets: Preset[];
  resources: { slug: string; name: string }[];
  today: string;
  queueHref: string;
  queueLabel: string;
  c: AppliedCopy;
}) {
  const [preset, setPreset] = useState<Preset | null>(null);
  const [slug, setSlug] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const choose = (s: string) => {
    const p = presets.find((x) => x.slug === s) ?? null;
    setPreset(p);
    if (p) {
      setSlug(p.slug);
      setNotes(p.notes);
    }
  };

  const submit = (form: FormData) =>
    start(async () => {
      form.delete("file");
      for (const f of files) form.append("file", await shrink(f));
      for (const u of preset?.slug === slug ? preset.images : []) form.append("image_url", u);
      const r = await createApplied(form);
      setMsg({ ok: r.ok, text: r.ok ? c.done : (r.error ?? "error") });
      if (r.ok) {
        setPreset(null);
        setSlug("");
        setNotes("");
        setFiles([]);
      }
    });

  const input = "h-10 rounded-lg border border-line bg-bg px-3 text-sm outline-none focus:border-accent";
  const total = files.length + (preset?.slug === slug ? preset.images.length : 0);

  return (
    <form action={submit} className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">{c.preset}</span>
        <select value={preset?.slug ?? ""} onChange={(e) => choose(e.target.value)} className={input}>
          <option value="">{c.presetNone}</option>
          {presets.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">
            {c.resource} <span className="text-xs">({c.resourceHint})</span>
          </span>
          <input name="slug" list="applied-resources" value={slug} onChange={(e) => setSlug(e.target.value)} required className={cn(input, "font-mono")} />
          <datalist id="applied-resources">
            {resources.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">
            {c.project} <span className="text-xs">({c.projectHint})</span>
          </span>
          <input name="project" placeholder="Airsc" className={input} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">
          {c.notes} <span className="text-xs">({c.notesHint})</span>
        </span>
        <textarea
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          required
          minLength={20}
          className="w-full rounded-xl border border-line bg-bg p-3 text-sm leading-relaxed outline-none focus:border-accent"
        />
      </label>
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-muted">
          {c.images} <span className="text-xs">({c.imagesHint})</span>
        </span>
        {preset?.slug === slug && preset.images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {preset.images.map((u) => (
              <Image key={u} src={u} alt="" width={160} height={100} unoptimized className="h-24 w-auto rounded-lg border border-line" />
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          onChange={(e) => setFiles([...(e.target.files ?? [])].slice(0, 4))}
          className="text-sm file:mr-3 file:h-9 file:rounded-lg file:border file:border-line file:bg-bg file:px-3 file:text-sm"
        />
        {total > 4 && <p className="text-xs text-danger">X: max 4</p>}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{c.day}</span>
          <input type="date" name="day" defaultValue={today} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">{c.hour}</span>
          <select name="hour" defaultValue={21} className={input}>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>{`${String(h).padStart(2, "0")}:30`}</option>
            ))}
          </select>
        </label>
        <button
          disabled={pending || total > 4}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {pending ? c.working : c.submit}
        </button>
      </div>
      {msg && (
        <p className={cn("text-sm", msg.ok ? "text-safe" : "text-danger")}>
          {msg.text}{" "}
          {msg.ok && (
            <Link href={queueHref} className="text-accent underline">
              {queueLabel}
            </Link>
          )}
        </p>
      )}
    </form>
  );
}
