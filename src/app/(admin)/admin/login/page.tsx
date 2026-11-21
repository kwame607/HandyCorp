import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { getCurrentUser, safeNext } from "@/lib/auth";

export const metadata = { title: "Administration | HandyCorp", robots: { index: false, follow: false } };

async function Form({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user?.role === "admin") redirect("/admin");
  const raw = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = safeNext(raw, "");
  return (
    <>
      {user && (
        <p role="alert" className="mb-6 rounded-md border border-[#b3261e] bg-[#fdf0ee] p-4 text-[15px] font-medium text-[#9c2019]">
          This area is for HandyCorp administrators only.
        </p>
      )}
      <LoginForm audience="admin" next={next.startsWith("/admin") ? next : ""} />
      <p className="mt-6 border-t border-line pt-6 text-sm text-slate">
        Administrator accounts are created by an existing administrator. <Link href="/" className="underline underline-offset-4">Back to HandyCorp</Link>
      </p>
    </>
  );
}

export default function Page({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2.5">
          <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-lg bg-gold font-display text-2xl font-extrabold">H</span>
          <span className="font-display text-xl font-bold">HandyCorp</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">HandyCorp Administration</h1>
        <p className="mt-2 text-lg text-slate">Sign in to manage the HandyCorp marketplace.</p>
        <div className="mt-8 rounded-md border border-line bg-white p-6 shadow-[0_1px_0_rgba(23,23,27,0.04)]">
          <Suspense fallback={<p className="text-slate">Loading…</p>}>
            <Form searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
