import { Suspense } from "react";
import { connection } from "next/server";
import { Empty, Notice, PageHeader, Pagination, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { fmtDate, PAGE_SIZE, pageOf } from "@/lib/admin";
import { money } from "@/lib/format";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Bookings | HandyCorp Admin" };
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

async function Body({ searchParams }: PageProps<"/admin/bookings">) {
  await connection();
  await requirePermission("bookings.view", "/admin/bookings");
  const sp = await searchParams;
  const page = pageOf(sp);
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await supabase
    .from("bookings")
    .select("id, ref, status, agreed_total, created_at, service_requests(ref, services(name), areas(name))", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  const rows = data ?? [];
  return (
    <>
      <PageHeader title="Bookings" text="Jobs that customers and professionals have agreed. The agreed price cannot be changed from here." />
      {error && <Notice tone="error">Couldn&apos;t load this list. Try again.</Notice>}
      {!error && rows.length === 0 ? (
        <Empty title="No bookings yet" text="Bookings appear here when a customer accepts a quotation." />
      ) : (
        <>
          <Table>
            <thead className="border-b border-line bg-ink/[0.03]"><tr><Th>Booking</Th><Th>Request</Th><Th>Service</Th><Th>Area</Th><Th>Price</Th><Th>Status</Th><Th>Date</Th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const q = one(r.service_requests);
                return (
                  <tr key={r.id} className="hover:bg-ink/[0.02]">
                    <Td className="font-semibold">{r.ref}</Td>
                    <Td>{q?.ref}</Td>
                    <Td>{one(q?.services ?? null)?.name}</Td>
                    <Td>{one(q?.areas ?? null)?.name}</Td>
                    <Td>{money(r.agreed_total)}</Td>
                    <Td><StatusBadge status={r.status} /></Td>
                    <Td>{fmtDate(r.created_at)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Pagination sp={sp} page={page} total={count ?? 0} base="/admin/bookings" />
        </>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/admin/bookings">) {
  return <Suspense fallback={<p className="text-slate">Loading…</p>}><Body {...props} /></Suspense>;
}
