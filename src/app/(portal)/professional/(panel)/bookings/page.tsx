import { Suspense } from "react";
import { connection } from "next/server";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { day, money, statusLabel } from "@/lib/format";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { updateBooking } from "../requests/actions";

export const metadata = { title: "Bookings | HandyCorp" };
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

async function Body({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const user = await requireRole("professional", "/professional/login", "/professional/bookings");
  const s = await searchParams;
  const pick = (k: string) => (typeof s[k] === "string" ? (s[k] as string).slice(0, 200) : undefined);
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("id, ref, status, agreed_total, created_at, cancel_reason, service_requests(ref, description, preferred_date, services(name), areas(name))")
    .eq("professional_id", user.id)
    .order("created_at", { ascending: false });
  const rows = data ?? [];
  const contacts = await Promise.all(rows.map((b) => (b.status === "cancelled" ? null : supabase.rpc("booking_contact", { p_id: b.id }).then((r) => r.data?.[0] ?? null))));

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Bookings</h1>
      <p className="mt-1 text-slate">Jobs customers booked with you. The customer pays you directly for now.</p>
      {pick("done") && <p role="status" className="mt-5 rounded-md border border-line bg-white px-4 py-3">{pick("done")}</p>}
      {pick("error") && <p role="alert" className="mt-5 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800">{pick("error")}</p>}
      {rows.length === 0 ? (
        <div className="mt-6 rounded-md border border-line bg-white px-6 py-14 text-center">
          <p className="font-display text-lg font-bold">No bookings yet</p>
          <p className="mx-auto mt-1 max-w-md text-slate">When a customer accepts your quote, the job shows here with their name, phone number and address.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((b, idx) => {
            const r = one(b.service_requests);
            const c = contacts[idx];
            return (
              <li key={b.id} className="rounded-md border border-line bg-white p-5">
                <p className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{one(r?.services ?? null)?.name} <span className="font-normal text-slate">in {one(r?.areas ?? null)?.name}</span></span>
                  <span className="rounded bg-sand px-2 py-0.5 text-sm font-semibold">{statusLabel[b.status]}</span>
                </p>
                <p className="mt-1 text-sm text-slate">{b.ref} · booked {day(b.created_at)}{r?.preferred_date ? ` · customer wants ${day(r.preferred_date)}` : ""}</p>
                <p className="mt-2 whitespace-pre-wrap">{r?.description}</p>
                <p className="mt-2 font-bold">{money(b.agreed_total)}</p>
                {c && (
                  <p className="mt-2 text-[15px]">
                    Customer: <strong>{c.other_name}</strong>{c.other_phone ? <> · <a className="underline" href={`tel:${c.other_phone}`}>{c.other_phone}</a></> : null}
                    {c.address && <><br />Address: {c.address}{c.latitude != null && <> · <a className="underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}`}>Open in maps</a></>}</>}
                  </p>
                )}
                {b.status === "cancelled" && b.cancel_reason && <p className="mt-2 text-slate">Reason: {b.cancel_reason}</p>}
                {["confirmed", "in_progress"].includes(b.status) && (
                  <form action={updateBooking} className="mt-4 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="booking" value={b.id} />
                    {b.status === "confirmed"
                      ? <button name="status" value="in_progress" className="rounded-md bg-gold px-5 py-2.5 font-bold hover:bg-gold-deep">Start job</button>
                      : <button name="status" value="completed" className="rounded-md bg-gold px-5 py-2.5 font-bold hover:bg-gold-deep">Mark completed</button>}
                    <label className="min-w-48 flex-1"><span className="text-sm font-semibold">Reason, only to cancel</span><input name="reason" maxLength={300} className="mt-1 w-full rounded-md border border-ink/30 px-3 py-2" /></label>
                    <ConfirmSubmit label="Cancel booking" name="status" value="cancelled" requires="reason" title="Cancel this booking?" message="The customer will see that you cancelled and why." tone="danger" />
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/professional/bookings">) {
  return <Suspense fallback={<p className="text-slate">Loading…</p>}><Body searchParams={props.searchParams} /></Suspense>;
}
