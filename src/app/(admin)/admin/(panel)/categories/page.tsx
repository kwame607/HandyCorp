import { Suspense } from "react";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { Card, inputCls, Notice, PageHeader } from "@/components/admin/ui";
import { str } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { addService, createCategory, setCategoryActive, setServiceActive, updateCategory } from "../../actions";

export const metadata = { title: "Service Categories | HandyCorp Admin" };

async function Body({ searchParams }: PageProps<"/admin/categories">) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: cats }, { data: svcs }, { data: counts }] = await Promise.all([
    supabase.from("service_categories").select("id, name, summary, description, is_active").order("sort_order"),
    supabase.from("services").select("id, category_id, name, is_active").order("sort_order"),
    supabase.from("professional_profiles").select("main_category_id"),
  ]);
  const inUse = new Map<string, number>();
  counts?.forEach((c) => inUse.set(c.main_category_id, (inUse.get(c.main_category_id) ?? 0) + 1));

  return (
    <>
      <PageHeader title="Service Categories" text="Manage the categories and services professionals can register for. Items are deactivated, never deleted, so existing records stay intact." />
      <Notice tone="info">Changes here update the public website and the registration form within moments. A category appears on the website once it has at least one active service.</Notice>
      {sp.saved && <Notice tone="ok">Saved.</Notice>}
      {sp.error && <Notice tone="error">{str(sp.error) === "1" ? "Something went wrong." : str(sp.error)}</Notice>}

      <Card title="Add a category" className="mb-6">
        <form action={createCategory} className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto]">
          <div><label htmlFor="new-name" className="text-sm font-medium">Name</label><input id="new-name" name="name" required minLength={2} maxLength={80} className={`mt-1 ${inputCls}`} /></div>
          <div><label htmlFor="new-summary" className="text-sm font-medium">Short summary</label><input id="new-summary" name="summary" maxLength={200} className={`mt-1 ${inputCls}`} /></div>
          <div className="flex items-end"><button className="rounded-md bg-gold px-5 py-2.5 font-bold hover:bg-gold-deep">Add category</button></div>
        </form>
      </Card>

      <div className="space-y-6">
        {cats?.map((c) => {
          const list = svcs?.filter((s) => s.category_id === c.id) ?? [];
          return (
            <Card key={c.id} title={c.name} right={<span className={`rounded px-2 py-0.5 text-[13px] font-medium ${c.is_active ? "bg-[#e8f3ec] text-[#1f5c36]" : "bg-ink/5 text-slate"}`}>{c.is_active ? "Active" : "Inactive"}</span>}>
              <p className="mb-4 text-sm text-slate">{inUse.get(c.id) ?? 0} registered professionals use this as their main category.</p>

              <ul className="mb-5 divide-y divide-line border-y border-line">
                {list.map((s) => (
                  <li key={s.id} className={`flex items-center justify-between gap-3 py-2 ${s.is_active ? "" : "text-slate"}`}>
                    <span>{s.name}{!s.is_active && <span className="ml-2 text-sm">(inactive)</span>}</span>
                    <form action={setServiceActive}>
                      <input type="hidden" name="id" value={s.id} />
                      <ConfirmSubmit
                        label={s.is_active ? "Deactivate" : "Activate"}
                        tone="plain"
                        name="active"
                        value={s.is_active ? "false" : "true"}
                        title={`${s.is_active ? "Deactivate" : "Activate"} “${s.name}”?`}
                        message={s.is_active ? "Professionals will no longer be able to register for this service." : "Professionals will be able to register for this service again."}
                      />
                    </form>
                  </li>
                ))}
                {list.length === 0 && <li className="py-3 text-slate">No services yet.</li>}
              </ul>

              <form action={addService} className="mb-5 flex flex-wrap items-end gap-3">
                <input type="hidden" name="category" value={c.id} />
                <div className="min-w-48 flex-1">
                  <label htmlFor={`svc-${c.id}`} className="text-sm font-medium">Add a service to {c.name}</label>
                  <input id={`svc-${c.id}`} name="name" required minLength={2} maxLength={80} className={`mt-1 ${inputCls}`} />
                </div>
                <div className="min-w-48 flex-1">
                  <label htmlFor={`kw-${c.id}`} className="text-sm font-medium">Search words <span className="font-normal text-slate">(optional)</span></label>
                  <input id={`kw-${c.id}`} name="keywords" maxLength={300} placeholder="plumber, pipes, leak" className={`mt-1 ${inputCls}`} />
                </div>
                <button className="rounded-md border border-ink/30 px-4 py-2.5 text-[15px] font-semibold hover:bg-ink/5">Add service</button>
              </form>

              <details className="border-t border-line pt-4">
                <summary className="cursor-pointer text-[15px] font-semibold">Edit category details</summary>
                <form action={updateCategory} className="mt-4 space-y-3">
                  <input type="hidden" name="id" value={c.id} />
                  <div><label htmlFor={`n-${c.id}`} className="text-sm font-medium">Name</label><input id={`n-${c.id}`} name="name" defaultValue={c.name} required minLength={2} maxLength={80} className={`mt-1 ${inputCls}`} /></div>
                  <div><label htmlFor={`s-${c.id}`} className="text-sm font-medium">Summary</label><input id={`s-${c.id}`} name="summary" defaultValue={c.summary} maxLength={200} className={`mt-1 ${inputCls}`} /></div>
                  <div><label htmlFor={`d-${c.id}`} className="text-sm font-medium">Description</label><textarea id={`d-${c.id}`} name="description" defaultValue={c.description} rows={3} maxLength={1000} className={`mt-1 ${inputCls}`} /></div>
                  <button className="rounded-md bg-ink px-4 py-2.5 text-[15px] font-semibold text-paper hover:bg-ink/85">Save changes</button>
                </form>
                <form action={setCategoryActive} className="mt-4">
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmSubmit
                    label={c.is_active ? "Deactivate category" : "Activate category"}
                    tone={c.is_active ? "danger" : "primary"}
                    name="active"
                    value={c.is_active ? "false" : "true"}
                    title={`${c.is_active ? "Deactivate" : "Activate"} “${c.name}”?`}
                    message={c.is_active ? "Professionals will no longer be able to register in this category. Existing records are kept." : "Professionals will be able to register in this category again."}
                  />
                </form>
              </details>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export default function Page(props: PageProps<"/admin/categories">) {
  return (
    <Suspense fallback={<p className="text-slate">Loading…</p>}>
      <Body {...props} />
    </Suspense>
  );
}
