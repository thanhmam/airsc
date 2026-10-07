import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { getDict, hasLocale, href } from "@/lib/i18n";
import { cursorDeeplink } from "@/lib/install-links";

export async function generateMetadata({ params }: PageProps<"/[lang]/mcp">): Promise<Metadata> {
  const { lang } = await params;
  const t = getDict(hasLocale(lang) ? lang : "en");
  return { title: t.mcp.title, description: t.mcp.sub };
}

function Block({ label, code, copied }: { label: string; code: string; copied: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="relative rounded-xl bg-term-bg text-term-fg">
        <pre className="overflow-x-auto p-3 pr-10 font-mono text-xs leading-relaxed">{code}</pre>
        <CopyButton text={code} copiedLabel={copied} className="absolute right-1.5 top-1.5 text-white/60 hover:bg-white/10 hover:text-white" />
      </div>
    </div>
  );
}

const TOOLS = [
  ["search_resources", "Search the library (free)", "Tìm trong thư viện (miễn phí)"],
  ["get_resource", "Details, safety notes, install steps (free)", "Chi tiết, ghi chú an toàn, cách cài (miễn phí)"],
  ["list_kits / get_kit", "Goal-based bundles (free)", "Các bộ theo mục tiêu (miễn phí)"],
  ["install_resource", "GitHub source + install steps (free)", "Nguồn GitHub + cách cài (miễn phí)"],
];

export default async function McpPage({ params }: PageProps<"/[lang]/mcp">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = `${site}/api/mcp`;
  const cursorCfg = { url, headers: { Authorization: "Bearer YOUR_AIRSC_KEY" } };
  const cursorJson = JSON.stringify({ mcpServers: { airsc: cursorCfg } }, null, 2);
  const claudeUrl = `${url}?key=YOUR_AIRSC_KEY`;
  const claudeCode = `claude mcp add --transport http airsc ${url} --header "Authorization: Bearer YOUR_AIRSC_KEY"`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">{t.mcp.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">{t.mcp.sub}</p>

      <ol className="mt-10 space-y-10">
        <li>
          <h2 className="text-lg font-semibold"><span className="mr-2 font-mono text-accent">01</span>{t.mcp.step1}</h2>
          <p className="mt-2 text-muted">
            {t.account.apiKeyDesc}{" "}
            <Link href={href(lang, "/account")} className="font-medium text-accent hover:underline">{t.nav.account} →</Link>
          </p>
        </li>
        <li className="space-y-4">
          <h2 className="text-lg font-semibold"><span className="mr-2 font-mono text-accent">02</span>{t.mcp.step2}</h2>
          <a href={cursorDeeplink("airsc", cursorCfg)} className="inline-flex rounded-xl bg-fg px-4 py-2.5 text-sm font-medium text-bg hover:opacity-90">
            {t.resource.addToCursor}
          </a>
          <Block label="Cursor · ~/.cursor/mcp.json" code={cursorJson} copied={t.resource.copied} />
          <Block label={lang === "vi" ? "Claude desktop · Settings → Connectors → Add custom connector (URL)" : "Claude desktop · Settings → Connectors → Add custom connector (URL)"} code={claudeUrl} copied={t.resource.copied} />
          <Block label="Claude Code" code={claudeCode} copied={t.resource.copied} />
        </li>
        <li>
          <h2 className="text-lg font-semibold"><span className="mr-2 font-mono text-accent">03</span>{t.mcp.step3}</h2>
          <ul className="mt-3 space-y-2">
            {t.mcp.examples.map((e) => (
              <li key={e} className="rounded-xl border border-line bg-card px-4 py-3 text-sm">“{e}”</li>
            ))}
          </ul>
        </li>
      </ol>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">{t.mcp.tools}</h2>
        <table className="mt-3 w-full text-sm">
          <tbody className="divide-y divide-line">
            {TOOLS.map(([name, en, vi]) => (
              <tr key={name}>
                <td className="py-2.5 pr-4 font-mono text-xs">{name}</td>
                <td className="py-2.5 text-muted">{lang === "vi" ? vi : en}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
