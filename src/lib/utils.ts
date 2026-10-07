import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n);

export function timeAgo(iso: string | null, lang: "en" | "vi") {
  if (!iso) return "";
  return new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(
    ...((): [number, Intl.RelativeTimeFormatUnit] => {
      const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
      if (Math.abs(days) < 1) return [0, "day"];
      if (Math.abs(days) < 30) return [days, "day"];
      if (Math.abs(days) < 365) return [Math.round(days / 30), "month"];
      return [Math.round(days / 365), "year"];
    })(),
  );
}
