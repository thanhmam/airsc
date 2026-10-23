import { redirect } from "next/navigation";
import { href, type Locale } from "@/lib/i18n";

/** /admin/social is the section's entry: it opens the queue (the page used every day) */
export default async function SocialIndex({ params }: PageProps<"/[lang]/admin/social">) {
  const { lang } = (await params) as { lang: Locale };
  redirect(href(lang, "/admin/social/queue"));
}
