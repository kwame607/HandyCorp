import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { day, statusLabel } from "@/lib/format";

export const metadata = { title: "Your requests | HandyCorp" };

async function Body() {
  await connection();
  const user = await requireRole("customer", "/login", "/account/requests");
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_requests")
    .select("id, ref, status, created_at, description, services(name), areas(name), request_invitations(status)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });
  const rows = data ?? [];
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">Your requests</h1>
        <Link href="/request/new" className="rounded-md bg-gold px-5 py-2.5 font-bold hover:bg-gold-deep">New request</Link>
      </div>
      {rows.length === 0 ? (
        <div className="mt-6 rounded-md border border-line bg-white px-6 py-14 text-center">
          <p className="font-display text-lg font-bold">No requests yet</p>
          <p className="mx-auto mt-1 max-w-md text-slate">Tell us what needs doing and verified professionals will send you quotes.</p>
          <Link href="/request/new" className="mt-5 inline-block rounded-md bg-gold px-6 py-3 font-bold hover:bg-gold-deep">Request a professional</Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line bg-white">
          {rows.map((r) => {
            const svc = Array.isArray(r.services) ? r.services[0] : r.services;
            const ar = Array.isArray(r.areas) ? r.areas[0] : r.areas;
            const quotes = r.request_invitations.filter((i) => i.status === "quoted").length;
            return (
              <li key={r.id}>
                <Link href={`/account/requests/${r.id}`} className="block px-4 py-4 hover:bg-sand">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold">{svc?.name} <span className="font-normal text-slate">in {ar?.name}</span></span>
                    <span className="rounded bg-sand px-2 py-0.5 text-sm font-semibold">{statusLabel[r.status]}</span>
                  </span>
                  <span className="mt-1 block truncate text-slate">{r.description}</span>
                  <span className="mt-1 block text-sm text-slate">{r.ref} · sent {day(r.created_at)}{r.status === "open" && quotes > 0 ? ` · ${quotes} quote${quotes > 1 ? "s" : ""} to review` : ""}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <Suspense fallback={<p className="text-slate">Loading…</p>}><Body /></Suspense>
    </main>
  );
}
