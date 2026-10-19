import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { describeChange } from "@/lib/alerts-text";
import { db, type Digest } from "@/lib/engine/db";
import { sendEmail } from "@/lib/email";
import { getDict, href } from "@/lib/i18n";
import { ALERTS_PRO_ONLY } from "@/lib/quota";

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://airsc.vercel.app";

/** Signed unsubscribe link: the user id plus an HMAC only the server can make, so nobody can unsubscribe others */
const sign = (userId: string) => createHmac("sha256", process.env.AIRSC_INGEST_TOKEN ?? "").update(`unsubscribe:${userId}`).digest("hex");

export function unsubscribeUrl(userId: string) {
  return `${site()}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${sign(userId)}`;
}

export function validUnsubscribe(userId: string, token: string) {
  const want = Buffer.from(sign(userId));
  const got = Buffer.from(token);
  return want.length === got.length && timingSafeEqual(want, got);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The email for one user: a list of what changed, with links, in the language they use on the site */
export function renderDigest(d: Digest) {
  const lang = d.locale === "vi" ? "vi" : "en";
  const t = getDict(lang);
  const a = t.alerts.email;
  const base = site();
  const unsub = unsubscribeUrl(d.user_id);
  const rows = d.items.map((i) => ({
    line: describeChange(t, lang, i.name, i),
    url: `${base}${href(lang, `/r/${i.slug}`)}`,
  }));
  const account = `${base}${href(lang, "/account")}`;

  const html = `<!doctype html><html lang="${lang}"><body style="margin:0;background:#fafaf7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111113">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
  <p style="margin:0 0 18px;font-size:20px;font-weight:600;letter-spacing:-0.02em">Airsc</p>
  <p style="margin:0 0 14px;font-size:15px">${esc(a.intro)}</p>
  <ul style="margin:0;padding:0;list-style:none">
    ${rows.map((r) => `<li style="margin:0 0 10px;padding:12px 14px;background:#ffffff;border:1px solid #e6e5df;border-radius:12px;font-size:14px;line-height:1.45">${esc(r.line)}<br><a href="${r.url}" style="color:#5a3df0;text-decoration:none;font-weight:500">${esc(a.open)} →</a></li>`).join("\n    ")}
  </ul>
  <p style="margin:22px 0 4px;font-size:13px"><a href="${account}" style="color:#5a3df0">${esc(a.manage)}</a></p>
  <p style="margin:0;font-size:12px;color:#66666d">${esc(a.footer)} <a href="${unsub}" style="color:#66666d">${esc(a.unsubscribe)}</a></p>
</div></body></html>`;

  const text = [a.intro, "", ...rows.map((r) => `- ${r.line}\n  ${r.url}`), "", `${a.manage}: ${account}`, `${a.unsubscribe}: ${unsub}`].join("\n");
  return { subject: a.subject.replace("{n}", String(rows.length)), html, text, unsubscribe: unsub };
}

export type AlertsRun = { notifications: number; users: number; sent: number; failed: number; skipped: boolean };

/**
 * The daily job: turn the day's changes to saved resources into notifications (shown in the account), then email
 * each user one summary. A notification is marked emailed only after SendGrid accepted the message, so a failed
 * send is retried the next day (for 3 days). Without SENDGRID_API_KEY nothing is emailed and notifications still appear.
 */
export async function runDailyAlerts(): Promise<AlertsRun> {
  const notifications = await db.generateNotifications(ALERTS_PRO_ONLY);
  const digests = await db.pendingDigests();
  const run: AlertsRun = { notifications, users: digests.length, sent: 0, failed: 0, skipped: false };
  for (const d of digests) {
    const mail = renderDigest(d);
    const res = await sendEmail({
      to: d.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      headers: { "List-Unsubscribe": `<${mail.unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    });
    if (res.ok) {
      await db.markNotificationsEmailed(d.items.map((i) => i.id));
      run.sent++;
    } else if (res.skipped) {
      run.skipped = true;
      break;
    } else {
      console.error("alert email failed", d.user_id, res.error);
      run.failed++;
    }
  }
  return run;
}
