import { Suspense } from "react";
import { connection } from "next/server";
import { Empty, inputCls, Notice, PageHeader, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { fmtDate, str } from "@/lib/admin";
import { requirePermission } from "@/lib/auth";
import { money } from "@/lib/format";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { recordRefund } from "../../finance-actions";

export const metadata = { title: "Refunds & Disputes | HandyCorp Admin" };
const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

async function Body({ searchParams }: PageProps<"/admin/refunds">) {
  await connection();
  const user = await requirePermission("finance.view", "/admin/refunds");
  const manage = can(user.staffRole, "finance.manage");
  const sp = await searchParams;
  const { data, error } = await (await createClient())
    .from("payments")
    .select("id, ref, amount, status, note, created_at, bookings(ref, cancel_reason)")
    .in("status", ["refund_due", "refunded"])
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = data ?? [];
  return (
    <>
      <PageHeader title="Refunds & Disputes" text="Paid bookings that were cancelled. Send the refund from Paystack yourself, then record it here. Disputes are not available yet." />
      {str(sp.done) && <Notice tone="ok">{str(sp.done)}</Notice>}
      {str(sp.error) && <Notice tone="error">{str(sp.error)}</Notice>}
      {error && <Notice tone="error">Couldn&apos;t load refunds. Try again.</Notice>}
      {!error && rows.length === 0 ? (
        <Empty title="No refunds due" text="Cancelled bookings that were already paid appear here." />
      ) : (
        <Table>
          <thead className="border-b border-line bg-ink/[0.03]"><tr><Th>Payment</Th><Th>Booking</Th><Th>Amount</Th><Th>Cancel reason</Th><Th>Status</Th><Th>Date</Th>{manage && <Th />}</tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className="align-top">
                <Td className="font-semibold">{r.ref}</Td>
                <Td>{one(r.bookings)?.ref}</Td>
                <Td>{money(r.amount)}</Td>
                <Td className="max-w-xs break-words">{one(r.bookings)?.cancel_reason}</Td>
                <Td><StatusBadge status={r.status} />{r.note && <span className="mt-1 block text-xs text-slate">{r.note}</span>}</Td>
                <Td>{fmtDate(r.created_at)}</Td>
                {manage && (
                  <Td>
                    {r.status === "refund_due" && (
                      <form action={recordRefund} className="flex flex-col gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <input name="note" minLength={3} placeholder="Refund reference" aria-label="Refund reference" className={inputCls} />
                        <ConfirmSubmit label="Record refund" requires="note" title="Record this refund?" message="Only do this after the money has been returned to the customer from Paystack." tone="primary" />
                      </form>
                    )}
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/admin/refunds">) {
  return <Suspense fallback={<p className="text-slate">Loading…</p>}><Body {...props} /></Suspense>;
}
