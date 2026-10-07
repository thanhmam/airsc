import { ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { DonateAmounts } from "@/components/donate";
import { href, type Dict, type Locale } from "@/lib/i18n";
import { agentPrompt, claudeDesktopConfig, cursorDeeplink } from "@/lib/install-links";
import type { Resource } from "@/lib/types";

/**
 * "Get resource" card: the original GitHub source first (users follow the project's own README),
 * a small donation nudge, then optional install shortcuts.
 */
export function GetResource({ r, lang, t }: { r: Resource; lang: Locale; t: Dict }) {
  const mcp = r.install.mcp;

  const prompt = agentPrompt(r);
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

      <div className="rounded-xl bg-accent-soft/50 p-3">
        <p className="mb-2 text-xs text-muted">{t.resource.donateNudge}</p>
        <DonateAmounts supportHref={href(lang, "/support")} />
      </div>

      <p className="border-t border-line pt-4 text-xs text-muted">{t.resource.followReadme}</p>

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
    </div>
  );
}
