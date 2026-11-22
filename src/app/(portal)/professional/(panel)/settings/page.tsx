import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { signOut } from "@/app/(site)/(auth)/actions";

export const metadata = { title: "Settings | HandyCorp" };

async function Body() {
  await connection();
  const user = await requireRole("professional", "/professional/login", "/professional/settings");
  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
      <section className="mt-6 rounded-md border border-line bg-white p-5">
        <h2 className="font-display text-base font-bold">Account</h2>
        <dl className="mt-3 divide-y divide-line text-[15px]">
          <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate">Name</dt><dd>{user.fullName}</dd></div>
          <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate">Email</dt><dd className="break-all">{user.email}</dd></div>
          <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate">Phone</dt><dd>{user.phone ?? "Not given"}</dd></div>
        </dl>
      </section>
      <section className="mt-6 rounded-md border border-line bg-white p-5">
        <h2 className="font-display text-base font-bold">Password</h2>
        <p className="mt-1 text-slate">We&apos;ll email you a link to choose a new password.</p>
        <Link href="/forgot-password" className="mt-3 inline-block rounded-md border border-ink/30 px-4 py-2.5 font-semibold hover:bg-ink/5">Change password</Link>
      </section>
      <form action={signOut} className="mt-6">
        <button className="rounded-md border border-ink px-5 py-2.5 font-semibold hover:bg-ink hover:text-paper">Sign out</button>
      </form>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-slate">Loading…</p>}>
      <Body />
    </Suspense>
  );
}
