import { Suspense } from "react";
import { connection } from "next/server";
import { Empty, Notice, PageHeader, Pagination, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { fmtDate, PAGE_SIZE, pageOf, str } from "@/lib/admin";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setReviewStatus } from "./actions";

export const metadata = { title: "Reviews & Reports | HandyCorp Admin" };
const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

async function Body({ searchParams }: PageProps<"/admin/reviews">) {
  await connection();
  await requirePermission("support.view", "/admin/reviews");
  const sp = await searchParams;
  const page = pageOf(sp);
  const from = (page - 1) * PAGE_SIZE;
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, status, hidden_reason, created_at, bookings(ref, service_requests(services(name)))", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  const rows = data ?? [];
  return (
    <>
      <PageHeader title="Reviews & Reports" text="Reviews customers left after completed jobs. Hide one only if it breaks the rules; hiding is recorded in the audit log. Reports are not available yet." />
      {str(sp.error) && <Notice tone="error">{str(sp.error)}</Notice>}
      {error && <Notice tone="error">Couldn&apos;t load reviews. Try again.</Notice>}
      {!error && rows.length === 0 ? (
        <Empty title="No reviews yet" text="Reviews appear here after customers rate completed jobs." />
      ) : (
        <>
          <Table>
            <thead className="border-b border-line bg-ink/[0.03]"><tr><Th>Booking</Th><Th>Service</Th><Th>Rating</Th><Th>Review</Th><Th>Date</Th><Th>Status</Th><Th /></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const b = one(r.bookings);
                return (
                  <tr key={r.id} className="align-top">
                    <Td className="font-semibold">{b?.ref}</Td>
                    <Td>{one(one(b?.service_requests)?.services)?.name}</Td>
                    <Td>{r.rating} / 5</Td>
                    <Td className="max-w-xs whitespace-pre-wrap break-words">{r.comment ?? "No comment"}{r.hidden_reason ? <span className="block text-slate">Hidden: {r.hidden_reason}</span> : null}</Td>
                    <Td>{fmtDate(r.created_at)}</Td>
                    <Td><StatusBadge status={r.status} /></Td>
                    <Td>
                      <form action={setReviewStatus} className="flex flex-col gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        {r.status === "visible" ? (
                          <>
                            <input name="reason" placeholder="Reason" maxLength={300} aria-label="Reason for hiding" className="rounded-md border border-ink/25 px-2 py-1.5 text-[14px]" />
                            <ConfirmSubmit label="Hide" name="status" value="hidden" requires="reason" title="Hide this review?" message="The professional will no longer see it and it won't count toward their rating." tone="danger" />
                          </>
                        ) : (
                          <ConfirmSubmit label="Show again" name="status" value="visible" title="Show this review again?" message="It will count toward the professional's rating again." tone="primary" />
                        )}
                      </form>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Pagination sp={sp} page={page} total={count ?? 0} base="/admin/reviews" />
        </>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/admin/reviews">) {
  return <Suspense fallback={<p className="text-slate">Loading…</p>}><Body {...props} /></Suspense>;
}
