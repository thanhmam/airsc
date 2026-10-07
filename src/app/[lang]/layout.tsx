import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { DonateBar } from "@/components/donate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDict, hasLocale, href, LOCALES } from "@/lib/i18n";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "vietnamese"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const site = process.env.NEXT_PUBLIC_SITE_NAME ?? "Airsc";

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const t = getDict(hasLocale(lang) ? lang : "en");
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: `${site} · ${t.home.title}`, template: `%s · ${site}` },
    description: t.home.subtitle,
    openGraph: { siteName: site, type: "website" },
  };
}

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  return (
    <html lang={lang} className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <div className="sticky top-0 z-40">
          <DonateBar text={t.support.bar} cta={t.support.cta} supportHref={href(lang, "/support")} />
          <SiteHeader lang={lang} t={t} />
        </div>
        <main className="flex-1">{children}</main>
        <SiteFooter lang={lang} t={t} />
      </body>
    </html>
  );
}
