import { normaliseGhanaPhone } from "@/lib/professional-application";

export const passwordRules = [
  { id: "len", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "lower", label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "upper", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "num", label: "One number", test: (p: string) => /\d/.test(p) },
];

export function validPassword(p: string) {
  return passwordRules.every((r) => r.test(p)) && p.length <= 72;
}

export function validEmail(e: string) {
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

export type AccountValues = {
  fullName: string;
  phone: string;
  email: string;
  terms: boolean;
};
export type AccountErrors = Partial<Record<keyof AccountValues | "password" | "confirm", string>>;

// Shared by customer sign-up and professional step 1.
export function validateAccount(
  v: AccountValues,
  password: string,
  confirm: string,
  needTerms: boolean,
): AccountErrors {
  const e: AccountErrors = {};
  if (v.fullName.length < 2) e.fullName = "Enter your full name.";
  else if (v.fullName.length > 100) e.fullName = "Name is too long.";
  if (!normaliseGhanaPhone(v.phone)) e.phone = "Enter a Ghana mobile number, like 024 123 4567.";
  if (!validEmail(v.email)) e.email = "Enter a valid email address.";
  if (!validPassword(password)) e.password = "Choose a password that meets every requirement below.";
  if (confirm !== password) e.confirm = "Passwords don't match.";
  if (needTerms && !v.terms) e.terms = "Please accept the Terms and Privacy Policy to continue.";
  return e;
}
