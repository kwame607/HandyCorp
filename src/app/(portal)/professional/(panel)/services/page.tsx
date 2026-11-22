import { connection } from "next/server";
import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { getCatalogue } from "@/lib/catalogue";
import { createClient } from "@/lib/supabase/server";
import { requestMoreWork } from "../../actions";

export const metadata = { title: "My Services | HandyCorp" };

const box = "rounded-md border border-line bg-white p-5";
const inputCls = "mt-1 w-full rounded-md border border-ink/25 bg-white px-3 py-2.5 text-[15px]";
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);
const tone: Record<string, string> = { pending: "bg-[#fff3d6] text-[#7a4f00]", approved: "bg-[#e8f3ec] text-[#1f5c36]", declined: "bg-[#fdf0ee] text-[#9c2019]" };
const word: Record<string, string> = { pending: "Waiting", approved: "Approved", declined: "Declined" };
const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Africa/Accra", day: "numeric", month: "short", year: "numeric" });

async function Body({ searchParams }: { searchParams: PageProps<"/professional/services">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const user = await requireRole("professional", "/professional/login", "/professional/services");
  const supabase = await createClient();
  const [{ data: mine }, { data: reqs }, catalogue] = await Promise.all([
    supabase.from("professional_services").select("services(slug, name, service_categories(name))").eq("user_id", user.id),
    supabase.from("professional_service_requests").select("id, status, reason, admin_note, requested_name, created_at, services(name), service_categories(name)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    getCatalogue(),
  ]);
  const owned = new Set((mine ?? []).map((m) => one(m.services)?.slug).filter(Boolean) as string[]);
  const asked = new Set<string>();
  const offered = (mine ?? []).map((m) => { const s = one(m.services); return { name: s?.name ?? "", category: one(s?.service_categories ?? null)?.name ?? "" }; });
  const error = typeof sp.error === "string" ? sp.error : "";

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">My Services</h1>
      <p className="mt-1 text-slate">What customers can book you for, and how to add more.</p>
      {sp.saved && <p role="status" className="mt-6 rounded-md border border-[#1f5c36] bg-[#e8f3ec] p-4 font-medium">Request sent. HandyCorp will review it and reply here.</p>}
      {error && <p role="alert" className="mt-6 rounded-md border border-[#b3261e] bg-[#fdf0ee] p-4 font-medium text-[#9c2019]">{error}</p>}

      <section className={`${box} mt-6`}>
        <h2 className="font-display text-base font-bold">Services you offer</h2>
        {offered.length === 0 ? (
          <p className="mt-2 text-slate">Your services appear here once HandyCorp approves your registration.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {offered.map((s) => (<li key={s.name} className="flex justify-between gap-4 py-2.5 text-[15px]"><span className="font-medium">{s.name}</span><span className="text-slate">{s.category}</span></li>))}
          </ul>
        )}
      </section>

      <section id="request" className={`${box} mt-6 scroll-mt-24`}>
        <h2 className="font-display text-base font-bold">Request more work</h2>
        <p className="mt-1 text-slate">Ask to add a service to your name. Tell us why you can do it well. HandyCorp reviews every request.</p>
        <form action={requestMoreWork} className="mt-4 space-y-4">
          <div>
            <label htmlFor="service" className="text-sm font-medium">Choose a service</label>
            <select id="service" name="service" defaultValue="" className={inputCls}>
              <option value="">Select a service…</option>
              {catalogue.categories.map((c) => {
                const options = c.services.filter((s) => !owned.has(s.slug) && !asked.has(s.slug));
                return options.length ? (
                  <optgroup key={c.slug} label={c.name}>
                    {options.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                  </optgroup>
                ) : null;
              })}
            </select>
          </div>
          <fieldset className="rounded-md border border-line p-4">
            <legend className="px-1 text-sm font-medium">Not listed? Suggest a service instead</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="otherName" className="text-sm">Service name</label><input id="otherName" name="otherName" maxLength={80} className={inputCls} /></div>
              <div>
                <label htmlFor="otherCategory" className="text-sm">Closest category</label>
                <select id="otherCategory" name="otherCategory" defaultValue="" className={inputCls}>
                  <option value="">Not sure</option>
                  {catalogue.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate">Only used if you didn&apos;t choose a service above.</p>
          </fieldset>
          <div>
            <label htmlFor="reason" className="text-sm font-medium">Why should you offer it?</label>
            <textarea id="reason" name="reason" rows={3} minLength={10} maxLength={500} required className={inputCls} />
            <p className="mt-1 text-sm text-slate">Experience, training or work you&apos;ve done. You can add certificates and photos under Profile & Portfolio.</p>
          </div>
          <button className="rounded-md bg-gold px-5 py-3 font-bold hover:bg-gold-deep">Send request</button>
        </form>
      </section>

      <section className={`${box} mt-6`}>
        <h2 className="font-display text-base font-bold">Your requests</h2>
        {!reqs?.length ? (
          <p className="mt-2 text-slate">You haven&apos;t asked for anything yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {reqs.map((r) => {
              const name = one(r.services)?.name ?? r.requested_name ?? "Service";
              const cat = one(r.service_categories)?.name;
              return (
                <li key={r.id} className="py-3 text-[15px]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{name}{!one(r.services) && <span className="font-normal text-slate"> (suggested{cat ? `, ${cat}` : ""})</span>}</span>
                    <span className={`rounded px-2 py-0.5 text-[13px] font-medium ${tone[r.status]}`}>{word[r.status]}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate">Sent {date(r.created_at)}</p>
                  {r.admin_note && <p className="mt-2 border-l-2 border-gold-deep pl-3">{r.admin_note}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

export default function Page(props: PageProps<"/professional/services">) {
  return (
    <Suspense fallback={<p className="text-slate">Loading…</p>}>
      <Body {...props} />
    </Suspense>
  );
}
