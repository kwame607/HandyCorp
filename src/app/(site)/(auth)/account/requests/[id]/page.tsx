/* eslint-disable @next/next/no-img-element */
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { day, money, stamp, statusLabel } from "@/lib/format";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { verifyAndRecord } from "@/lib/paystack";
import { cancelBooking, cancelInspectionCustomer, cancelRequest, declineInspection, respondQuote, sendMessage, startInspectionPayment, startPayment, submitReview } from "../actions";

export const metadata = { title: "Request | HandyCorp" };
type Search = { sent?: string; done?: string; error?: string; reference?: string };
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);
const btn = "rounded-md px-5 py-2.5 font-bold";
const insLabel: Record<string, string> = { proposed: "Waiting for your answer", declined: "Declined", confirmed: "Paid, visit booked", completed: "Completed", cancelled: "Cancelled" };

async function Body({ id, search }: { id: string; search: Search }) {
  await connection();
  await requireRole("customer", "/login", `/account/requests/${id}`);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  // Back from Paystack: confirm the payment with Paystack before showing the page.
  let paidNow: string | null = null;
  if (search.reference) paidNow = await verifyAndRecord(search.reference).catch(() => "failed");
  const supabase = await createClient();
  const { data: r } = await supabase
    .from("service_requests")
    .select("id, ref, status, description, preferred_date, time_note, budget, created_at, services(name), areas(name, region)")
    .eq("id", id)
    .maybeSingle();
  if (!r) notFound();

  const [loc, photos, pros, quotes, messages, booking, inspections, openRes] = await Promise.all([
    supabase.from("request_locations").select("address").eq("request_id", id).maybeSingle(),
    supabase.from("request_photos").select("storage_path, file_name").eq("request_id", id),
    supabase.rpc("request_professionals", { p_request: id }),
    supabase.from("quotations").select("id, ref, invitation_id, version, status, scope, duration_note, proposed_start, expires_at, exclusions, warranty, total, created_at, quotation_items(kind, description, amount, sort)").eq("request_id", id).order("version"),
    supabase.from("request_messages").select("id, invitation_id, sender_id, body, created_at, request_invitations!inner(request_id)").eq("request_invitations.request_id", id).order("created_at"),
    supabase.from("bookings").select("id, ref, status, agreed_total, credit_amount, cancel_reason, professional_id, quotation_id").eq("request_id", id).maybeSingle(),
    supabase.from("inspections").select("id, ref, invitation_id, fee, reason, scope, proposed_at, status, findings, cancel_reason").eq("request_id", id).order("created_at"),
    supabase.rpc("payments_open"),
  ]);
  const signed = photos.data?.length
    ? (await supabase.storage.from("request-uploads").createSignedUrls(photos.data.map((p) => p.storage_path), 600)).data ?? []
    : [];
  const contact = booking.data && booking.data.status !== "cancelled" ? (await supabase.rpc("booking_contact", { p_id: booking.data.id })).data?.[0] : null;
  const payment = booking.data
    ? (await supabase.from("payments").select("status, amount").eq("booking_id", booking.data.id).eq("kind", "job").order("created_at", { ascending: false }).limit(1).maybeSingle()).data
    : null;
  const payOpen = openRes.data === true;
  const review = booking.data?.status === "completed"
    ? (await supabase.from("reviews").select("rating, comment, reply").eq("booking_id", booking.data.id).maybeSingle()).data
    : null;
  const svc = one(r.services);
  const ar = one(r.areas);
  const { data: me } = await supabase.auth.getUser();
  const list = (pros.data ?? []) as { invitation_id: string; professional_id: string; name: string; status: string; decline_reason: string | null }[];
  const open = r.status === "open";

  return (
    <>
      <Link href="/account/requests" className="text-sm text-slate underline">All requests</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">{svc?.name} in {ar?.name}</h1>
        <span className="rounded bg-sand px-3 py-1 font-semibold">{statusLabel[r.status]}</span>
      </div>
      <p className="mt-1 text-sm text-slate">{r.ref} · sent {day(r.created_at)}</p>

      {search.sent && <p role="status" className="mt-5 rounded-md border border-line bg-white px-4 py-3">Request sent. Professionals will reply here with a quote, a question, or a decline. Check back soon.</p>}
      {search.done && <p role="status" className="mt-5 rounded-md border border-line bg-white px-4 py-3">{search.done}</p>}
      {search.error && <p role="alert" className="mt-5 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800">{search.error}</p>}

      <dl className="mt-6 divide-y divide-line border-y border-line">
        {[
          ["Job", r.description],
          ["Address", loc.data?.address ?? ""],
          ["Area", ar ? `${ar.name}, ${ar.region}` : ""],
          ["Date", r.preferred_date ? day(r.preferred_date) : "Flexible"],
          ["Notes", r.time_note ?? "None"],
          ["Budget", r.budget ? money(r.budget) : "Not given"],
        ].map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-3 py-3"><dt className="text-slate">{k}</dt><dd className="col-span-2 whitespace-pre-wrap break-words">{v}</dd></div>
        ))}
      </dl>
      {signed.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-3">
          {signed.map((s, i) => s.signedUrl && (
            <li key={i}><a href={s.signedUrl} target="_blank" rel="noreferrer"><img src={s.signedUrl} alt={`Photo ${i + 1} of the job`} className="size-24 rounded-md border border-line object-cover" /></a></li>
          ))}
        </ul>
      )}

      {booking.data && (
        <section className="mt-10 rounded-md border border-ink bg-white p-5" aria-labelledby="bk">
          <h2 id="bk" className="font-display text-xl font-bold">Booking {booking.data.ref}: {statusLabel[booking.data.status]}</h2>
          <p className="mt-1">Agreed price: <strong>{money(booking.data.agreed_total)}</strong>.{Number(booking.data.credit_amount) > 0 && <> Your inspection fee of {money(booking.data.credit_amount)} is credited, so you pay <strong>{money(Number(booking.data.agreed_total) - Number(booking.data.credit_amount))}</strong>.</>}{!payOpen && " Pay the professional directly, as agreed. HandyCorp does not take payment yet."}</p>
          {paidNow === "recorded" && <p role="status" className="mt-2 font-semibold">Payment received. Thank you.</p>}
          {paidNow === "pending" && <p role="status" className="mt-2">Your payment is still being confirmed. Refresh this page in a minute.</p>}
          {paidNow === "failed" && payment?.status !== "paid" && <p role="alert" className="mt-2 text-red-800">The payment did not go through. You can try again below.</p>}
          {payOpen && booking.data.status !== "cancelled" && (
            payment?.status === "paid" ? (
              <p className="mt-2 font-semibold">Paid: {money(payment.amount)}. HandyCorp pays the professional after the job is completed.</p>
            ) : payment?.status === "refund_due" || payment?.status === "refunded" ? (
              <p className="mt-2">Refund: {payment.status === "refunded" ? "sent" : "being processed"}.</p>
            ) : (
              <form action={startPayment} className="mt-3">
                <input type="hidden" name="id" value={id} /><input type="hidden" name="booking" value={booking.data.id} />
                <button className={`${btn} bg-gold hover:bg-gold-deep`}>Pay {money(Number(booking.data.agreed_total) - Number(booking.data.credit_amount))} online</button>
                <p className="mt-1 text-sm text-slate">Pay with mobile money or card through Paystack. HandyCorp pays the professional after the job is completed.</p>
              </form>
            )
          )}
          {contact && <p className="mt-2">Professional: <strong>{contact.other_name}</strong>{contact.other_phone ? <> · <a className="underline" href={`tel:${contact.other_phone}`}>{contact.other_phone}</a></> : null}</p>}
          {booking.data.status === "cancelled" && booking.data.cancel_reason && <p className="mt-2 text-slate">Reason: {booking.data.cancel_reason}</p>}
          {["confirmed", "in_progress"].includes(booking.data.status) && (
            <form action={cancelBooking} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={id} /><input type="hidden" name="booking" value={booking.data.id} />
              <label className="min-w-56 flex-1"><span className="text-sm font-semibold">Reason for cancelling</span><input name="reason" required minLength={3} maxLength={300} className="mt-1 w-full rounded-md border border-ink/30 px-3 py-2" /></label>
              <ConfirmSubmit label="Cancel booking" requires="reason" title="Cancel this booking?" message="The professional will see that you cancelled and why." tone="danger" />
            </form>
          )}
        </section>
      )}

      {booking.data?.status === "completed" && (
        <section className="mt-8 rounded-md border border-line bg-white p-5" aria-labelledby="rv">
          <h2 id="rv" className="font-display text-xl font-bold">{review ? "Your review" : "How did it go?"}</h2>
          {review ? (
            <>
              <p className="mt-2 text-lg" aria-label={`${review.rating} out of 5`}>{"★".repeat(review.rating)}<span className="text-ink/25">{"★".repeat(5 - review.rating)}</span></p>
              {review.comment && <p className="mt-1 whitespace-pre-wrap">{review.comment}</p>}
              {review.reply && <p className="mt-3 border-l-4 border-line pl-3 text-slate"><strong>Reply from the professional:</strong> {review.reply}</p>}
            </>
          ) : (
            <form action={submitReview} className="mt-3 space-y-4">
              <input type="hidden" name="id" value={id} /><input type="hidden" name="booking" value={booking.data.id} />
              <fieldset>
                <legend className="font-semibold">Rating</legend>
                <div className="mt-1 flex flex-wrap gap-2">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <label key={n} className="cursor-pointer rounded-md border border-ink/30 px-3 py-2 has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper">
                      <input type="radio" name="rating" value={n} required className="sr-only" />{n} {n === 1 ? "star" : "stars"}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block"><span className="font-semibold">Comment (optional)</span><textarea name="comment" maxLength={600} rows={3} className="mt-1 w-full rounded-md border border-ink/30 px-3 py-2 text-[16px]" placeholder="Was the work done well, on time and as quoted?" /></label>
              <button className={`${btn} bg-gold hover:bg-gold-deep`}>Post review</button>
            </form>
          )}
        </section>
      )}

      <section className="mt-10" aria-labelledby="pros">
        <h2 id="pros" className="font-display text-xl font-bold">Professionals</h2>
        {list.length === 0 ? (
          <p className="mt-2 text-slate">{open ? "This request has not been sent to anyone. No verified professional covered it when you sent it. You can cancel it and try a nearby area." : "Not sent to any professional."}</p>
        ) : (
          <ul className="mt-3 space-y-6">
            {list.map((p) => {
              const qs = (quotes.data ?? []).filter((q) => q.invitation_id === p.invitation_id);
              const msgs = (messages.data ?? []).filter((m) => m.invitation_id === p.invitation_id);
              return (
                <li key={p.invitation_id} className="rounded-md border border-line bg-white p-5">
                  <p className="flex flex-wrap items-center justify-between gap-2"><Link href={`/professionals/${p.professional_id}`} className="font-bold underline-offset-4 hover:underline">{p.name}</Link><span className="rounded bg-sand px-2 py-0.5 text-sm font-semibold">{statusLabel[p.status]}</span></p>
                  {p.status === "declined" && <p className="mt-1 text-slate">{p.decline_reason ? `Reason: ${p.decline_reason}` : "No reason given."}</p>}
                  {(inspections.data ?? []).filter((x) => x.invitation_id === p.invitation_id && !["withdrawn"].includes(x.status)).map((x) => (
                    <div key={x.id} className="mt-4 rounded-md border border-line p-4">
                      <p className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">Inspection {x.ref}: {money(x.fee)}</span><span className="text-sm text-slate">{insLabel[x.status] ?? x.status}</span></p>
                      <p className="mt-1 text-sm text-slate">Visit: {stamp(x.proposed_at)}</p>
                      <p className="mt-2"><strong>Why:</strong> {x.reason}</p>
                      <p className="mt-1"><strong>Covers:</strong> {x.scope}</p>
                      {x.findings && <p className="mt-2 whitespace-pre-wrap rounded bg-sand px-3 py-2"><strong>Findings:</strong> {x.findings}</p>}
                      {x.cancel_reason && <p className="mt-1 text-sm text-slate">Reason: {x.cancel_reason}</p>}
                      {x.status === "proposed" && open && (
                        <div className="mt-3 flex flex-wrap items-end gap-3">
                          {payOpen ? (
                            <form action={startInspectionPayment}>
                              <input type="hidden" name="id" value={id} /><input type="hidden" name="inspection" value={x.id} />
                              <button className={`${btn} bg-gold hover:bg-gold-deep`}>Approve and pay {money(x.fee)}</button>
                            </form>
                          ) : <p className="text-sm text-slate">Online payment is not open yet, so this cannot be approved here.</p>}
                          <form action={declineInspection}>
                            <input type="hidden" name="id" value={id} /><input type="hidden" name="inspection" value={x.id} />
                            <button className={`${btn} border border-ink hover:bg-ink hover:text-paper`}>Decline</button>
                          </form>
                          <p className="basis-full text-sm text-slate">If you book this professional, the fee is credited to the job. If you do not book them after the visit, they keep the fee.</p>
                        </div>
                      )}
                      {x.status === "confirmed" && (
                        <form action={cancelInspectionCustomer} className="mt-3 flex flex-wrap items-end gap-3">
                          <input type="hidden" name="id" value={id} /><input type="hidden" name="inspection" value={x.id} />
                          <label className="min-w-48 flex-1"><span className="text-sm font-semibold">Reason for cancelling</span><input name="reason" maxLength={300} className="mt-1 w-full rounded-md border border-ink/30 px-3 py-2" /></label>
                          <ConfirmSubmit label="Cancel inspection" requires="reason" title="Cancel this inspection?" message="The professional will be told. Your fee will be refunded." tone="danger" />
                        </form>
                      )}
                    </div>
                  ))}
                  {qs.map((q) => {
                    const items = [...(q.quotation_items ?? [])].sort((a, b) => a.sort - b.sort);
                    return (
                      <div key={q.id} className="mt-4 rounded-md border border-line p-4">
                        <p className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">Quote {q.ref} (version {q.version})</span><span className="text-sm text-slate">{statusLabel[q.status]}</span></p>
                        <p className="mt-2 whitespace-pre-wrap">{q.scope}</p>
                        <table className="mt-3 w-full text-left text-[15px]">
                          <tbody>
                            {items.map((it, i) => <tr key={i} className="border-t border-line"><td className="py-1.5 capitalize text-slate">{it.kind}</td><td className="py-1.5">{it.description}</td><td className="py-1.5 text-right">{money(it.amount)}</td></tr>)}
                            <tr className="border-t border-ink font-bold"><td className="py-2" colSpan={2}>Total</td><td className="py-2 text-right">{money(q.total)}</td></tr>
                          </tbody>
                        </table>
                        <p className="mt-2 text-sm text-slate">
                          {q.duration_note ? `Time needed: ${q.duration_note}. ` : ""}{q.proposed_start ? `Can start ${day(q.proposed_start)}. ` : ""}Valid until {day(q.expires_at)}.
                          {q.exclusions ? ` Not included: ${q.exclusions}.` : ""}{q.warranty ? ` Guarantee: ${q.warranty}.` : ""}
                        </p>
                        {q.status === "submitted" && open && (
                          <form action={respondQuote} className="mt-4 flex flex-wrap gap-3">
                            <input type="hidden" name="id" value={id} /><input type="hidden" name="quotation" value={q.id} />
                            <ConfirmSubmit name="decision" value="accepted" label="Accept and book" title="Book this professional?" message={`You agree to ${money(q.total)} with ${p.name}. Your other requests for this job will be closed. You pay the professional directly.`} tone="primary" />
                            <button name="decision" value="declined" className={`${btn} border border-ink hover:bg-ink hover:text-paper`}>Decline quote</button>
                          </form>
                        )}
                      </div>
                    );
                  })}
                  {(msgs.length > 0 || ["invited", "quoted"].includes(p.status) || (booking.data && qs.some((q) => q.id === booking.data?.quotation_id))) && (
                    <div className="mt-4">
                      {msgs.length > 0 && (
                        <ul className="space-y-2">
                          {msgs.map((m) => (
                            <li key={m.id} className={`max-w-[85%] rounded-md px-3 py-2 text-[15px] ${m.sender_id === me.user?.id ? "ml-auto bg-ink text-paper" : "bg-sand"}`}>
                              <span className="whitespace-pre-wrap break-words">{m.body}</span>
                              <span className="mt-0.5 block text-xs opacity-70">{m.sender_id === me.user?.id ? "You" : p.name} · {stamp(m.created_at)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {open && ["invited", "quoted"].includes(p.status) && (
                        <form action={sendMessage} className="mt-3 flex gap-2">
                          <input type="hidden" name="id" value={id} /><input type="hidden" name="invitation" value={p.invitation_id} />
                          <input name="body" required maxLength={1000} aria-label={`Message to ${p.name}`} placeholder="Ask a question" className="min-w-0 flex-1 rounded-md border border-ink/30 px-3 py-2" />
                          <button className={`${btn} border border-ink hover:bg-ink hover:text-paper`}>Send</button>
                        </form>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {open && (
        <form action={cancelRequest} className="mt-10">
          <input type="hidden" name="id" value={id} />
          <ConfirmSubmit label="Cancel request" title="Cancel this request?" message="Professionals will no longer be able to quote on it." tone="danger" />
        </form>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/account/requests/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <Suspense fallback={<p className="text-slate">Loading…</p>}>
        <Resolve {...props} />
      </Suspense>
    </main>
  );
}

async function Resolve(props: PageProps<"/account/requests/[id]">) {
  const [{ id }, search] = await Promise.all([props.params, props.searchParams]);
  const s = search as Record<string, string | string[] | undefined>;
  const pick = (k: string) => (typeof s[k] === "string" ? (s[k] as string).slice(0, 200) : undefined);
  return <Body id={id} search={{ sent: pick("sent"), done: pick("done"), error: pick("error"), reference: pick("reference") }} />;
}
