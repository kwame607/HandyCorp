import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type Role = "customer" | "professional" | "admin";
export type CurrentUser = {
  id: string;
  email: string | undefined;
  role: Role;
  fullName: string;
  phone: string | null;
};

// Only allow redirects to pages on this site.
export function safeNext(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/^\/(login|signup|professional\/(login|signup)|forgot-password|reset-password|auth)(\/|\?|$)/.test(value)) {
    return fallback;
  }
  return value;
}

export function homeFor(role: Role): string {
  if (role === "professional") return "/professional/dashboard";
  if (role === "admin") return "/admin";
  return "/account";
}

// The role comes from the database (public.profiles), never from the token metadata.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Checking a sign-in compares token times with the clock, so this must run per request.
  await connection();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const id = claims?.claims?.sub;
  if (!id) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, phone")
    .eq("id", id)
    .maybeSingle();
  if (!profile) return null;
  return {
    id,
    email: claims.claims.email as string | undefined,
    role: profile.role as Role,
    fullName: profile.full_name,
    phone: profile.phone,
  };
}

export async function requireRole(role: Role, loginPath: string, next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`${loginPath}?next=${encodeURIComponent(next)}`);
  if (user.role !== role) redirect(homeFor(user.role));
  return user;
}
