import { requirePermission } from "@/lib/auth";
import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { Empty, inputCls, Notice, PageHeader, Pagination, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { type CustomerRow, dateOnly, fmtDate, PAGE_SIZE, pageOf, str } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Customers | HandyCorp Admin" };

async function Body({ searchParams }: PageProps<"/admin/customers">) {
  await connection();
  await requirePermission("customers.view", "/admin/customers");
  const sp = await searchParams;
  const page = pageOf(sp);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_customers", {
    p_q: str(sp.q), p_status: str(sp.status), p_from: dateOnly(str(sp.from)) as string, p_to: dateOnly(str(sp.to)) as string,
    p_limit: PAGE_SIZE, p_offset: (page - 1) * PAGE_SIZE,
  });
  const rows = (data ?? []) as CustomerRow[];
  const total = Number(rows[0]?.total ?? 0);
  const filtered = !!(str(sp.q) || str(sp.status) || str(sp.from) || str(sp.to));

  return (
    <>
      <PageHeader
        title="Customers"
        text="Everyone who has created a customer account."
        actions={<Link prefetch={false} href="/admin/export/customers" className="rounded-md border border-ink/30 px-4 py-2.5 text-[15px] font-semibold hover:bg-ink/5">Export CSV</Link>}
      />
      <form className="mb-5 grid gap-3 rounded-md border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <div>
          <label htmlFor="q" className="text-sm font-medium">Search</label>
          <input id="q" name="q" defaultValue={str(sp.q)} placeholder="Name, email or phone" className={`mt-1 ${inputCls}`} />
        </div>
        <div>
          <label htmlFor="status" className="text-sm font-medium">Account status</label>
          <select id="status" name="status" defaultValue={str(sp.status)} className={`mt-1 ${inputCls}`}>
            <option value="">All</option><option value="active">Active</option><option value="suspended">Suspended</option>
          </select>
        </div>
        <div>
          <label htmlFor="from" className="text-sm font-medium">Registered from</label>
          <input id="from" name="from" type="date" defaultValue={str(sp.from)} className={`mt-1 ${inputCls}`} />
        </div>
        <div>
          <label htmlFor="to" className="text-sm font-medium">Registered to</label>
          <input id="to" name="to" type="date" defaultValue={str(sp.to)} className={`mt-1 ${inputCls}`} />
        </div>
        <div className="flex items-end gap-2">
          <button className="rounded-md bg-ink px-4 py-2.5 text-[15px] font-semibold text-paper hover:bg-ink/85">Apply</button>
          {filtered && <Link href="/admin/customers" className="px-2 py-2.5 text-[15px] underline underline-offset-4">Clear</Link>}
        </div>
      </form>

      {error && <Notice tone="error">Couldn&apos;t load customers. Try again.</Notice>}
      {!error && rows.length === 0 ? (
        <Empty title={filtered ? "No customers match these filters" : "No customers yet"} text={filtered ? "Try a different search or clear the filters." : "Customers appear here after they create an account."} />
      ) : (
        <>
          <Table>
            <thead className="border-b border-line bg-ink/[0.03]">
              <tr><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Registered</Th><Th>Status</Th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-ink/[0.02]">
                  <Td><Link href={`/admin/customers/${r.id}`} className="font-semibold underline-offset-4 hover:underline">{r.full_name}</Link></Td>
                  <Td className="break-all">{r.email}</Td>
                  <Td>{r.phone ?? "Not given"}</Td>
                  <Td>{fmtDate(r.created_at)}</Td>
                  <Td><StatusBadge status={r.status} /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination sp={sp} page={page} total={total} base="/admin/customers" />
        </>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/admin/customers">) {
  return (
    <Suspense fallback={<p className="text-slate">Loading…</p>}>
      <Body {...props} />
    </Suspense>
  );
}
