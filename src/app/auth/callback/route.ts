import { NextResponse, type NextRequest } from "next/server";
import { serverClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  if (code) {
    const supabase = await serverClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }
  const login = safeNext === "/vi" || safeNext.startsWith("/vi/") ? "/vi/login" : "/login";
  return NextResponse.redirect(`${origin}${login}?error=auth&next=${encodeURIComponent(safeNext)}`);
}
