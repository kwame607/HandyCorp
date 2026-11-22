import { Suspense } from "react";
import { connection } from "next/server";
import { Empty, Notice, PageHeader, Pagination, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { fmtDate, PAGE_SIZE, pageOf } from "@/lib/admin";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Service Requests | HandyCorp Admin" };
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

async function Body({ searchParams }: PageProps<"/admin/requests">) {
  await connection();
  await requirePermission("bookings.view", "/admin/requests");
  const sp = await searchParams;
  const page = pageOf(sp);
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await supabase
    .from("service_requests")
    .select("id, ref, status, created_at, services(name), areas(name), request_invitations(status)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  const rows = data ?? [];
  return (
    <>
      <PageHeader title="Service Requests" text="Every request customers send to professionals. Customer addresses are not shown here." />
      {error && <Notice tone="error">Couldn&apos;t load this list. Try again.</Notice>}
      {!error && rows.length === 0 ? (
        <Empty title="No requests yet" text="Requests appear here when customers send them." />
      ) : (
        <>
          <Table>
            <thead className="border-b border-line bg-ink/[0.03]"><tr><Th>Request</Th><Th>Service</Th><Th>Area</Th><Th>Sent to</Th><Th>Quotes</Th><Th>Status</Th><Th>Date</Th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-ink/[0.02]">
                  <Td className="font-semibold">{r.ref}</Td>
                  <Td>{one(r.services)?.name}</Td>
                  <Td>{one(r.areas)?.name}</Td>
                  <Td>{r.request_invitations.length}</Td>
                  <Td>{r.request_invitations.filter((i) => i.status === "quoted").length}</Td>
                  <Td><StatusBadge status={r.status} /></Td>
                  <Td>{fmtDate(r.created_at)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination sp={sp} page={page} total={count ?? 0} base="/admin/requests" />
        </>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/admin/requests">) {
  return <Suspense fallback={<p className="text-slate">Loading…</p>}><Body {...props} /></Suspense>;
}
