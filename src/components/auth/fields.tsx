"use client";

import { useState } from "react";
import { passwordRules } from "@/lib/auth-validation";

export const inputClass =
  "mt-2 w-full rounded-md border border-ink/25 bg-white px-4 py-3 text-base text-ink placeholder:text-slate focus:border-ink";

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-[15px] font-medium text-[#b3261e]">
      {message}
    </p>
  );
}

export function TextField(props: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "tel" | "email" | "text";
  placeholder?: string;
  hint?: string;
  defaultValue?: string;
  error?: string;
  optional?: boolean;
}) {
  const { name, label, hint, error } = props;
  const describedBy = [hint ? `${name}-hint` : "", error ? `${name}-error` : ""].filter(Boolean).join(" ");
  return (
    <div>
      <label htmlFor={name} className="font-medium">
        {label} {props.optional && <span className="font-normal text-slate">(optional)</span>}
      </label>
      <input
        id={name}
        name={name}
        type={props.type ?? "text"}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        className={inputClass}
      />
      {hint && (
        <p id={`${name}-hint`} className="mt-2 text-sm text-slate">
          {hint}
        </p>
      )}
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}

export function PasswordField({
  name,
  label,
  autoComplete,
  error,
  showRules,
  rightLabel,
}: {
  name: string;
  label: string;
  autoComplete: string;
  error?: string;
  showRules?: boolean;
  rightLabel?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState("");
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={name} className="font-medium">
          {label}
        </label>
        {rightLabel}
      </div>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={[showRules ? `${name}-rules` : "", error ? `${name}-error` : ""].filter(Boolean).join(" ") || undefined}
          className={`${inputClass} pr-20`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          className="absolute right-2 top-[calc(0.5rem+2px)] rounded px-3 py-2 text-sm font-semibold text-ink hover:bg-ink/5"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      <FieldError id={`${name}-error`} message={error} />
      {showRules && (
        <ul id={`${name}-rules`} className="mt-3 space-y-1 text-sm">
          {passwordRules.map((r) => {
            const ok = r.test(value);
            return (
              <li key={r.id} className={ok ? "text-ink" : "text-slate"}>
                <span aria-hidden="true">{ok ? "✓ " : "• "}</span>
                {r.label}
                <span className="sr-only">{ok ? " (met)" : " (not met yet)"}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function SubmitButton({ pending, children, pendingText }: { pending: boolean; children: React.ReactNode; pendingText: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-gold px-6 py-4 text-base font-bold text-ink transition-colors hover:bg-gold-deep disabled:opacity-60"
    >
      {pending ? pendingText : children}
    </button>
  );
}

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-md border border-[#b3261e] bg-[#fdf0ee] p-4 text-[15px] font-medium text-[#b3261e]">
      {message}
    </div>
  );
}

export function AuthCard({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-lg px-5 py-12 md:py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      {intro && <p className="mt-3 text-lg leading-relaxed text-slate">{intro}</p>}
      <div className="mt-8 rounded-lg border border-line bg-white p-6 md:p-8">{children}</div>
    </main>
  );
}
