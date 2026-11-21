import { Suspense } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { statusLabel, statusList } from "@/lib/professional-status";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../(auth)/actions";

export const metadata = { title: "Admin | HandyCorp" };

async function List({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await requireRole("admin", "/login", "/admin");
  const sp = await searchParams;
  const filter = statusList.find((s) => s.value === sp.status)?.value;
  const supabase = await createClient();
  let q = supabase
    .from("professional_profiles")
    .select("user_id, display_name, city, area, status, submitted_at, profiles(full_name, phone), service_categories(name)")
    .order("submitted_at", { ascending: false })
    .limit(200);
  if (filter) q = q.eq("status", filter);
  const { data, error } = await q;

  const tab = (value: string | undefined, label: string) => {
    const active = value === filter;
    return (
      <Link
        key={label}
        href={value ? `/admin?status=${value}` : "/admin"}
        aria-current={active ? "page" : undefined}
        className={`rounded-full border px-4 py-2 text-[15px] ${active ? "border-ink bg-ink text-paper" : "border-ink/20 hover:bg-ink/5"}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">Professional registrations</h1>
        <form action={signOut}>
          <button className="rounded-md border border-ink px-5 py-2.5 font-semibold hover:bg-ink hover:text-paper">Sign out</button>
        </form>
      </div>
      <nav aria-label="Filter by status" className="mt-6 flex flex-wrap gap-2">
        {tab(undefined, "All")}
        {statusList.map((s) => tab(s.value, s.label))}
      </nav>
      {error && <p role="alert" className="mt-6 font-medium text-[#b3261e]">Couldn&apos;t load registrations. Try again.</p>}
      {!error && data?.length === 0 && <p className="mt-8 text-slate">No registrations here yet.</p>}
      {!!data?.length && (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {data.map((r) => {
            const person = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
            const cat = Array.isArray(r.service_categories) ? r.service_categories[0] : r.service_categories;
            return (
              <li key={r.user_id}>
                <Link href={`/admin/professionals/${r.user_id}`} className="flex flex-col gap-1 py-4 hover:bg-white sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-3">
                  <span>
                    <span className="block font-semibold">{r.display_name || person?.full_name}</span>
                    <span className="block text-[15px] text-slate">
                      {cat?.name} · {r.area}, {r.city}
                    </span>
                  </span>
                  <span className="text-[15px] sm:text-right">
                    <span className="block font-medium">{statusLabel(r.status)}</span>
                    <span className="block text-slate">{new Date(r.submitted_at).toLocaleDateString("en-GB", { timeZone: "Africa/Accra" })}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function Page({ searchParams }: PageProps<"/admin">) {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12">
      <Suspense fallback={<p className="text-slate">Loading…</p>}>
        <List searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
