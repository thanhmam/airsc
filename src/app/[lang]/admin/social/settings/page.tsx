import { db } from "@/lib/engine/db";
import { CARD_STYLES, CARD_THEMES, MAX_SLOTS, socialSettings } from "@/lib/engine/settings";
import type { Locale } from "@/lib/i18n";
import { xConfigured } from "@/lib/social/x";
import { saveSocialSettings } from "../../actions";
import { T } from "../copy";
import { XCheck } from "../x-check";

/** Posting hours, automatic posting, writing guidance, card look and the X keys */
export default async function SocialSettings({ params }: PageProps<"/[lang]/admin/social/settings">) {
  const { lang } = (await params) as { lang: Locale };
  const t = T[lang];
  const s = socialSettings(await db.settings());
  const configured = xConfigured();
  const select = "h-8 rounded-lg border border-line bg-bg px-2 text-sm";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t.settings}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{t.settingsIntro}</p>
      </div>
      <form action={saveSocialSettings} className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="x_enabled" defaultChecked={s.x_enabled} className="size-4 accent-[var(--accent)]" />
          {t.enabled}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="x_auto" defaultChecked={s.x_auto} className="size-4 accent-[var(--accent)]" />
          {t.auto}
        </label>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {t.slots}
          {Array.from({ length: MAX_SLOTS }, (_, i) => (
            <select key={i} name="x_slot" defaultValue={s.x_slots_vn[i] ?? ""} className={select}>
              <option value="">{t.slotOff}</option>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{`${String(h).padStart(2, "0")}:30`}</option>
              ))}
            </select>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-sm">
          {t.guidance}
          <textarea
            name="x_guidance"
            defaultValue={s.x_guidance}
            rows={8}
            className="w-full rounded-xl border border-line bg-bg p-3 font-mono text-xs leading-relaxed outline-none focus:border-accent"
          />
        </label>
        <label className="flex items-center gap-3 text-sm">
          {t.defaultStyle}
          <select name="x_card_style" defaultValue={s.x_card_style} className={select}>
            {CARD_STYLES.map((k) => (
              <option key={k} value={k}>
                {t.card.styles[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-3 text-sm">
          {t.defaultTheme}
          <select name="x_card_theme" defaultValue={s.x_card_theme} className={select}>
            {CARD_THEMES.map((k) => (
              <option key={k} value={k}>
                {t.card.themes[k]}
              </option>
            ))}
          </select>
        </label>
        <button className="h-9 w-fit rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:opacity-90">{t.save}</button>
      </form>
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4">
        <p className="text-sm">
          {t.keys}: <span className={configured ? "text-safe" : "text-caution"}>{configured ? t.keysOk : t.keysMissing}</span>
        </p>
        {configured && <XCheck c={t.check} />}
      </div>
    </div>
  );
}
