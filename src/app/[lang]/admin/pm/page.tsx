import { redirect } from "next/navigation";
import { href, type Locale } from "@/lib/i18n";

export default async function AdminPm({ params }: PageProps<"/[lang]/admin/pm">) {
  const { lang } = (await params) as { lang: Locale };
  redirect(href(lang, "/admin/pm/architecture"));
}
