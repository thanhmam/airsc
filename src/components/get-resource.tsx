import Link from "next/link";
import { Bookmark, BookmarkCheck, ExternalLink, Lock } from "lucide-react";
import { saveResource, unlockInstall, unsaveResource } from "@/app/actions";
import { CopyButton } from "@/components/copy-button";
import { href, type Dict, type Locale } from "@/lib/i18n";
import { agentPrompt, claudeDesktopConfig, cursorDeeplink } from "@/lib/install-links";
import { LIMITS, quota } from "@/lib/quota";
import { currentUser } from "@/lib/supabase/server";
import type { Resource } from "@/lib/types";

/**
 * "Get resource" card: the original GitHub source first (users follow the project's own README, always free),
 * a small nudge to Pro, then the install shortcuts. The shortcuts are the Free tier's daily allowance: Pro sees
 * them straight away, a Free account unlocks a resource's options (a few a day), a visitor is asked to sign in.
 */
export async function GetResource({ r, lang, t, saveLimit = false }: { r: Resource; lang: Locale; t: Dict; saveLimit?: boolean }) {
  const { supabase, user } = await currentUser();
  // saved by this user? (their own row, through RLS); stays false before the saved-resources migration
  const saved = user ? !!(await supabase.from("saved_resources").select("resource_id").eq("resource_id", r.id).maybeSingle()).data : false;
  const q = user ? await quota("install", { user: user.id }, { slug: r.slug, consume: false }) : null;
  const open = !!q && (q.pro || q.unlocked);
  const mcp = r.install.mcp;
  const prompt = agentPrompt(r);
  const here = href(lang, `/r/${r.slug}`);
  const left = q?.limit != null ? Math.max(0, q.limit - q.used) : 0;

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-card p-5">
      <h2 className="font-semibold">{t.resource.install}</h2>
      <a
        href={`/go/${r.slug}`}
        target="_blank"
        rel="noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-fg px-4 py-3 font-medium text-bg hover:opacity-90"
      >
        {t.resource.openGithub} <ExternalLink className="size-4" aria-hidden />
      </a>
      <p className="-mt-2 truncate text-center font-mono text-xs text-muted">{r.full_name}</p>

      <div className="space-y-1.5">
        {!user ? (
          <Link href={href(lang, `/login?next=${encodeURIComponent(here)}`)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent">
            <Bookmark className="size-4" aria-hidden /> {t.alerts.signInToSave}
          </Link>
        ) : saved ? (
          <form action={unsaveResource.bind(null, lang, r.slug, "resource")}>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent bg-accent-soft px-4 py-2 text-sm font-medium text-accent hover:opacity-90">
              <BookmarkCheck className="size-4" aria-hidden /> {t.alerts.saved} · {t.alerts.remove}
            </button>
          </form>
        ) : (
          <form action={saveResource.bind(null, lang, r.slug)}>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent">
              <Bookmark className="size-4" aria-hidden /> {t.alerts.save}
            </button>
          </form>
        )}
        {saveLimit && !saved ? <p role="alert" className="text-center text-xs text-caution">{t.alerts.limit.replace("{n}", String(LIMITS.free.saved))}</p> : null}
        {user ? <p className="text-center text-xs text-muted">{q?.pro ? t.alerts.hintPro : t.alerts.hintFree}</p> : null}
      </div>

      <p className="border-t border-line pt-4 text-xs text-muted">{t.resource.followReadme}</p>

      {open ? (
        <>
          {mcp && (
            <div className="space-y-2">
              <a
                href={cursorDeeplink(mcp.name, mcp.config)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:border-fg/30"
              >
                {t.resource.addToCursor}
              </a>
              <details className="rounded-xl border border-line">
                <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-medium">{t.resource.claudeDesktop}</summary>
                <div className="relative border-t border-line">
                  <pre className="max-h-64 overflow-auto p-3 font-mono text-xs leading-relaxed">{claudeDesktopConfig(mcp.name, mcp.config)}</pre>
                  <CopyButton text={claudeDesktopConfig(mcp.name, mcp.config)} copiedLabel={t.resource.copied} className="absolute right-2 top-2 bg-card" />
                </div>
              </details>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs text-muted">{t.resource.promptIntro}</p>
            <div className="relative rounded-xl bg-soft">
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap p-3 pr-10 font-mono text-xs leading-relaxed">{prompt}</pre>
              <CopyButton text={prompt} copiedLabel={t.resource.copied} className="absolute right-1.5 top-1.5" />
            </div>
          </div>

          {r.install.commands?.length ? (
            <div className="space-y-2">
              <p className="text-xs text-muted">{t.resource.commands}</p>
              {r.install.commands.map((c) => (
                <div key={c.cmd} className="relative rounded-xl bg-term-bg text-term-fg">
                  <span className="block px-3 pt-2 text-[11px] text-white/50">{c.label}</span>
                  <pre className="overflow-x-auto px-3 pb-3 pr-10 font-mono text-xs">{c.cmd}</pre>
                  <CopyButton text={c.cmd} copiedLabel={t.resource.copied} className="absolute right-1.5 top-1.5 text-white/60 hover:bg-white/10 hover:text-white" />
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="space-y-3 rounded-xl border border-dashed border-line-strong p-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-sm font-medium">
            <Lock className="size-4 text-accent" aria-hidden /> {t.resource.lockedTitle}
          </p>
          <p className="text-xs text-muted">{t.resource.lockedText}</p>
          {!user ? (
            <Link
              href={href(lang, `/login?next=${encodeURIComponent(here)}`)}
              className="block rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg hover:opacity-90"
            >
              {t.resource.signInToUnlock}
            </Link>
          ) : q?.allowed ? (
            <form action={unlockInstall.bind(null, lang, r.slug)}>
              <button className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg hover:opacity-90">{t.resource.unlock}</button>
              <p className="mt-1.5 text-xs text-muted tabular-nums">{t.resource.unlocksLeft.replace("{n}", String(left)).replace("{total}", String(q.limit))}</p>
            </form>
          ) : (
            <p className="rounded-xl bg-soft px-3 py-2 text-xs text-muted">{t.resource.limitReached.replace("{n}", String(q?.limit ?? 0))}</p>
          )}
          <Link href={href(lang, "/pricing")} className="inline-block text-xs font-medium text-accent hover:underline">
            {t.resource.proUnlimited} →
          </Link>
        </div>
      )}
    </div>
  );
}
