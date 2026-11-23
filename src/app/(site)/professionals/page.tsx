import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import Combobox from "@/components/Combobox";
import { getCatalogue } from "@/lib/catalogue";
import { createAnonClient } from "@/lib/supabase";

export const metadata = { title: "Find professionals | HandyCorp" };
const PER = 12;
const years: Record<string, string> = { "under-1": "Under 1 year", "1-3": "1 to 3 years", "4-9": "4 to 9 years", "10-plus": "10+ years" };
const field = "w-full rounded-md border border-ink/30 bg-white px-4 py-3 text-[16px]";
type Row = { id: string; name: string; experience: string; description: string; average: number | null; total: number; services: string[]; total_count: number };

async function Body({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim().slice(0, 100) : "");
  const page = Math.min(Math.max(parseInt(str("page"), 10) || 1, 1), 200);
  const { categories, areas } = await getCatalogue();
  const services = categories.flatMap((c) => c.services.map((s) => ({ slug: s.slug, name: s.name, category: c.name })));
  const label = (a: (typeof areas)[number]) => `${a.name} (${a.region})`;
  const svc = services.find((s) => s.name.toLowerCase() === str("service").toLowerCase());
  const area = areas.find((a) => label(a).toLowerCase() === str("area").toLowerCase());
  const bad = (str("service") && !svc) || (str("area") && !area);

  const { data } = bad
    ? { data: [] }
    : await createAnonClient().rpc("public_professionals", { p_service_slug: svc?.slug ?? "", p_area_slug: area?.slug ?? "", p_limit: PER, p_offset: (page - 1) * PER });
  const rows = (data ?? []) as Row[];
  const total = Number(rows[0]?.total_count ?? 0);
  const filtered = !!(str("service") || str("area"));

  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Find professionals</h1>
      <p className="mt-2 max-w-xl text-slate">Every professional here has been verified by HandyCorp. Best-rated first.</p>
      <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div className="flex"><Combobox name="service" defaultValue={str("service")} options={services.map((s) => ({ value: s.name, hint: s.category }))} placeholder="Any service" max={10} className={field} /></div>
        <div className="flex"><Combobox name="area" defaultValue={str("area")} options={areas.map((a) => ({ value: label(a) }))} placeholder="Any area" max={10} className={field} /></div>
        <div className="flex gap-2">
          <button className="rounded-md bg-ink px-5 py-3 font-semibold text-paper hover:bg-ink/85">Search</button>
          {filtered && <Link href="/professionals" className="px-2 py-3 underline underline-offset-4">Clear</Link>}
        </div>
      </form>
      {bad && <p role="alert" className="mt-4 rounded-md border border-line bg-white px-4 py-3">Choose a service and area from the lists that appear as you type.</p>}

      {!bad && rows.length === 0 ? (
        <div className="mt-6 rounded-md border border-line bg-white px-6 py-14 text-center">
          <p className="font-display text-lg font-bold">{filtered ? "No verified professionals match yet" : "No verified professionals yet"}</p>
          <p className="mx-auto mt-1 max-w-md text-slate">{filtered ? "Try a nearby area or a different service." : "Professionals appear here once HandyCorp has verified them."}</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line bg-white">
          {rows.map((p) => (
            <li key={p.id}>
              <Link href={`/professionals/${p.id}`} className="block px-4 py-4 hover:bg-sand">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{p.name} <span className="ml-1 rounded bg-sand px-2 py-0.5 text-xs font-semibold">Verified</span></span>
                  <span className="text-sm text-slate">{p.total > 0 ? `★ ${p.average} (${p.total})` : "No reviews yet"}</span>
                </span>
                <span className="mt-1 block text-sm text-slate">{years[p.experience] ?? p.experience} experience{p.services.length ? ` · ${p.services.slice(0, 3).join(", ")}${p.services.length > 3 ? ` +${p.services.length - 3} more` : ""}` : ""}</span>
                <span className="mt-1 line-clamp-2 block text-[15px]">{p.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!bad && total > PER && <DirectoryPages page={page} total={total} service={str("service")} area={str("area")} />}
    </>
  );
}

function DirectoryPages({ page, total, service, area }: { page: number; total: number; service: string; area: string }) {
  const pages = Math.ceil(total / PER);
  const href = (n: number) => `/professionals?${new URLSearchParams({ ...(service && { service }), ...(area && { area }), page: String(n) })}`;
  const link = "rounded-md border border-ink/20 px-3 py-1.5 text-[15px] hover:bg-ink/5";
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-slate">
      <p>Page {page} of {pages}</p>
      <div className="flex gap-2">
        {page > 1 && <Link className={link} href={href(page - 1)}>Previous</Link>}
        {page < pages && <Link className={link} href={href(page + 1)}>Next</Link>}
      </div>
    </nav>
  );
}

export default function Page(props: PageProps<"/professionals">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <Suspense fallback={<p className="text-slate">Loading…</p>}><Body searchParams={props.searchParams} /></Suspense>
    </main>
  );
}
