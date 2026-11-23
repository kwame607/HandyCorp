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
  const ins = await supabase
    .from("inspections")
    .select("id, ref, fee, status, proposed_at, created_at, credited_booking_id, service_requests(ref, services(name))")
    .order("created_at", { ascending: false })
    .limit(50);
  const inspections = ins.data ?? [];
  return (
    <>
      <PageHeader title="Inspections & Quotations" text="Paid inspection visits, and the quotations professionals have sent." />
      <h2 className="mb-3 font-display text-xl font-bold">Inspections</h2>
      {inspections.length === 0 ? (
        <Empty title="No inspections yet" text="Inspections appear here when a professional proposes a paid visit." />
      ) : (
        <Table>
          <thead className="border-b border-line bg-ink/[0.03]"><tr><Th>Inspection</Th><Th>Request</Th><Th>Service</Th><Th>Fee</Th><Th>Visit</Th><Th>Credited to job</Th><Th>Status</Th></tr></thead>
          <tbody className="divide-y divide-line">
            {inspections.map((r) => {
              const q = one(r.service_requests);
              return (
                <tr key={r.id}>
                  <Td className="font-semibold">{r.ref}</Td>
                  <Td>{q?.ref}</Td>
                  <Td>{one(q?.services ?? null)?.name}</Td>
                  <Td>{money(r.fee)}</Td>
                  <Td>{fmtDate(r.proposed_at)}</Td>
                  <Td>{r.credited_booking_id ? "Yes" : "No"}</Td>
                  <Td><StatusBadge status={r.status} /></Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <h2 className="mb-3 mt-8 font-display text-xl font-bold">Quotations</h2>
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
