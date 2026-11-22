import { Suspense } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getCatalogue } from "@/lib/catalogue";
import LocationMap from "@/components/LocationMap";
import { signOut } from "../actions";

export const metadata = { title: "Your account | HandyCorp" };

async function Account() {
  const user = await requireRole("customer", "/login", "/account");
  const { areas } = await getCatalogue();
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Hello, {user.fullName.split(" ")[0]}</h1>
      <p className="mt-3 max-w-xl text-lg leading-relaxed text-slate">
        You&apos;re signed in. Requests and bookings will appear here once booking opens.
      </p>
      <dl className="mt-8 max-w-md divide-y divide-line border-y border-line">
        <div className="flex justify-between gap-4 py-3"><dt className="text-slate">Email</dt><dd>{user.email}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="text-slate">Phone</dt><dd>{user.phone ?? "Not given"}</dd></div>
      </dl>
      <section className="mt-10" aria-labelledby="where">
        <h2 id="where" className="font-display text-xl font-bold">Where you are</h2>
        <p className="mb-4 mt-1 text-slate">See your current location on the map. This is how we&apos;ll match you with professionals nearby.</p>
        <LocationMap areas={areas} />
      </section>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/services" className="rounded-md bg-gold px-6 py-3 font-bold hover:bg-gold-deep">Browse services</Link>
        <form action={signOut}>
          <button className="rounded-md border border-ink px-6 py-3 font-semibold hover:bg-ink hover:text-paper">Sign out</button>
        </form>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16">
      <Suspense fallback={<p className="text-slate">Loading…</p>}>
        <Account />
      </Suspense>
    </main>
  );
}
