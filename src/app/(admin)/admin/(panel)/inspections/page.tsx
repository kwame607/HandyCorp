import { Suspense } from "react";
import { connection } from "next/server";
import { Empty, Notice, PageHeader, Pagination, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { fmtDate, PAGE_SIZE, pageOf } from "@/lib/admin";
import { money } from "@/lib/format";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Inspections & Quotations | HandyCorp Admin" };
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

async function Body({ searchParams }: PageProps<"/admin/inspections">) {
  await connection();
  await requirePermission("bookings.view", "/admin/inspections");
  const sp = await searchParams;
  const page = pageOf(sp);
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await supabase
    .from("quotations")
    .select("id, ref, version, status, total, expires_at, created_at, service_requests(ref, services(name))", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  const rows = data ?? [];
  return (
    <>
      <PageHeader title="Inspections & Quotations" text="Quotations professionals have sent. Paid inspections are not available yet." />
      {error && <Notice tone="error">Couldn&apos;t load this list. Try again.</Notice>}
      {!error && rows.length === 0 ? (
        <Empty title="No quotations yet" text="Quotations appear here when professionals reply to requests." />
      ) : (
        <>
          <Table>
            <thead className="border-b border-line bg-ink/[0.03]"><tr><Th>Quotation</Th><Th>Request</Th><Th>Service</Th><Th>Version</Th><Th>Total</Th><Th>Valid until</Th><Th>Status</Th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const q = one(r.service_requests);
                return (
                  <tr key={r.id} className="hover:bg-ink/[0.02]">
                    <Td className="font-semibold">{r.ref}</Td>
                    <Td>{q?.ref}</Td>
                    <Td>{one(q?.services ?? null)?.name}</Td>
                    <Td>{r.version}</Td>
                    <Td>{money(r.total)}</Td>
                    <Td>{fmtDate(r.expires_at)}</Td>
                    <Td><StatusBadge status={r.status} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Pagination sp={sp} page={page} total={count ?? 0} base="/admin/inspections" />
        </>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/admin/inspections">) {
  return <Suspense fallback={<p className="text-slate">Loading…</p>}><Body {...props} /></Suspense>;
}
