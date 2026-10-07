import { NextResponse, type NextRequest } from "next/server";
import { anonClient } from "@/lib/supabase/anon";
import { serverClient } from "@/lib/supabase/server";

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|curl|wget/i;

/** "Open on GitHub": counts the open (and keeps history for signed-in users), then redirects to the repo */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const isBot = BOT.test(req.headers.get("user-agent") ?? "bot");
  if (isBot) {
    const { data } = await anonClient().from("resources").select("repo_url").eq("slug", slug).maybeSingle();
    return NextResponse.redirect(data?.repo_url ?? new URL("/browse", req.url), 302);
  }
  const supabase = await serverClient();
  const { data: repoUrl } = await supabase.rpc("track_source_open", { p_slug: slug });
  return NextResponse.redirect((repoUrl as string | null) ?? new URL("/browse", req.url), 302);
}
