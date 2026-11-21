import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { experienceOptions } from "@/lib/professional-application";
import { statusLabel, statusList } from "@/lib/professional-status";
import { createClient } from "@/lib/supabase/server";
import { setStatus } from "../../actions";

export const metadata = { title: "Review registration | HandyCorp" };

const kindLabel: Record<string, string> = { profile_photo: "Profile photo", portfolio: "Work photo", certificate: "Certificate" };
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

async function Detail({ props }: { props: PageProps<"/admin/professionals/[id]"> }) {
  await requireRole("admin", "/login", "/admin");
  const { id } = await props.params;
  const sp = await props.searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();

  const [{ data: r }, { data: svc }, { data: ar }, { data: docs }] = await Promise.all([
    supabase.from("professional_profiles").select("*, profiles(full_name, phone), service_categories(name)").eq("user_id", id).maybeSingle(),
    supabase.from("professional_services").select("services(name)").eq("user_id", id),
    supabase.from("professional_areas").select("areas(name)").eq("user_id", id),
    supabase.from("professional_documents").select("kind, storage_path, file_name, size_bytes").eq("user_id", id).order("created_at"),
  ]);
  if (!r) notFound();

  const paths = (docs ?? []).map((d) => d.storage_path);
  const { data: signed } = paths.length
    ? await supabase.storage.from("professional-uploads").createSignedUrls(paths, 600)
    : { data: [] };
  const urlFor = (p: string) => signed?.find((s) => s.path === p)?.signedUrl;

  const person = one(r.profiles);
  const cat = one(r.service_categories);
  const row = (label: string, value: string | null | undefined) => (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-slate">{label}</dt>
      <dd className="sm:max-w-[65%] sm:text-right">{value || "Not given"}</dd>
    </div>
  );

  return (
    <>
      <Link href="/admin" className="text-[15px] underline underline-offset-4">All registrations</Link>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">{r.display_name || person?.full_name}</h1>
      <p className="mt-1 text-slate">Current status: <strong className="text-ink">{statusLabel(r.status)}</strong></p>

      {sp.saved && <p role="status" className="mt-6 rounded-md border border-line bg-white p-4 font-medium">Status saved.</p>}
      {sp.error && <p role="alert" className="mt-6 rounded-md border border-[#b3261e] bg-[#fdf0ee] p-4 font-medium text-[#b3261e]">Couldn&apos;t save the status. Try again.</p>}

      <dl className="mt-8 divide-y divide-line border-y border-line">
        {row("Full name", person?.full_name)}
        {row("Phone", person?.phone)}
        {row("Main category", cat?.name)}
        {row("Services", (svc ?? []).map((s) => one(s.services)?.name).filter(Boolean).join(", "))}
        {row("About their work", r.description)}
        {row("Experience", experienceOptions.find((o) => o.value === r.experience)?.label)}
        {row("Location", `${r.area}, ${r.city}, ${r.region}`)}
        {row("Work address", r.work_address)}
        {row("Areas covered", (ar ?? []).map((a) => one(a.areas)?.name).filter(Boolean).join(", "))}
        {row("Additional experience", r.extra_experience)}
        {row("Submitted", new Date(r.submitted_at).toLocaleString("en-GB", { timeZone: "Africa/Accra" }))}
      </dl>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold">Files</h2>
        {!docs?.length ? (
          <p className="mt-2 text-slate">No files uploaded.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {docs.map((d) => {
              const url = urlFor(d.storage_path);
              return (
                <li key={d.storage_path} className="flex items-center justify-between gap-4 py-3">
                  <span>
                    <span className="block font-medium">{kindLabel[d.kind] ?? d.kind}</span>
                    <span className="block break-all text-sm text-slate">{d.file_name}</span>
                  </span>
                  {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 font-semibold underline underline-offset-4">Open</a> : <span className="text-sm text-slate">Unavailable</span>}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-sm text-slate">Links expire after 10 minutes. Reload the page for new ones.</p>
      </section>

      <section className="mt-10 rounded-lg border border-line bg-white p-6">
        <h2 className="font-display text-xl font-bold">Change status</h2>
        <form action={setStatus} className="mt-4 space-y-5">
          <input type="hidden" name="id" value={id} />
          <div>
            <label htmlFor="status" className="font-medium">Status</label>
            <select id="status" name="status" defaultValue={r.status} className="mt-2 w-full rounded-md border border-ink/25 bg-white px-4 py-3">
              {statusList.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="note" className="font-medium">Note to the professional <span className="font-normal text-slate">(optional)</span></label>
            <textarea id="note" name="note" rows={3} maxLength={500} defaultValue={r.status_note ?? ""} className="mt-2 w-full rounded-md border border-ink/25 bg-white px-4 py-3" />
            <p className="mt-2 text-sm text-slate">They see this on their dashboard. For &ldquo;More information required&rdquo;, say what you need.</p>
          </div>
          <button className="rounded-md bg-gold px-6 py-3 font-bold hover:bg-gold-deep">Save status</button>
        </form>
      </section>
    </>
  );
}

export default function Page(props: PageProps<"/admin/professionals/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <Suspense fallback={<p className="text-slate">Loading…</p>}>
        <Detail props={props} />
      </Suspense>
    </main>
  );
}
