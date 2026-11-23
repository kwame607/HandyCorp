"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { dbMessage } from "@/lib/format";
import { notify, type NotifyEvent } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
type Result = { data?: unknown; error: { code?: string; message?: string } | null };

async function run(back: string, fn: (s: Awaited<ReturnType<typeof createClient>>) => PromiseLike<Result>, ok: string, mail?: (data: unknown) => [NotifyEvent, string] | null) {
  await requireRole("professional", "/professional/login", back);
  const supabase = await createClient();
  const { data, error } = await fn(supabase);
  const m = !error && mail ? mail(data) : null;
  if (m) await notify(supabase, m[0], m[1]);
  redirect(`${back}?${error ? `error=${encodeURIComponent(dbMessage(error))}` : `done=${encodeURIComponent(ok)}`}`);
}

export async function declineRequest(f: FormData) {
  const id = text(f, "id");
  await run(`/professional/requests/${id}`, (s) => s.rpc("decline_invitation", { p_id: id, p_reason: text(f, "reason") || null }), "Request declined.", () => ["declined", id]);
}

export async function sendMessage(f: FormData) {
  const id = text(f, "id");
  await run(`/professional/requests/${id}`, (s) => s.rpc("post_request_message", { p_invitation: id, p_body: text(f, "body") }), "Message sent.", () => ["message", id]);
}

export async function submitQuote(f: FormData) {
  const id = text(f, "id");
  const items: { kind: string; description: string; amount: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const description = text(f, `desc${i}`);
    const amount = text(f, `amount${i}`);
    if (!description && !amount) continue;
    items.push({ kind: text(f, `kind${i}`), description, amount: Number(amount) });
  }
  await run(
    `/professional/requests/${id}`,
    (s) => s.rpc("submit_quotation", {
      p_invitation: id,
      p_scope: text(f, "scope"),
      p_duration: text(f, "duration") || null,
      p_start: text(f, "start") || null,
      p_expires: text(f, "expires"),
      p_exclusions: text(f, "exclusions") || null,
      p_warranty: text(f, "warranty") || null,
      p_items: items,
    }),
    "Quote sent to the customer.",
    (quote) => (typeof quote === "string" ? ["quote", quote] : null),
  );
}

export async function withdrawQuote(f: FormData) {
  const id = text(f, "id");
  await run(`/professional/requests/${id}`, (s) => s.rpc("withdraw_quotation", { p_id: text(f, "quotation"), p_reason: text(f, "reason") }), "Quote withdrawn.");
}

export async function updateBooking(f: FormData) {
  const status = text(f, "status");
  const booking = text(f, "booking");
  await run("/professional/bookings", (s) => s.rpc("update_booking_status", { p_id: booking, p_status: status, p_reason: text(f, "reason") || null }), status === "cancelled" ? "Booking cancelled." : "Booking updated.", () => ["booking_update", booking]);
}

export async function replyToReview(f: FormData) {
  await run("/professional/reviews", (s) => s.rpc("reply_to_review", { p_id: text(f, "review"), p_reply: text(f, "reply") }), "Reply posted.");
}

export async function proposeInspection(f: FormData) {
  const id = text(f, "id");
  const when = text(f, "when"); // Ghana time is UTC all year, so the local time is sent as UTC.
  await run(
    `/professional/requests/${id}`,
    (s) => s.rpc("propose_inspection", { p_invitation: id, p_fee: Number(text(f, "fee")), p_reason: text(f, "reason"), p_scope: text(f, "scope"), p_at: when ? `${when}:00+00:00` : null }),
    "Inspection proposed. The customer has been told.",
    (ins) => (typeof ins === "string" ? ["inspection_proposed", ins] : null),
  );
}

export async function withdrawInspection(f: FormData) {
  const id = text(f, "id");
  await run(`/professional/requests/${id}`, (s) => s.rpc("withdraw_inspection", { p_id: text(f, "inspection") }), "Proposal withdrawn.");
}

export async function completeInspection(f: FormData) {
  const id = text(f, "id");
  await run(`/professional/requests/${id}`, (s) => s.rpc("complete_inspection", { p_id: text(f, "inspection"), p_findings: text(f, "findings") }), "Inspection completed. You can now send your quote.");
}

export async function cancelInspectionPro(f: FormData) {
  const id = text(f, "id");
  await run(`/professional/requests/${id}`, (s) => s.rpc("cancel_inspection", { p_id: text(f, "inspection"), p_reason: text(f, "reason") }), "Inspection cancelled. The customer will be refunded.");
}
