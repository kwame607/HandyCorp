"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthState } from "@/app/(site)/(auth)/actions";
import { FormAlert, PasswordField, SubmitButton, TextField } from "./fields";

export default function LoginForm({ audience, next }: { audience: "customer" | "professional" | "admin"; next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, { status: "idle" });
  const e = state.errors ?? {};
  return (
    <form action={action} noValidate className="space-y-6">
      <input type="hidden" name="audience" value={audience} />
      <input type="hidden" name="next" value={state.values?.next ?? next} />
      <FormAlert message={e.form} />
      <TextField
        name="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={e.email}
      />
      <PasswordField
        name="password"
        label="Password"
        autoComplete="current-password"
        error={e.password}
        rightLabel={
          <Link href="/forgot-password" className="text-sm font-medium underline underline-offset-4">
            Forgot password?
          </Link>
        }
      />
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input type="checkbox" name="remember" defaultChecked className="h-5 w-5 accent-ink" />
        Remember me on this device
      </label>
      <SubmitButton pending={pending} pendingText="Signing in…">
        Sign In
      </SubmitButton>
    </form>
  );
}
