"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { dbMessage } from "@/lib/format";
import { notify, type NotifyEvent } from "@/lib/notify";
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
