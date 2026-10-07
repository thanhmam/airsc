import type { MetadataRoute } from "next";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://airsc.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/account", "/vi/account", "/admin", "/api/"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
