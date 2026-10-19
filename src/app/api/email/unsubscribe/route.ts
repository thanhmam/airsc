import { validUnsubscribe } from "@/lib/alerts";
import { db } from "@/lib/engine/db";
import { getDict, href } from "@/lib/i18n";

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://airsc.vercel.app";

/** Switches alert emails off for the user in a signed link. Used by the link in the email and by mail apps' one-click unsubscribe */
async function unsubscribe(req: Request) {
  const url = new URL(req.url);
  const user = url.searchParams.get("u") ?? "";
  const token = url.searchParams.get("t") ?? "";
  const ok = /^[0-9a-f-]{36}$/i.test(user) && validUnsubscribe(user, token);
  if (ok) await db.setEmailAlertsFor(user, false);
  return ok;
}

/** One-click unsubscribe (RFC 8058): mail apps POST to the link */
export async function POST(req: Request) {
  return (await unsubscribe(req)) ? new Response("ok") : new Response("Invalid link", { status: 400 });
}

export async function GET(req: Request) {
  const ok = await unsubscribe(req);
  const lang = new URL(req.url).searchParams.get("lang") === "vi" ? "vi" : "en";
  const u = getDict(lang).alerts.unsubscribed;
  const body = ok
    ? `<h1 style="font-size:22px;margin:0 0 8px">${u.title}</h1><p style="margin:0 0 18px;color:#66666d">${u.text}</p><a href="${site()}${href(lang)}" style="color:#5a3df0">${u.back}</a>`
    : `<p>${u.invalid}</p>`;
  return new Response(
    `<!doctype html><html lang="${lang}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Airsc</title><body style="margin:0;background:#fafaf7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111113"><div style="max-width:480px;margin:12vh auto;padding:0 20px">${body}</div></body></html>`,
    { status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
}
