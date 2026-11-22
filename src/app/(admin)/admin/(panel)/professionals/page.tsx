import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { Empty, inputCls, Notice, PageHeader, Pagination, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { type ProRow, fmtDate, PAGE_SIZE, pageOf, str } from "@/lib/admin";
import { statusList } from "@/lib/professional-status";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Professionals | HandyCorp Admin" };

async function Body({ searchParams }: PageProps<"/admin/professionals">) {
  await connection();
  const sp = await searchParams;
  const page = pageOf(sp);
  const supabase = await createClient();
  const [{ data, error }, { data: cats }] = await Promise.all([
    supabase.rpc("admin_list_professionals", {
      p_q: str(sp.q), p_status: str(sp.status), p_category: str(sp.category), p_location: str(sp.location), p_account: str(sp.account),
      p_limit: PAGE_SIZE, p_offset: (page - 1) * PAGE_SIZE,
    }),
    supabase.from("service_categories").select("slug, name").order("sort_order"),
  ]);
  const rows = (data ?? []) as ProRow[];
  const total = Number(rows[0]?.total ?? 0);
  const filtered = !!(str(sp.q) || str(sp.status) || str(sp.category) || str(sp.location) || str(sp.account));

  return (
    <>
      <PageHeader
        title="Professionals"
        text="Review registrations, check documents and decide who gets verified."
        actions={<Link prefetch={false} href="/admin/export/professionals" className="rounded-md border border-ink/30 px-4 py-2.5 text-[15px] font-semibold hover:bg-ink/5">Export CSV</Link>}
      />
      <form className="mb-5 grid gap-3 rounded-md border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.3fr_1.3fr_1fr_1fr_auto]">
        <div>
          <label htmlFor="q" className="text-sm font-medium">Search</label>
          <input id="q" name="q" defaultValue={str(sp.q)} placeholder="Name, email or phone" className={`mt-1 ${inputCls}`} />
        </div>
        <div>
          <label htmlFor="status" className="text-sm font-medium">Verification</label>
          <select id="status" name="status" defaultValue={str(sp.status)} className={`mt-1 ${inputCls}`}>
            <option value="">All</option>
            {statusList.map((s) => <option key={s.value} value={s.value}>{s.value === "approved" ? "Verified" : s.value === "submitted" ? "Pending verification" : s.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="category" className="text-sm font-medium">Category</label>
          <select id="category" name="category" defaultValue={str(sp.category)} className={`mt-1 ${inputCls}`}>
            <option value="">All</option>
            {cats?.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="location" className="text-sm font-medium">Location</label>
          <input id="location" name="location" defaultValue={str(sp.location)} placeholder="City or area" className={`mt-1 ${inputCls}`} />
        </div>
        <div>
          <label htmlFor="account" className="text-sm font-medium">Account</label>
          <select id="account" name="account" defaultValue={str(sp.account)} className={`mt-1 ${inputCls}`}>
            <option value="">All</option><option value="active">Active</option><option value="suspended">Suspended</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button className="rounded-md bg-ink px-4 py-2.5 text-[15px] font-semibold text-paper hover:bg-ink/85">Apply</button>
          {filtered && <Link href="/admin/professionals" className="px-2 py-2.5 text-[15px] underline underline-offset-4">Clear</Link>}
        </div>
      </form>

      {error && <Notice tone="error">Couldn&apos;t load professionals. Try again.</Notice>}
      {!error && rows.length === 0 ? (
        <Empty title={filtered ? "No professionals match these filters" : "No registrations yet"} text={filtered ? "Try a different search or clear the filters." : "Professionals appear here after they register."} />
      ) : (
        <>
          <Table>
            <thead className="border-b border-line bg-ink/[0.03]">
              <tr><Th>Professional</Th><Th>Category</Th><Th>Location</Th><Th>Registered</Th><Th>Verification</Th><Th>Account</Th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.user_id} className="hover:bg-ink/[0.02]">
                  <Td>
                    <Link href={`/admin/professionals/${r.user_id}`} className="font-semibold underline-offset-4 hover:underline">{r.display_name || r.full_name}</Link>
                    <span className="block break-all text-sm text-slate">{r.email}</span>
                  </Td>
                  <Td>{r.category}</Td>
                  <Td>{r.area}, {r.city}</Td>
                  <Td>{fmtDate(r.submitted_at)}</Td>
                  <Td><StatusBadge status={r.status} /></Td>
                  <Td>{r.account_status === "suspended" ? <StatusBadge status="suspended" /> : <span className="text-slate">Active</span>}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination sp={sp} page={page} total={total} base="/admin/professionals" />
        </>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/admin/professionals">) {
  return (
    <Suspense fallback={<p className="text-slate">Loading…</p>}>
      <Body {...props} />
    </Suspense>
  );
}
