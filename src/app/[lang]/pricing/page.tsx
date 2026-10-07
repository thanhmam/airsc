import { permanentRedirect } from "next/navigation";
import { hasLocale, href } from "@/lib/i18n";

/** Airsc is free now: the old pricing page points to the support page */
export default async function Pricing({ params }: PageProps<"/[lang]/pricing">) {
  const { lang } = await params;
  permanentRedirect(href(hasLocale(lang) ? lang : "en", "/support"));
}
