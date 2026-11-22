import { connection } from "next/server";
import { Fragment, Suspense } from "react";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { Card, inputCls, Notice, PageHeader } from "@/components/admin/ui";
import { regions } from "@/data/areas";
import { str } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { addArea, setAreaActive } from "../../actions";

export const metadata = { title: "Areas | HandyCorp Admin" };

async function Body({ searchParams }: PageProps<"/admin/areas">) {
  await connection();
  const sp = await searchParams;
  const q = str(sp.q).toLowerCase();
  const supabase = await createClient();
  const { data, error } = await supabase.from("areas").select("id, name, region, is_active").order("region").order("name");
  const all = data ?? [];
  const reg = str(sp.region);
  const rows = all.filter((a) => (!q || a.name.toLowerCase().includes(q)) && (!reg || a.region === reg));
  const err = str(sp.error);

  return (
    <>
      <PageHeader title="Areas" text="Places in Greater Accra, Ashanti and Central where professionals can say they work and customers can book. Hidden areas disappear from the site but nothing is deleted." />
      {sp.saved && <Notice tone="ok">Saved. The site updates within moments.</Notice>}
      {err && <Notice tone="error">{err === "1" ? "Something went wrong. Please try again." : err}</Notice>}
      {error && <Notice tone="error">We couldn&apos;t load the areas. Please refresh.</Notice>}

      <Card title="Add an area">
        <form action={addArea} className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label htmlFor="name" className="text-sm font-medium">Area name</label>
            <input id="name" name="name" required minLength={2} maxLength={60} placeholder="For example, Nhyiaeso" className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label htmlFor="region" className="text-sm font-medium">Region</label>
            <select id="region" name="region" defaultValue="Ashanti" className={`mt-1 ${inputCls}`}>
              {regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button className="rounded-md bg-gold px-5 py-2.5 font-bold hover:bg-gold-deep">Add area</button>
        </form>
      </Card>

      <div className="mt-6">
        <Card title={`All areas (${all.length})`}>
          <form className="mb-4 flex flex-wrap gap-3">
            <label htmlFor="q" className="sr-only">Search areas</label>
            <input id="q" name="q" defaultValue={str(sp.q)} placeholder="Search areas" className={`flex-1 ${inputCls}`} />
            <label htmlFor="rf" className="sr-only">Region</label>
            <select id="rf" name="region" defaultValue={reg} className={inputCls}>
              <option value="">All regions</option>
              {regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button className="rounded-md border border-ink/30 px-4 py-2.5 font-semibold hover:bg-ink/5">Filter</button>
          </form>
          <ul className="divide-y divide-line">
            {rows.map((a, i) => (
              <Fragment key={a.id}>
                {(i === 0 || rows[i - 1].region !== a.region) && (
                  <li className="bg-sand px-3 py-2 text-sm font-semibold" aria-hidden="true">{a.region}</li>
                )}
                <li className="flex items-center justify-between gap-3 py-2.5">
                  <span>{a.name} {!a.is_active && <span className="ml-2 rounded bg-ink/5 px-2 py-0.5 text-sm text-slate">Hidden</span>}</span>
                  <form action={setAreaActive}>
                    <input type="hidden" name="id" value={a.id} />
                    <ConfirmSubmit
                      label={a.is_active ? "Hide" : "Show"}
                      tone={a.is_active ? "danger" : "primary"}
                      name="active"
                      value={a.is_active ? "false" : "true"}
                      title={`${a.is_active ? "Hide" : "Show"} ${a.name}?`}
                      message={a.is_active ? "People won't be able to pick this area. Existing records are kept." : "People will be able to pick this area again."}
                    />
                  </form>
                </li>
              </Fragment>
            ))}
            {rows.length === 0 && <li className="py-3 text-slate">No area matches your search.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}

export default function Page(props: PageProps<"/admin/areas">) {
  return (
    <Suspense fallback={<p className="text-slate">Loading…</p>}>
      <Body {...props} />
    </Suspense>
  );
}
