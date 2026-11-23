/* eslint-disable @next/next/no-img-element */
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { day, money, stamp, statusLabel } from "@/lib/format";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { cancelInspectionPro, completeInspection, declineRequest, proposeInspection, sendMessage, submitQuote, withdrawInspection, withdrawQuote } from "../actions";

export const metadata = { title: "Request | HandyCorp" };
type Search = { done?: string; error?: string };
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);
const input = "mt-1 w-full rounded-md border border-ink/30 bg-white px-3 py-2 text-[16px]";
const btn = "rounded-md px-5 py-2.5 font-bold";
const insLabel: Record<string, string> = { proposed: "Waiting for the customer", declined: "Declined", withdrawn: "Withdrawn", confirmed: "Paid. Visit booked", completed: "Completed", cancelled: "Cancelled" };
function dates() {
  const t = Date.now();
  const iso = (n: number) => new Date(t + n * 86400000).toISOString().slice(0, 10);
  return { today: iso(0), plus: iso };
}

async function Body({ id, search }: { id: string; search: Search }) {
  await connection();
  const user = await requireRole("professional", "/professional/login", `/professional/requests/${id}`);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const { data: inv } = await supabase
    .from("request_invitations")
    .select("id, status, request_id, service_requests(ref, status, description, preferred_date, time_note, budget, services(name), areas(name, region))")
    .eq("id", id)
    .eq("professional_id", user.id)
    .maybeSingle();
  if (!inv) notFound();
  const r = one(inv.service_requests);
  const [photos, quotes, messages, inspections] = await Promise.all([
    supabase.from("request_photos").select("storage_path").eq("request_id", inv.request_id),
    supabase.from("quotations").select("id, ref, version, status, scope, duration_note, proposed_start, expires_at, exclusions, warranty, total, quotation_items(kind, description, amount, sort)").eq("invitation_id", id).order("version"),
    supabase.from("request_messages").select("id, sender_id, body, created_at").eq("invitation_id", id).order("created_at"),
    supabase.from("inspections").select("id, ref, fee, reason, scope, proposed_at, status, findings, cancel_reason").eq("invitation_id", id).order("created_at"),
  ]);
  const liveInspection = (inspections.data ?? []).find((x) => ["proposed", "confirmed", "completed"].includes(x.status));
  const signed = photos.data?.length ? (await supabase.storage.from("request-uploads").createSignedUrls(photos.data.map((p) => p.storage_path), 600)).data ?? [] : [];
  const live = quotes.data?.find((q) => q.status === "submitted");
  const canAct = r?.status === "open" && ["invited", "quoted"].includes(inv.status);
  const { today, plus } = dates();

  return (
    <>
      <Link href="/professional/requests" className="text-sm text-slate underline">All requests</Link>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">{one(r?.services ?? null)?.name} in {one(r?.areas ?? null)?.name}</h1>
      <p className="mt-1 text-sm text-slate">{r?.ref} · {r?.status === "booked" && inv.status === "closed" ? "The customer chose someone else" : statusLabel[inv.status]}</p>
      {search.done && <p role="status" className="mt-5 rounded-md border border-line bg-white px-4 py-3">{search.done}</p>}
      {search.error && <p role="alert" className="mt-5 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800">{search.error}</p>}

      <dl className="mt-6 divide-y divide-line border-y border-line bg-white px-4">
        {[
          ["Job", r?.description],
          ["Area", `${one(r?.areas ?? null)?.name}, ${one(r?.areas ?? null)?.region}`],
          ["Exact address", "Shared with you only if the customer books you"],
          ["Date", r?.preferred_date ? day(r.preferred_date) : "Flexible"],
          ["Notes", r?.time_note ?? "None"],
          ["Budget", r?.budget ? money(r.budget) : "Not given"],
        ].map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-3 py-3"><dt className="text-slate">{k}</dt><dd className="col-span-2 whitespace-pre-wrap break-words">{v}</dd></div>
        ))}
      </dl>
      {signed.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-3">
          {signed.map((s, i) => s.signedUrl && <li key={i}><a href={s.signedUrl} target="_blank" rel="noreferrer"><img src={s.signedUrl} alt={`Photo ${i + 1} of the job`} className="size-24 rounded-md border border-line object-cover" /></a></li>)}
        </ul>
      )}

      <section className="mt-10" aria-labelledby="msgs">
        <h2 id="msgs" className="font-display text-xl font-bold">Messages</h2>
        {(messages.data ?? []).length === 0 && <p className="mt-1 text-slate">No messages yet. Ask the customer anything you need to quote accurately.</p>}
        <ul className="mt-3 space-y-2">
          {(messages.data ?? []).map((m) => (
            <li key={m.id} className={`max-w-[85%] rounded-md px-3 py-2 text-[15px] ${m.sender_id === user.id ? "ml-auto bg-ink text-paper" : "bg-sand"}`}>
              <span className="whitespace-pre-wrap break-words">{m.body}</span>
              <span className="mt-0.5 block text-xs opacity-70">{m.sender_id === user.id ? "You" : "Customer"} · {stamp(m.created_at)}</span>
            </li>
          ))}
        </ul>
        {canAct && (
          <form action={sendMessage} className="mt-3 flex gap-2">
            <input type="hidden" name="id" value={id} />
            <input name="body" required maxLength={1000} aria-label="Message to the customer" placeholder="Ask a question" className="min-w-0 flex-1 rounded-md border border-ink/30 px-3 py-2" />
            <button className={`${btn} border border-ink hover:bg-ink hover:text-paper`}>Send</button>
          </form>
        )}
      </section>

      {((inspections.data ?? []).length > 0 || canAct) && (
        <section className="mt-10" aria-labelledby="ins">
          <h2 id="ins" className="font-display text-xl font-bold">Inspection</h2>
          {(inspections.data ?? []).map((x) => (
            <div key={x.id} className="mt-3 rounded-md border border-line bg-white p-4">
              <p className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{x.ref}: {money(x.fee)}</span><span className="text-sm text-slate">{insLabel[x.status] ?? x.status}</span></p>
              <p className="mt-1 text-sm text-slate">Visit: {stamp(x.proposed_at)}</p>
              <p className="mt-2 whitespace-pre-wrap">{x.scope}</p>
              {x.findings && <p className="mt-2 whitespace-pre-wrap rounded bg-sand px-3 py-2"><strong>Findings:</strong> {x.findings}</p>}
              {x.cancel_reason && <p className="mt-1 text-sm text-slate">Reason: {x.cancel_reason}</p>}
              {x.status === "proposed" && (
                <form action={withdrawInspection} className="mt-3"><input type="hidden" name="id" value={id} /><input type="hidden" name="inspection" value={x.id} /><button className={`${btn} border border-ink hover:bg-ink hover:text-paper`}>Withdraw proposal</button></form>
              )}
              {x.status === "confirmed" && (
                <div className="mt-3 space-y-3">
                  <form action={completeInspection} className="space-y-2">
                    <input type="hidden" name="id" value={id} /><input type="hidden" name="inspection" value={x.id} />
                    <label className="block"><span className="font-semibold">What you found, and what is likely needed</span><textarea name="findings" required minLength={10} maxLength={1000} rows={3} className={input} /></label>
                    <button className={`${btn} bg-gold hover:bg-gold-deep`}>Mark inspection completed</button>
                  </form>
                  <form action={cancelInspectionPro} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="id" value={id} /><input type="hidden" name="inspection" value={x.id} />
                    <label className="min-w-48 flex-1"><span className="text-sm font-semibold">Cannot make it? Reason</span><input name="reason" maxLength={300} className={input} /></label>
                    <ConfirmSubmit label="Cancel inspection" requires="reason" title="Cancel this inspection?" message="The customer will be refunded and told." tone="danger" />
                  </form>
                </div>
              )}
            </div>
          ))}
          {canAct && !liveInspection && (
            <form action={proposeInspection} className="mt-3 space-y-3 rounded-md border border-line bg-white p-4">
              <p className="text-slate">Cannot price this from the description? Propose a paid visit. The customer approves and pays before you go. If they book you, the fee is credited to the job. If they do not, you keep it.</p>
              <input type="hidden" name="id" value={id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block"><span className="font-semibold">Inspection fee (GH₵)</span><input name="fee" required inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" className={input} /></label>
                <label className="block"><span className="font-semibold">Visit date and time</span><input type="datetime-local" name="when" required className={input} /></label>
              </div>
              <label className="block"><span className="font-semibold">Why a visit is needed</span><textarea name="reason" required minLength={10} maxLength={500} rows={2} className={input} /></label>
              <label className="block"><span className="font-semibold">What the inspection covers</span><textarea name="scope" required minLength={10} maxLength={500} rows={2} className={input} /></label>
              <button className={`${btn} border border-ink hover:bg-ink hover:text-paper`}>Propose inspection</button>
            </form>
          )}
        </section>
      )}

      {(quotes.data ?? []).length > 0 && (
        <section className="mt-10" aria-labelledby="qs">
          <h2 id="qs" className="font-display text-xl font-bold">Your quotes</h2>
          <ul className="mt-3 space-y-4">
            {(quotes.data ?? []).map((q) => (
              <li key={q.id} className="rounded-md border border-line bg-white p-4">
                <p className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{q.ref} (version {q.version})</span><span className="text-sm text-slate">{statusLabel[q.status]}</span></p>
                <p className="mt-2 whitespace-pre-wrap">{q.scope}</p>
                <p className="mt-2 font-bold">{money(q.total)} <span className="font-normal text-slate">valid until {day(q.expires_at)}</span></p>
                {q.status === "submitted" && canAct && (
                  <form action={withdrawQuote} className="mt-3 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="id" value={id} /><input type="hidden" name="quotation" value={q.id} />
                    <label className="min-w-56 flex-1"><span className="text-sm font-semibold">Reason for withdrawing</span><input name="reason" minLength={3} maxLength={300} className={input} /></label>
                    <ConfirmSubmit label="Withdraw quote" requires="reason" title="Withdraw this quote?" message="The customer will no longer be able to accept it. You can send a new one." tone="danger" />
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {canAct && (
        <section className="mt-10" aria-labelledby="qf">
          <h2 id="qf" className="font-display text-xl font-bold">{live ? "Send a new version of your quote" : "Send a quote"}</h2>
          <p className="mt-1 text-slate">{live ? "A new version replaces your current quote." : "List what the customer pays for. The total is added up for you."}</p>
          <form action={submitQuote} className="mt-4 space-y-4">
            <input type="hidden" name="id" value={id} />
            <label className="block"><span className="font-semibold">What you will do</span><textarea name="scope" required minLength={10} maxLength={1000} rows={4} className={input} /></label>
            <fieldset>
              <legend className="font-semibold">Price breakdown (GH₵)</legend>
              <div className="mt-1 space-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="grid grid-cols-[7rem_1fr_7rem] gap-2">
                    <select name={`kind${i}`} aria-label={`Item ${i + 1} type`} className="rounded-md border border-ink/30 bg-white px-2 py-2"><option value="labour">Labour</option><option value="materials">Materials</option><option value="other">Other</option></select>
                    <input name={`desc${i}`} maxLength={120} aria-label={`Item ${i + 1} description`} placeholder={i === 0 ? "For example: Labour, 1 day" : "Description"} required={i === 0} className="min-w-0 rounded-md border border-ink/30 px-3 py-2" />
                    <input name={`amount${i}`} inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" aria-label={`Item ${i + 1} amount`} placeholder="Amount" required={i === 0} className="min-w-0 rounded-md border border-ink/30 px-3 py-2" />
                  </div>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block"><span className="font-semibold">Time needed</span><input name="duration" maxLength={200} placeholder="For example: 1 day" className={input} /></label>
              <label className="block"><span className="font-semibold">Can start</span><input type="date" name="start" min={today} className={input} /></label>
              <label className="block"><span className="font-semibold">Quote valid until</span><input type="date" name="expires" required min={today} max={plus(60)} defaultValue={plus(14)} className={input} /></label>
            </div>
            <label className="block"><span className="font-semibold">Not included (optional)</span><input name="exclusions" maxLength={500} className={input} /></label>
            <label className="block"><span className="font-semibold">Guarantee (optional)</span><input name="warranty" maxLength={300} className={input} /></label>
            <button className={`${btn} bg-gold hover:bg-gold-deep`}>Send quote</button>
          </form>
          {inv.status === "invited" && (
            <form action={declineRequest} className="mt-8 flex flex-wrap items-end gap-3 border-t border-line pt-6">
              <input type="hidden" name="id" value={id} />
              <label className="min-w-56 flex-1"><span className="font-semibold">Not for you? Decline, with a reason if you like</span><input name="reason" maxLength={300} className={input} /></label>
              <ConfirmSubmit label="Decline request" title="Decline this request?" message="The customer will see that you declined." tone="danger" />
            </form>
          )}
        </section>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/professional/requests/[id]">) {
  return <Suspense fallback={<p className="text-slate">Loading…</p>}><Resolve {...props} /></Suspense>;
}

async function Resolve(props: PageProps<"/professional/requests/[id]">) {
  const [{ id }, s] = await Promise.all([props.params, props.searchParams]);
  const pick = (k: string) => (typeof s[k] === "string" ? (s[k] as string).slice(0, 200) : undefined);
  return <Body id={id} search={{ done: pick("done"), error: pick("error") }} />;
}
