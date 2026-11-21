"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthState } from "@/app/(site)/(auth)/actions";
import { FormAlert, PasswordField, SubmitButton, TextField } from "./fields";

export default function SignupForm({ role, next }: { role: "customer" | "professional"; next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, { status: "idle" });
  const e = state.errors ?? {};
  const v = state.values ?? {};
  const pro = role === "professional";

  if (state.status === "confirm") {
    return (
      <div role="status" className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Check your email</h2>
        <p className="leading-relaxed text-slate">
          If this address can be used, we&apos;ve sent a link to confirm your account. Open it to continue
          {pro ? " with your professional registration" : ""}. It can take a few minutes to arrive, so check your spam folder too.
        </p>
        <Link href={pro ? "/professional/login" : "/login"} className="inline-block font-semibold underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="space-y-6">
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="next" value={v.next ?? next} />
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <FormAlert message={e.form} />
      <TextField name="fullName" label="Full name" autoComplete="name" defaultValue={v.fullName} error={e.fullName} />
      <TextField
        name="phone"
        label="Phone number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="024 123 4567"
        hint="Ghana number, starting +233 or 0."
        defaultValue={v.phone}
        error={e.phone}
      />
      <TextField
        name="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        hint="You'll use this to sign in."
        defaultValue={v.email}
        error={e.email}
      />
      <PasswordField name="password" label="Password" autoComplete="new-password" showRules error={e.password} />
      <PasswordField name="confirm" label="Confirm password" autoComplete="new-password" error={e.confirm} />
      {!pro && (
        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="terms" defaultChecked={v.terms} aria-invalid={!!e.terms} className="mt-1 h-5 w-5 shrink-0 accent-ink" />
            <span className="leading-relaxed">
              I agree to the{" "}
              <Link href="/terms" className="underline underline-offset-4">Terms</Link> and have read the{" "}
              <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>.
            </span>
          </label>
          {e.terms && <p className="mt-2 text-[15px] font-medium text-[#b3261e]">{e.terms}</p>}
        </div>
      )}
      <SubmitButton pending={pending} pendingText={pro ? "Creating account…" : "Creating account…"}>
        {pro ? "Continue" : "Create Account"}
      </SubmitButton>
    </form>
  );
}
