import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor, safeNext } from "@/lib/auth";
import { AuthCard } from "./fields";
import { Progress } from "./Progress";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

type SP = Promise<{ next?: string | string[]; reset?: string }>;
const link = "font-semibold underline underline-offset-4";

async function LoginBody({ audience, searchParams }: { audience: "customer" | "professional"; searchParams: SP }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next, "");
  const pro = audience === "professional";
  return (
    <>
      {sp.reset && (
        <p role="status" className="mb-6 rounded-md border border-line bg-white p-4 font-medium">
          Your password has been changed. Sign in with the new one.
        </p>
      )}
      <LoginForm audience={audience} next={next} />
      <div className="mt-6 space-y-2 border-t border-line pt-6 text-[15px]">
        <p>
          {pro ? "New to HandyCorp? " : "Don't have an account? "}
          <Link href={pro ? "/professional/signup" : "/signup"} className={link}>
            {pro ? "Register as a professional." : "Create one."}
          </Link>
        </p>
        <p className="text-slate">
          {pro ? "Looking for a service? " : "Are you a professional? "}
          <Link href={pro ? "/login" : "/professional/login"} className="underline underline-offset-4">
            {pro ? "Customer sign in." : "Sign in here."}
          </Link>
        </p>
      </div>
    </>
  );
}

export function LoginPage({ audience, searchParams }: { audience: "customer" | "professional"; searchParams: SP }) {
  const pro = audience === "professional";
  return (
    <AuthCard
      title={pro ? "Welcome back, Professional" : "Welcome back"}
      intro={pro ? "Sign in to manage your services, requests and customers." : "Sign in to manage your service requests and bookings."}
    >
      <Suspense fallback={<p className="text-slate">Loading…</p>}>
        <LoginBody audience={audience} searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function SignupBody({ role, searchParams }: { role: "customer" | "professional"; searchParams: SP }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(user.role === "professional" && role === "professional" ? "/professional/onboarding" : homeFor(user.role));
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next, "");
  const pro = role === "professional";
  return (
    <>
      <SignupForm role={role} next={next} />
      <div className="mt-6 space-y-2 border-t border-line pt-6 text-[15px]">
        <p>
          Already have an account?{" "}
          <Link href={pro ? "/professional/login" : "/login"} className={link}>Sign in.</Link>
        </p>
        <p className="text-slate">
          {pro ? "Looking for a service? " : "Are you joining HandyCorp to offer services? "}
          <Link href={pro ? "/signup" : "/professional/signup"} className="underline underline-offset-4">
            {pro ? "Create a customer account." : "Register as a professional."}
          </Link>
        </p>
      </div>
    </>
  );
}

export function SignupPage({ role, searchParams }: { role: "customer" | "professional"; searchParams: SP }) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-lg px-5 py-16 text-slate">Loading…</main>}>
      <SignupShell role={role} searchParams={searchParams} />
    </Suspense>
  );
}

function SignupShell({ role, searchParams }: { role: "customer" | "professional"; searchParams: SP }) {
  const pro = role === "professional";
  return (
    <AuthCard
      title={pro ? "Let's get to know you" : "Create your HandyCorp account"}
      intro={pro ? "Step 1 of 5. Create your account, then tell us about your work." : "Join HandyCorp and make finding skilled professionals easier."}
    >
      {pro && <Progress current={1} />}
      <SignupBody role={role} searchParams={searchParams} />
    </AuthCard>
  );
}
