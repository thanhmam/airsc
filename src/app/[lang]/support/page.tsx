import { redirect } from "next/navigation";
import { hasLocale, href } from "@/lib/i18n";

/** The donation page is hidden: old links go to Pricing (the Ko-fi webhook keeps recording gifts) */
export default async function Support({ params }: PageProps<"/[lang]/support">) {
  const { lang } = await params;
  redirect(href(hasLocale(lang) ? lang : "en", "/pricing"));
}
