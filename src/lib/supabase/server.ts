import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Per-request client bound to the signed-in user's cookies */
export async function serverClient() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // called from a Server Component: the proxy refreshes the session instead
        }
      },
    },
  });
}

export async function currentUser() {
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}
