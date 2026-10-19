import type { Dict } from "@/lib/i18n";

export type Change = { kind: string; old: string | null; new: string | null };

const isDate = (s: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);

/** One line for a change to a saved resource, used in the account page and in the email */
export function describeChange(t: Dict, lang: string, name: string, c: Change): string {
  const a = t.alerts;
  if (c.kind === "safety") {
    const label = (v: string | null) => (v ? ((t.safety as Record<string, string>)[v] ?? v) : "?");
    return fill(a.safetyChanged, { name, old: label(c.old), new: label(c.new) });
  }
  if (c.new && !isDate(c.new)) return fill(a.newVersion, { name, old: c.old ?? "?", new: c.new });
  const date = c.new
    ? new Date(c.new).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" })
    : "";
  return fill(a.updatedOn, { name, date });
}
