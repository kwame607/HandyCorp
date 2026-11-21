import { Suspense } from "react";
import Link from "next/link";
import { Card, Empty, PageHeader, StatusBadge } from "@/components/admin/ui";
import { type CustomerRow, type ProRow, str } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Search | HandyCorp Admin" };

async function Body({ searchParams }: PageProps<"/admin/search">) {
  const q = str((await searchParams).q);
  const supabase = await createClient();
  const [c, p] = q
    ? await Promise.all([
        supabase.rpc("admin_list_customers", { p_q: q, p_status: "", p_from: null as unknown as string, p_to: null as unknown as string, p_limit: 8, p_offset: 0 }),
        supabase.rpc("admin_list_professionals", { p_q: q, p_status: "", p_category: "", p_location: "", p_account: "", p_limit: 8, p_offset: 0 }),
      ])
    : [{ data: [] }, { data: [] }];
  const customers = (c.data ?? []) as CustomerRow[];
  const pros = (p.data ?? []) as ProRow[];

  return (
    <>
      <PageHeader title={q ? `Results for “${q}”` : "Search"} text="Search customers and professionals by name, email or phone. Requests and bookings will be searchable once they exist." />
      <form className="mb-6 flex max-w-lg gap-2" role="search">
        <label htmlFor="q" className="sr-only">Search</label>
        <input id="q" name="q" defaultValue={q} placeholder="Name, email or phone" className="w-full rounded-md border border-ink/25 bg-white px-3 py-2.5 text-[15px]" />
        <button className="rounded-md bg-ink px-4 py-2.5 font-semibold text-paper">Search</button>
      </form>
      {q && customers.length === 0 && pros.length === 0 && <Empty title="Nothing found" text="Check the spelling or try part of an email or phone number." />}
      <div className="grid gap-6 lg:grid-cols-2">
        {pros.length > 0 && (
          <Card title="Professionals" right={<Link className="text-sm underline underline-offset-4" href={`/admin/professionals?q=${encodeURIComponent(q)}`}>See all</Link>}>
            <ul className="divide-y divide-line">
              {pros.map((r) => (
                <li key={r.user_id}>
                  <Link href={`/admin/professionals/${r.user_id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-ink/[0.03]">
                    <span><span className="block font-medium">{r.display_name || r.full_name}</span><span className="block break-all text-sm text-slate">{r.email}</span></span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {customers.length > 0 && (
          <Card title="Customers" right={<Link className="text-sm underline underline-offset-4" href={`/admin/customers?q=${encodeURIComponent(q)}`}>See all</Link>}>
            <ul className="divide-y divide-line">
              {customers.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/customers/${r.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-ink/[0.03]">
                    <span><span className="block font-medium">{r.full_name}</span><span className="block break-all text-sm text-slate">{r.email}</span></span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}

export default function Page(props: PageProps<"/admin/search">) {
  return (
    <Suspense fallback={<p className="text-slate">Loading…</p>}>
      <Body {...props} />
    </Suspense>
  );
}
