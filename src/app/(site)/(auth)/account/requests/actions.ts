"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { dbMessage } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function run(id: string, fn: (s: Awaited<ReturnType<typeof createClient>>) => PromiseLike<{ error: { code?: string; message?: string } | null }>, ok: string) {
  await requireRole("customer", "/login", `/account/requests/${id}`);
  const { error } = await fn(await createClient());
  redirect(`/account/requests/${id}?${error ? `error=${encodeURIComponent(dbMessage(error))}` : `done=${encodeURIComponent(ok)}`}`);
}

export async function cancelRequest(f: FormData) {
  const id = text(f, "id");
  await run(id, (s) => s.rpc("cancel_service_request", { p_id: id }), "Request cancelled.");
}

export async function respondQuote(f: FormData) {
  const id = text(f, "id");
  const decision = text(f, "decision") === "accepted" ? "accepted" : "declined";
  await run(id, (s) => s.rpc("respond_to_quotation", { p_id: text(f, "quotation"), p_decision: decision, p_note: text(f, "note") || null }), decision === "accepted" ? "Booked. The professional has been told." : "Quote declined.");
}

export async function sendMessage(f: FormData) {
  const id = text(f, "id");
  await run(id, (s) => s.rpc("post_request_message", { p_invitation: text(f, "invitation"), p_body: text(f, "body") }), "Message sent.");
}

export async function cancelBooking(f: FormData) {
  const id = text(f, "id");
  await run(id, (s) => s.rpc("update_booking_status", { p_id: text(f, "booking"), p_status: "cancelled", p_reason: text(f, "reason") }), "Booking cancelled.");
}
