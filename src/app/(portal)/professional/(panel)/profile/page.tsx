import { connection } from "next/server";
import { Suspense } from "react";
import AreaPicker from "@/components/AreaPicker";
import DocumentManager from "@/components/professional/DocumentManager";
import { requireRole } from "@/lib/auth";
import { getCatalogue } from "@/lib/catalogue";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "../../actions";

export const metadata = { title: "Profile & Portfolio | HandyCorp" };

const box = "rounded-md border border-line bg-white p-5";
const inputCls = "mt-1 w-full rounded-md border border-ink/25 bg-white px-3 py-2.5 text-[15px]";
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

async function Body({ searchParams }: { searchParams: PageProps<"/professional/profile">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const user = await requireRole("professional", "/professional/login", "/professional/profile");
  const supabase = await createClient();
  const [{ data: pp }, { data: ar }, { data: docs }, { areas }] = await Promise.all([
    supabase.from("professional_profiles").select("display_name, description, work_address, extra_experience, status").eq("user_id", user.id).maybeSingle(),
    supabase.from("professional_areas").select("areas(slug)").eq("user_id", user.id),
    supabase.from("professional_documents").select("id, kind, file_name, storage_path").eq("user_id", user.id).order("created_at"),
    getCatalogue(),
  ]);
  if (!pp) return null;
  const mine = new Set((ar ?? []).map((a) => one(a.areas)?.slug));
  const paths = (docs ?? []).map((d) => d.storage_path);
  const { data: signed } = paths.length ? await supabase.storage.from("professional-uploads").createSignedUrls(paths, 600) : { data: [] };
  const list = (docs ?? []).map((d) => ({ id: d.id, kind: d.kind, file_name: d.file_name, url: signed?.find((s) => s.path === d.storage_path)?.signedUrl }));
  const error = typeof sp.error === "string" ? sp.error : "";

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Profile & Portfolio</h1>
      <p className="mt-1 text-slate">What customers and HandyCorp see about you.</p>
      {sp.saved === "1" && <p role="status" className="mt-6 rounded-md border border-[#1f5c36] bg-[#e8f3ec] p-4 font-medium">Profile saved.</p>}
      {sp.saved === "review" && <p role="status" className="mt-6 rounded-md border border-gold-deep bg-[#fff1e6] p-4 font-medium">Saved. Because you changed your public name or description, HandyCorp will review the change and your profile will show as under review until then.</p>}
      {error && <p role="alert" className="mt-6 rounded-md border border-[#b3261e] bg-[#fdf0ee] p-4 font-medium text-[#9c2019]">{error}</p>}

      <form action={updateProfile} className={`${box} mt-6 space-y-5`}>
        <h2 className="font-display text-base font-bold">Your details</h2>
        <div>
          <label htmlFor="displayName" className="text-sm font-medium">Display name <span className="font-normal text-slate">(optional)</span></label>
          <input id="displayName" name="displayName" defaultValue={pp.display_name ?? ""} maxLength={100} className={inputCls} />
        </div>
        <div>
          <label htmlFor="description" className="text-sm font-medium">About your work</label>
          <textarea id="description" name="description" rows={4} minLength={20} maxLength={600} required defaultValue={pp.description} className={inputCls} />
          <p className="mt-1 text-sm text-slate">{pp.status === "approved" ? "Changing your display name or this description sends your profile back for review." : "20 to 600 characters."}</p>
        </div>
        <div>
          <label htmlFor="workAddress" className="text-sm font-medium">Work or workshop address <span className="font-normal text-slate">(optional)</span></label>
          <input id="workAddress" name="workAddress" defaultValue={pp.work_address ?? ""} maxLength={200} className={inputCls} />
        </div>
        <div>
          <label htmlFor="extra" className="text-sm font-medium">Additional experience <span className="font-normal text-slate">(optional)</span></label>
          <textarea id="extra" name="extra" rows={3} maxLength={600} defaultValue={pp.extra_experience ?? ""} className={inputCls} />
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Areas you cover</legend>
          <div className="mt-2"><AreaPicker areas={areas} name="areas" defaultSelected={areas.filter((a) => mine.has(a.slug)).map((a) => a.slug)} /></div>
        </fieldset>
        <button className="rounded-md bg-gold px-5 py-3 font-bold hover:bg-gold-deep">Save changes</button>
      </form>

      <section className={`${box} mt-6`}>
        <h2 className="font-display text-base font-bold">Portfolio and certificates</h2>
        <p className="mb-4 mt-1 text-sm text-slate">Only show work you actually did. Files are private to you and HandyCorp until profiles go public.</p>
        <DocumentManager userId={user.id} docs={list} />
      </section>
    </>
  );
}

export default function Page(props: PageProps<"/professional/profile">) {
  return (
    <Suspense fallback={<p className="text-slate">Loading…</p>}>
      <Body {...props} />
    </Suspense>
  );
}
