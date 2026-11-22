"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { dbMessage } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function run(back: string, fn: (s: Awaited<ReturnType<typeof createClient>>) => PromiseLike<{ error: { code?: string; message?: string } | null }>, ok: string) {
  await requireRole("professional", "/professional/login", back);
  const { error } = await fn(await createClient());
  redirect(`${back}?${error ? `error=${encodeURIComponent(dbMessage(error))}` : `done=${encodeURIComponent(ok)}`}`);
}

export async function declineRequest(f: FormData) {
  const id = text(f, "id");
  await run(`/professional/requests/${id}`, (s) => s.rpc("decline_invitation", { p_id: id, p_reason: text(f, "reason") || null }), "Request declined.");
}

export async function sendMessage(f: FormData) {
  const id = text(f, "id");
  await run(`/professional/requests/${id}`, (s) => s.rpc("post_request_message", { p_invitation: id, p_body: text(f, "body") }), "Message sent.");
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
  );
}

export async function withdrawQuote(f: FormData) {
  const id = text(f, "id");
  await run(`/professional/requests/${id}`, (s) => s.rpc("withdraw_quotation", { p_id: text(f, "quotation"), p_reason: text(f, "reason") }), "Quote withdrawn.");
}

export async function updateBooking(f: FormData) {
  const status = text(f, "status");
  await run("/professional/bookings", (s) => s.rpc("update_booking_status", { p_id: text(f, "booking"), p_status: status, p_reason: text(f, "reason") || null }), status === "cancelled" ? "Booking cancelled." : "Booking updated.");
}
