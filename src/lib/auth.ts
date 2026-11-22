import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type Role = "customer" | "professional";
// Administration is a separate switch on the account, so the same email can be an administrator and a professional.
export type Need = Role | "admin";
export type CurrentUser = {
  id: string;
  email: string | undefined;
  role: Role;
  isAdmin: boolean;
  fullName: string;
  phone: string | null;
};

// Only allow redirects to pages on this site.
export function safeNext(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/^\/(login|signup|admin\/login|professional\/(login|signup)|forgot-password|reset-password|auth)(\/|\?|$)/.test(value)) {
    return fallback;
  }
  return value;
}

export function homeFor(role: Role): string {
  if (role === "professional") return "/professional/dashboard";
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
    .select("role, is_admin, full_name, phone, status")
    .eq("id", id)
    .maybeSingle();
  // Suspended accounts are treated as signed out everywhere.
  if (!profile || profile.status === "suspended") return null;
  return {
    id,
    email: claims.claims.email as string | undefined,
    role: profile.role as Role,
    isAdmin: profile.is_admin === true,
    fullName: profile.full_name,
    phone: profile.phone,
  };
}

export async function requireRole(role: Need, loginPath: string, next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`${loginPath}?next=${encodeURIComponent(next)}`);
  if (role === "admin" ? !user.isAdmin : user.role !== role) redirect(homeFor(user.role));
  return user;
}
