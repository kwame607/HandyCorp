"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, resetPassword, type AuthState } from "@/app/(site)/(auth)/actions";
import { FormAlert, PasswordField, SubmitButton, TextField } from "./fields";

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, { status: "idle" });
  if (state.status === "sent") {
    return (
      <div role="status" className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Check your email</h2>
        <p className="leading-relaxed text-slate">
          If an account exists for that address, we&apos;ve sent instructions to reset your password.
        </p>
        <Link href="/login" className="inline-block font-semibold underline underline-offset-4">Return to sign in</Link>
      </div>
    );
  }
  return (
    <form action={action} noValidate className="space-y-6">
      <TextField name="email" label="Email" type="email" inputMode="email" autoComplete="email" defaultValue={state.values?.email} error={state.errors?.email} />
      <SubmitButton pending={pending} pendingText="Sending…">Send reset instructions</SubmitButton>
      <p className="text-center">
        <Link href="/login" className="font-medium underline underline-offset-4">Return to sign in</Link>
      </p>
    </form>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(resetPassword, { status: "idle" });
  const e = state.errors ?? {};
  return (
    <form action={action} noValidate className="space-y-6">
      <FormAlert message={e.form} />
      <PasswordField name="password" label="New password" autoComplete="new-password" showRules error={e.password} />
      <PasswordField name="confirm" label="Confirm new password" autoComplete="new-password" error={e.confirm} />
      <SubmitButton pending={pending} pendingText="Saving…">Save new password</SubmitButton>
    </form>
  );
}
