import "server-only";

export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** extra headers, e.g. List-Unsubscribe */
  headers?: Record<string, string>;
};

export type MailResult = { ok: true } | { ok: false; skipped?: boolean; error?: string };

/** "Airsc <alerts@thanhmam.com>" or a bare address */
function parseFrom(from: string) {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].replace(/^"|"$/g, "") || undefined, email: m[2] } : { email: from.trim() };
}

/**
 * Sends one email through SendGrid's v3 API (plain fetch, no SDK). Needs SENDGRID_API_KEY (Mail Send permission)
 * and EMAIL_FROM on an address of a domain authenticated in SendGrid; without them nothing is sent and the
 * caller gets `skipped`, so the rest of the app keeps working. Link and open tracking are off: the email's links
 * point straight at Airsc and the unsubscribe link must not be rewritten.
 */
export async function sendEmail(mail: Mail): Promise<MailResult> {
  const key = process.env.SENDGRID_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!key || !from) return { ok: false, skipped: true };
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();
  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: mail.to }] }],
        from: parseFrom(from),
        ...(replyTo ? { reply_to: parseFrom(replyTo) } : {}),
        subject: mail.subject,
        content: [
          { type: "text/plain", value: mail.text },
          { type: "text/html", value: mail.html },
        ],
        ...(mail.headers ? { headers: mail.headers } : {}),
        tracking_settings: { click_tracking: { enable: false, enable_text: false }, open_tracking: { enable: false } },
      }),
    });
    if (res.status === 202 || res.ok) return { ok: true };
    const body = (await res.json().catch(() => null)) as { errors?: { message: string }[] } | null;
    return { ok: false, error: `${res.status} ${body?.errors?.map((e) => e.message).join("; ") ?? ""}`.trim() };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}
