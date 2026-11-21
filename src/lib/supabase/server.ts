import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const REMEMBER_COOKIE = "hc_remember";

// Server-side client that reads and writes the session cookies.
// Uses only the publishable key. Permissions come from row-level security.
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are not set.");

  const cookieStore = await cookies();
  const session = cookieStore.get(REMEMBER_COOKIE)?.value === "0";

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list) {
            // "Remember me" off: keep the sign-in only until the browser closes.
            const o = session && value ? { ...options, maxAge: undefined, expires: undefined } : options;
            cookieStore.set(name, value, o);
          }
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}
