/** All admin times are shown in Vietnam time; public Vietnamese pages too */
export const VN_TZ = "Asia/Ho_Chi_Minh";

export const tzFor = (lang: string) => (lang === "vi" ? VN_TZ : "UTC");

export function fmtDateTime(d: string | Date, lang: string, tz = VN_TZ) {
  return new Date(d).toLocaleString(lang === "vi" ? "vi-VN" : "en-GB", { timeZone: tz, dateStyle: "short", timeStyle: "short" });
}

export function fmtDate(d: string | Date, lang: string, tz = VN_TZ, opts: Intl.DateTimeFormatOptions = {}) {
  return new Date(d).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", { timeZone: tz, ...opts });
}

export function fmtTime(d: string | Date, lang: string, tz = VN_TZ) {
  return new Date(d).toLocaleTimeString(lang === "vi" ? "vi-VN" : "en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
