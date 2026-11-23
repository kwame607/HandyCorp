"use server";

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { dbMessage } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function run(back: string, call: (s: Awaited<ReturnType<typeof createClient>>) => PromiseLike<{ error: { code?: string; message?: string } | null }>, ok: string) {
  await requirePermission("finance.manage", back);
  const { error } = await call(await createClient());
  redirect(`${back}?${error ? `error=${encodeURIComponent(dbMessage(error))}` : `done=${encodeURIComponent(ok)}`}`);
}

export async function recordPayment(f: FormData) {
  await run("/admin/payments", (s) => s.rpc("admin_record_payment", { p_payment: text(f, "id"), p_reference: text(f, "reference"), p_note: text(f, "note") || null }), "Payment recorded.");
}
export async function recordRefund(f: FormData) {
  await run("/admin/refunds", (s) => s.rpc("admin_record_refund", { p_payment: text(f, "id"), p_note: text(f, "note") }), "Refund recorded.");
}
export async function markPayout(f: FormData) {
  await run("/admin/commissions", (s) => s.rpc("admin_mark_payout", { p_id: text(f, "id"), p_status: text(f, "status"), p_reference: text(f, "reference") || null, p_note: text(f, "note") || null }), "Payout updated.");
}
export async function saveSettings(f: FormData) {
  await run("/admin/commissions", (s) => s.rpc("admin_set_payment_settings", { p_commission: Number(text(f, "commission")), p_hold_hours: Number(text(f, "hours")) }), "Settings saved.");
}
