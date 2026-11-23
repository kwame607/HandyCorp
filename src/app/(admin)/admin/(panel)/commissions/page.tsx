import { Suspense } from "react";
import { connection } from "next/server";
import { Card, Empty, inputCls, Notice, PageHeader, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { fmtDateTime, str } from "@/lib/admin";
import { requirePermission } from "@/lib/auth";
import { money } from "@/lib/format";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { markPayout, saveSettings } from "../../finance-actions";

export const metadata = { title: "Commissions & Payouts | HandyCorp Admin" };
const clock = () => Date.now();
const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

async function Body({ searchParams }: PageProps<"/admin/commissions">) {
  await connection();
  const user = await requirePermission("finance.view", "/admin/commissions");
  const manage = can(user.staffRole, "finance.manage");
  const sp = await searchParams;
  const supabase = await createClient();
  const [settings, payouts] = await Promise.all([
    supabase.from("payment_settings").select("commission_percent, payout_hold_hours").maybeSingle(),
    supabase.from("payouts").select("id, ref, amount, status, due_at, transfer_reference, note, created_at, bookings(ref)").order("created_at", { ascending: false }).limit(100),
  ]);
  const s = settings.data;
  const rows = payouts.data ?? [];
  const now = clock();
  return (
    <>
      <PageHeader title="Commissions & Payouts" text="Set HandyCorp's commission, and pay professionals after their jobs are completed." />
      {str(sp.done) && <Notice tone="ok">{str(sp.done)}</Notice>}
      {str(sp.error) && <Notice tone="error">{str(sp.error)}</Notice>}
      <Card title="Settings">
        {s?.commission_percent == null && <p className="mb-3 text-slate">No commission is set, so customers cannot pay online yet. Setting one opens online payment.</p>}
        {manage ? (
          <form action={saveSettings} className="grid max-w-xl gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label><span className="text-sm font-medium">Commission (%)</span><input name="commission" type="number" step="0.01" min="0" max="50" required defaultValue={s?.commission_percent ?? ""} className={`mt-1 ${inputCls}`} /></label>
            <label><span className="text-sm font-medium">Hold before payout (hours)</span><input name="hours" type="number" min="0" max="720" required defaultValue={s?.payout_hold_hours ?? 48} className={`mt-1 ${inputCls}`} /></label>
            <ConfirmSubmit label="Save" title="Change payment settings?" message="New payments use these values. Payments already created keep the commission they were created with." tone="primary" />
          </form>
        ) : (
          <p>Commission: {s?.commission_percent ?? "not set"}% · hold: {s?.payout_hold_hours} hours</p>
        )}
      </Card>
      <h2 className="mb-3 mt-8 font-display text-xl font-bold">Payouts to professionals</h2>
      {rows.length === 0 ? (
        <Empty title="No payouts yet" text="A payout appears here once a job is completed and the customer's payment is recorded." />
      ) : (
        <Table>
          <thead className="border-b border-line bg-ink/[0.03]"><tr><Th>Payout</Th><Th>Booking</Th><Th>Amount</Th><Th>Due</Th><Th>Status</Th>{manage && <Th />}</tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => {
              const due = new Date(r.due_at).getTime() <= now;
              return (
                <tr key={r.id} className="align-top">
                  <Td className="font-semibold">{r.ref}</Td>
                  <Td>{one(r.bookings)?.ref}</Td>
                  <Td>{money(r.amount)}</Td>
                  <Td>{fmtDateTime(r.due_at)}{r.status === "pending" && <span className="block text-xs text-slate">{due ? "Ready to pay" : "Waiting for the hold to end"}</span>}</Td>
                  <Td><StatusBadge status={r.status} />{r.transfer_reference && <span className="mt-1 block text-xs text-slate">{r.transfer_reference}</span>}</Td>
                  {manage && (
                    <Td>
                      {["pending", "failed"].includes(r.status) && (
                        <form action={markPayout} className="flex flex-col gap-2">
                          <input type="hidden" name="id" value={r.id} />
                          <input name="reference" placeholder="Transfer reference" aria-label="Transfer reference" className={inputCls} />
                          <ConfirmSubmit label="Mark as sent" name="status" value="sent" requires="reference" title="Mark this payout as sent?" message="Only do this after you have sent the money to the professional's MoMo number." tone="primary" />
                        </form>
                      )}
                    </Td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/admin/commissions">) {
  return <Suspense fallback={<p className="text-slate">Loading…</p>}><Body {...props} /></Suspense>;
}
