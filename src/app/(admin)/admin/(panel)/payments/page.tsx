import { Suspense } from "react";
import { connection } from "next/server";
import { Empty, inputCls, Notice, PageHeader, Pagination, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { fmtDate, PAGE_SIZE, pageOf, str } from "@/lib/admin";
import { requirePermission } from "@/lib/auth";
import { money } from "@/lib/format";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { recordPayment } from "../../finance-actions";

export const metadata = { title: "Payments | HandyCorp Admin" };
const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

async function Body({ searchParams }: PageProps<"/admin/payments">) {
  await connection();
  const user = await requirePermission("finance.view", "/admin/payments");
  const manage = can(user.staffRole, "finance.manage");
  const sp = await searchParams;
  const page = pageOf(sp);
  const from = (page - 1) * PAGE_SIZE;
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("payments")
    .select("id, ref, kind, amount, commission_amount, provider_amount, status, gateway_reference, created_at, bookings(ref)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  const rows = data ?? [];
  return (
    <>
      <PageHeader title="Payments" text="Money customers pay for jobs. Job payments and inspection payments are kept as separate records." />
      {str(sp.done) && <Notice tone="ok">{str(sp.done)}</Notice>}
      {str(sp.error) && <Notice tone="error">{str(sp.error)}</Notice>}
      {error && <Notice tone="error">Couldn&apos;t load payments. Try again.</Notice>}
      {!error && rows.length === 0 ? (
        <Empty title="No payments yet" text="Payments appear here when a customer starts paying for a booking." />
      ) : (
        <>
          <Table>
            <thead className="border-b border-line bg-ink/[0.03]"><tr><Th>Payment</Th><Th>Booking</Th><Th>Type</Th><Th>Amount</Th><Th>Commission</Th><Th>Professional gets</Th><Th>Status</Th><Th>Date</Th>{manage && <Th />}</tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <Td className="font-semibold">{r.ref}</Td>
                  <Td>{one(r.bookings)?.ref}</Td>
                  <Td className="capitalize">{r.kind}</Td>
                  <Td>{money(r.amount)}</Td>
                  <Td>{money(r.commission_amount)}</Td>
                  <Td>{money(r.provider_amount)}</Td>
                  <Td><StatusBadge status={r.status} />{r.gateway_reference && <span className="mt-1 block text-xs text-slate">{r.gateway_reference}</span>}</Td>
                  <Td>{fmtDate(r.created_at)}</Td>
                  {manage && (
                    <Td>
                      {r.status === "pending" && (
                        <form action={recordPayment} className="flex flex-col gap-2">
                          <input type="hidden" name="id" value={r.id} />
                          <input name="reference" required minLength={3} placeholder="Paystack reference" aria-label="Paystack reference" className={inputCls} />
                          <button className="rounded-md bg-ink px-3 py-2 text-[14px] font-semibold text-paper hover:bg-ink/85">Record as paid</button>
                        </form>
                      )}
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination sp={sp} page={page} total={count ?? 0} base="/admin/payments" />
        </>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/admin/payments">) {
  return <Suspense fallback={<p className="text-slate">Loading…</p>}><Body {...props} /></Suspense>;
}
