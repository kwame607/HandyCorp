"use server";

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, REMEMBER_COOKIE } from "@/lib/supabase/server";
import { homeFor, safeNext, type Role } from "@/lib/auth";
import { normaliseGhanaPhone } from "@/lib/professional-application";
import { validateAccount, validEmail, validPassword, type AccountErrors, type AccountValues } from "@/lib/auth-validation";

export type AuthState = {
  status: "idle" | "invalid" | "error" | "confirm" | "sent" | "done";
  errors?: AccountErrors & { form?: string };
  values?: Partial<AccountValues> & { next?: string };
  message?: string;
};

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function profileRole(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Role | null> {
  const { data: claims } = await supabase.auth.getClaims();
  const id = claims?.claims?.sub;
  if (!id) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", id).maybeSingle();
  return (data?.role as Role) ?? null;
}

export async function signIn(_: AuthState, f: FormData): Promise<AuthState> {
  const email = text(f, "email").toLowerCase();
  const password = String(f.get("password") ?? "");
  const next = text(f, "next");
  const audience = text(f, "audience") === "professional" ? "professional" : "customer";
  const values = { email, next };
  const errors: AuthState["errors"] = {};
  if (!validEmail(email)) errors.email = "Enter the email address you signed up with.";
  if (!password) errors.password = "Enter your password.";
  if (Object.keys(errors).length) return { status: "invalid", errors, values };

  const store = await cookies();
  store.set(REMEMBER_COOKIE, f.get("remember") === "on" ? "1" : "0", { path: "/", sameSite: "lax", maxAge: f.get("remember") === "on" ? 60 * 60 * 24 * 90 : undefined });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const unconfirmed = error.code === "email_not_confirmed";
    return {
      status: "error",
      values,
      errors: {
        form: unconfirmed
          ? "Please confirm your email first. Check your inbox for the link we sent."
          : "The email or password is incorrect.",
      },
    };
  }
  const role = await profileRole(supabase);
  if (!role) {
    await supabase.auth.signOut();
    return { status: "error", values, errors: { form: "We couldn't load your account. Please try again." } };
  }
  // Each person lands where their role belongs. A saved page is only used for the matching role.
  const matches = role === audience;
  redirect(matches ? safeNext(next, homeFor(role)) : homeFor(role));
}

export async function signUp(_: AuthState, f: FormData): Promise<AuthState> {
  if (text(f, "website") !== "") return { status: "confirm" }; // honeypot
  const role: "customer" | "professional" = text(f, "role") === "professional" ? "professional" : "customer";
  const values: Partial<AccountValues> & { next?: string } = {
    fullName: text(f, "fullName"),
    phone: text(f, "phone"),
    email: text(f, "email").toLowerCase(),
    terms: f.get("terms") === "on",
    next: text(f, "next"),
  };
  const password = String(f.get("password") ?? "");
  const confirm = String(f.get("confirm") ?? "");
  const errors = validateAccount(values as AccountValues, password, confirm, role === "customer");
  if (Object.keys(errors).length) return { status: "invalid", errors, values };

  const store = await cookies();
  store.set(REMEMBER_COOKIE, "1", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 90 });

  const after = role === "professional" ? "/professional/onboarding" : safeNext(values.next, "/account");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: values.email!,
    password,
    options: {
      data: { role, full_name: values.fullName, phone: normaliseGhanaPhone(values.phone!) },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(after)}`,
    },
  });
  if (error) {
    console.error("[auth] sign-up failed:", error.code || "no code");
    const exists = error.code === "user_already_exists" || error.code === "email_exists";
    return {
      status: "error",
      values,
      errors: {
        form: exists
          ? "We couldn't create this account. If you already have one, try signing in or resetting your password."
          : error.code === "weak_password"
            ? "That password is too easy to guess. Try a longer one."
            : error.code === "over_email_send_rate_limit" || error.status === 429
              ? "Too many attempts right now. Please wait a few minutes and try again."
              : "We couldn't create your account. Please try again in a few minutes.",
      },
    };
  }
  if (data.session) redirect(after); // email confirmation is switched off
  return { status: "confirm", values };
}

export async function requestPasswordReset(_: AuthState, f: FormData): Promise<AuthState> {
  const email = text(f, "email").toLowerCase();
  if (!validEmail(email)) return { status: "invalid", errors: { email: "Enter a valid email address." }, values: { email } };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });
  if (error) console.error("[auth] reset request failed:", error.code || "no code");
  // Same answer whether or not an account exists.
  return { status: "sent", values: { email } };
}

export async function resetPassword(_: AuthState, f: FormData): Promise<AuthState> {
  const password = String(f.get("password") ?? "");
  const confirm = String(f.get("confirm") ?? "");
  const errors: AuthState["errors"] = {};
  if (!validPassword(password)) errors.password = "Choose a password that meets every requirement below.";
  if (confirm !== password) errors.confirm = "Passwords don't match.";
  if (Object.keys(errors).length) return { status: "invalid", errors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return { status: "error", errors: { form: "This reset link has expired. Request a new one." } };
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      status: "error",
      errors: { form: error.code === "same_password" ? "Choose a password you haven't used before." : "We couldn't update your password. Please try again." },
    };
  }
  const role = await profileRole(supabase);
  await supabase.auth.signOut();
  redirect(`${role === "professional" ? "/professional/login" : "/login"}?reset=1`);
}

export async function signOut() {
  const supabase = await createClient();
  const role = await profileRole(supabase);
  await supabase.auth.signOut();
  redirect(role === "professional" ? "/professional/login" : "/");
}
