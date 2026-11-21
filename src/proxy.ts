import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Keeps the sign-in fresh on every page request and sends signed-out visitors
// away from account pages. Role checks happen again on the server in each page.
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key) return response;

  const session = request.cookies.get("hc_remember")?.value === "0";
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) {
          const o = session && value ? { ...options, maxAge: undefined, expires: undefined } : options;
          response.cookies.set(name, value, o);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  const signedIn = !!data?.claims?.sub;

  if (!signedIn) {
    const pro = path.startsWith("/professional/dashboard") || path.startsWith("/professional/onboarding");
    const admin = path.startsWith("/admin") && path !== "/admin/login";
    const customer = path.startsWith("/account");
    if (pro || customer || admin) {
      const to = request.nextUrl.clone();
      to.pathname = admin ? "/admin/login" : pro ? "/professional/login" : "/login";
      to.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
      return NextResponse.redirect(to);
    }
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)",
  ],
};
