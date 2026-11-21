import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Email links (confirm account, reset password) land here.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const raw = searchParams.get("next") ?? "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\") ? raw : "/";
  const supabase = await createClient();

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;

  if (ok) return NextResponse.redirect(`${origin}${next}`);
  const failed = next === "/reset-password" ? "/forgot-password?expired=1" : "/login?confirm=failed";
  return NextResponse.redirect(`${origin}${failed}`);
}
