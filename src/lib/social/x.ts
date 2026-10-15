import { createHmac, randomBytes } from "node:crypto";

/**
 * Minimal X API v2 client for posting as the Airsc account. OAuth 1.0a user context with the four keys
 * from the developer app (Read and write): set them in Vercel for Production only, so preview
 * deployments can never post.
 */
const API = "https://api.x.com/2";

export class XNotConfigured extends Error {
  constructor() {
    super("X not configured: set X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN and X_ACCESS_TOKEN_SECRET");
  }
}

function keys() {
  const k = {
    consumerKey: process.env.X_API_KEY,
    consumerSecret: process.env.X_API_SECRET,
    token: process.env.X_ACCESS_TOKEN,
    tokenSecret: process.env.X_ACCESS_TOKEN_SECRET,
  };
  if (!k.consumerKey || !k.consumerSecret || !k.token || !k.tokenSecret) throw new XNotConfigured();
  return k as Record<keyof typeof k, string>;
}

export const xConfigured = () => {
  try {
    keys();
    return true;
  } catch {
    return false;
  }
};

/** RFC 3986 percent-encoding, as OAuth 1.0a requires */
const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/** Authorization header for a JSON or multipart request (their bodies are not part of the signature) */
function authHeader(method: string, url: string) {
  const k = keys();
  const u = new URL(url);
  const oauth: Record<string, string> = {
    oauth_consumer_key: k.consumerKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: k.token,
    oauth_version: "1.0",
  };
  const params = [...Object.entries(oauth), ...u.searchParams.entries()]
    .map(([a, b]) => [enc(a), enc(b)])
    .sort(([a1, b1], [a2, b2]) => a1.localeCompare(a2) || b1.localeCompare(b2))
    .map(([a, b]) => `${a}=${b}`)
    .join("&");
  const base = [method.toUpperCase(), enc(`${u.origin}${u.pathname}`), enc(params)].join("&");
  const signature = createHmac("sha1", `${enc(k.consumerSecret)}&${enc(k.tokenSecret)}`).update(base).digest("base64");
  return `OAuth ${Object.entries({ ...oauth, oauth_signature: signature })
    .map(([a, b]) => `${enc(a)}="${enc(b)}"`)
    .join(", ")}`;
}

async function call<T>(path: string, body: FormData | object): Promise<T> {
  const url = `${API}${path}`;
  const json = !(body instanceof FormData);
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: authHeader("POST", url), ...(json ? { "Content-Type": "application/json" } : {}) },
    body: json ? JSON.stringify(body) : body,
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`X ${path} ${res.status}: ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

/** Uploads one image (≤ 5 MB) and returns its media id */
export async function uploadImage(png: Buffer, alt?: string) {
  const form = new FormData();
  form.append("media", new Blob([new Uint8Array(png)], { type: "image/png" }), "card.png");
  form.append("media_category", "tweet_image");
  const r = await call<{ data: { id: string } }>("/media/upload", form);
  const id = r.data.id;
  if (alt) {
    // alt text helps screen readers but is not worth failing the post over
    await call("/media/metadata", { id, metadata: { alt_text: { text: alt.slice(0, 1000) } } }).catch(() => {});
  }
  return id;
}

export async function createPost(text: string, mediaIds: string[] = []) {
  const r = await call<{ data: { id: string } }>("/tweets", { text, ...(mediaIds.length ? { media: { media_ids: mediaIds } } : {}) });
  return { id: r.data.id, url: `https://x.com/i/web/status/${r.data.id}` };
}
