import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { day, statusLabel } from "@/lib/format";

export const metadata = { title: "Requests | HandyCorp" };
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

async function Body() {
  await connection();
  const user = await requireRole("professional", "/professional/login", "/professional/requests");
  const supabase = await createClient();
  const { data } = await supabase
    .from("request_invitations")
    .select("id, status, created_at, service_requests(ref, status, description, budget, preferred_date, services(name), areas(name))")
    .eq("professional_id", user.id)
    .order("created_at", { ascending: false });
  const rows = data ?? [];
  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Requests</h1>
      <p className="mt-1 text-slate">Customers send you jobs to quote on. Reply with a quote, a question, or decline.</p>
      {rows.length === 0 ? (
        <div className="mt-6 rounded-md border border-line bg-white px-6 py-14 text-center">
          <p className="font-display text-lg font-bold">No requests yet</p>
          <p className="mx-auto mt-1 max-w-md text-slate">When a customer picks you for a job in an area and service you cover, it appears here. Keep your services and areas up to date.</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line bg-white">
          {rows.map((i) => {
            const r = one(i.service_requests);
            return (
              <li key={i.id}>
                <Link href={`/professional/requests/${i.id}`} className="block px-4 py-4 hover:bg-sand">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold">{one(r?.services ?? null)?.name} <span className="font-normal text-slate">in {one(r?.areas ?? null)?.name}</span></span>
                    <span className="rounded bg-sand px-2 py-0.5 text-sm font-semibold">{i.status === "closed" && r?.status === "booked" ? "Not chosen" : i.status === "invited" ? "Needs your reply" : i.status === "quoted" ? "Quote sent" : statusLabel[i.status]}</span>
                  </span>
                  <span className="mt-1 block truncate text-slate">{r?.description}</span>
                  <span className="mt-1 block text-sm text-slate">{r?.ref} · received {day(i.created_at)}{r?.budget ? ` · budget GH₵ ${Number(r.budget).toLocaleString()}` : ""}</span>
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
  return <Suspense fallback={<p className="text-slate">Loading…</p>}><Body /></Suspense>;
}
