"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { dbMessage } from "@/lib/format";
import { notify, type NotifyEvent } from "@/lib/notify";
import { initialize, paymentsConfigured } from "@/lib/paystack";
import { createClient } from "@/lib/supabase/server";

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
type Result = { data?: unknown; error: { code?: string; message?: string } | null };

async function run(id: string, fn: (s: Awaited<ReturnType<typeof createClient>>) => PromiseLike<Result>, ok: string, mail?: (data: unknown) => [NotifyEvent, string] | null) {
  await requireRole("customer", "/login", `/account/requests/${id}`);
  const supabase = await createClient();
  const { data, error } = await fn(supabase);
  const m = !error && mail ? mail(data) : null;
  if (m) await notify(supabase, m[0], m[1]);
  redirect(`/account/requests/${id}?${error ? `error=${encodeURIComponent(dbMessage(error))}` : `done=${encodeURIComponent(ok)}`}`);
}

export async function cancelRequest(f: FormData) {
  const id = text(f, "id");
  await run(id, (s) => s.rpc("cancel_service_request", { p_id: id }), "Request cancelled.");
}

export async function respondQuote(f: FormData) {
  const id = text(f, "id");
  const accepted = text(f, "decision") === "accepted";
  await run(
    id,
    (s) => s.rpc("respond_to_quotation", { p_id: text(f, "quotation"), p_decision: accepted ? "accepted" : "declined", p_note: text(f, "note") || null }),
    accepted ? "Booked. The professional has been told." : "Quote declined.",
    (booking) => (accepted && typeof booking === "string" ? ["booked", booking] : null),
  );
}

export async function sendMessage(f: FormData) {
  const id = text(f, "id");
  const invitation = text(f, "invitation");
  await run(id, (s) => s.rpc("post_request_message", { p_invitation: invitation, p_body: text(f, "body") }), "Message sent.", () => ["message", invitation]);
}

export async function cancelBooking(f: FormData) {
  const id = text(f, "id");
  const booking = text(f, "booking");
  await run(id, (s) => s.rpc("update_booking_status", { p_id: booking, p_status: "cancelled", p_reason: text(f, "reason") }), "Booking cancelled.", () => ["booking_update", booking]);
}

// Called by the request form right after a request is saved. The database
// only hands back recipients once per request, so calling it again sends nothing.
export async function notifyRequestSent(requestId: string) {
  await requireRole("customer", "/login", "/account/requests");
  if (!/^[0-9a-f-]{36}$/.test(requestId)) return;
  await notify(await createClient(), "new_request", requestId);
}

export async function submitReview(f: FormData) {
  const id = text(f, "id");
  await run(id, (s) => s.rpc("submit_review", { p_booking: text(f, "booking"), p_rating: Number(text(f, "rating")) || null, p_comment: text(f, "comment") || null }), "Thank you. Your review has been posted.");
}

// Creates the payment record, then sends the customer to Paystack to pay.
export async function startPayment(f: FormData) {
  const id = text(f, "id");
  const bookingId = text(f, "booking");
  const user = await requireRole("customer", "/login", `/account/requests/${id}`);
  const back = (q: string) => redirect(`/account/requests/${id}?${q}`);
  if (!paymentsConfigured() || !user.email) return back("error=" + encodeURIComponent("Online payment is not available yet."));
  const supabase = await createClient();
  const { data: paymentId, error } = await supabase.rpc("create_job_payment", { p_booking: bookingId });
  if (error || !paymentId) return back("error=" + encodeURIComponent(error ? dbMessage(error) : "Something went wrong. Please try again."));
  const { data: pay } = await supabase.from("payments").select("ref, amount").eq("id", paymentId).maybeSingle();
  if (!pay) return back("error=" + encodeURIComponent("Something went wrong. Please try again."));
  const reference = `${pay.ref}-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
  const { error: refError } = await supabase.rpc("set_payment_reference", { p_payment: paymentId, p_reference: reference });
  if (refError) return back("error=" + encodeURIComponent(dbMessage(refError)));
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const url = await initialize({ email: user.email, amount: Number(pay.amount), reference, callbackUrl: `${site}/account/requests/${id}`, paymentRef: pay.ref }).catch(() => null);
  if (!url) return back("error=" + encodeURIComponent("Could not reach Paystack. Please try again."));
  redirect(url);
}
