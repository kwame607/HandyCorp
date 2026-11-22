import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { Empty, inputCls, Notice, PageHeader } from "@/components/admin/ui";
import { fmtDate, str } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { decideWorkRequest } from "../../../actions";

export const metadata = { title: "Work requests | HandyCorp Admin" };

type Row = {
  id: string; status: string; reason: string; admin_note: string | null; requested_name: string | null; created_at: string; decided_at: string | null; user_id: string;
  services: { name: string } | { name: string }[] | null;
  service_categories: { name: string } | { name: string }[] | null;
  professional_profiles: { display_name: string | null; profiles: { full_name: string } | { full_name: string }[] | null } | { display_name: string | null; profiles: { full_name: string } | { full_name: string }[] | null }[] | null;
};
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

async function Body({ searchParams }: PageProps<"/admin/professionals/requests">) {
  await connection();
  const sp = await searchParams;
  const history = str(sp.view) === "history";
  const supabase = await createClient();
  let q = supabase
    .from("professional_service_requests")
    .select("id, status, reason, admin_note, requested_name, created_at, decided_at, user_id, services(name), service_categories(name), professional_profiles!professional_service_requests_user_id_fkey(display_name, profiles(full_name))")
    .order("created_at", { ascending: history ? false : true })
    .limit(50);
  q = history ? q.neq("status", "pending") : q.eq("status", "pending");
  const { data, error } = await q;
  if (error) console.error("[admin] work requests load failed:", error.code || "no code");
  const rows = (data ?? []) as unknown as Row[];
  const err = str(sp.error);

  return (
    <>
      <PageHeader title="Work requests" text="Professionals asking to add a service to their name." />
      <div className="mb-5 flex gap-2 text-[15px]">
        <Link href="/admin/professionals/requests" className={`rounded-md px-4 py-2 font-semibold ${!history ? "bg-ink text-paper" : "border border-ink/30"}`}>Waiting</Link>
        <Link href="/admin/professionals/requests?view=history" className={`rounded-md px-4 py-2 font-semibold ${history ? "bg-ink text-paper" : "border border-ink/30"}`}>Decided</Link>
      </div>
      {sp.saved && <Notice tone="ok">Decision saved.</Notice>}
      {err && <Notice tone="error">{err === "1" ? "Something went wrong. Please try again." : err}</Notice>}
      {error && <Notice tone="error">We couldn&apos;t load the requests. Please refresh.</Notice>}
      {rows.length === 0 ? (
        <Empty title={history ? "Nothing decided yet" : "No requests waiting"} text={history ? "Approved and declined requests will show here." : "New requests from professionals appear here."} />
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => {
            const pp = one(r.professional_profiles);
            const who = pp?.display_name || one(pp?.profiles ?? null)?.full_name || "Professional";
            const svc = one(r.services)?.name;
            const cat = one(r.service_categories)?.name;
            return (
              <li key={r.id} className="rounded-md border border-line bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-base font-bold">{svc ?? r.requested_name}{!svc && <span className="font-normal text-slate"> (not in the list{cat ? `, closest: ${cat}` : ""})</span>}</p>
                    <p className="text-sm text-slate">From <Link href={`/admin/professionals/${r.user_id}`} className="underline underline-offset-4">{who}</Link> · {fmtDate(r.created_at)}</p>
                  </div>
                  {history && <span className="rounded bg-ink/5 px-2 py-0.5 text-sm font-medium">{r.status === "approved" ? "Approved" : "Declined"}{r.decided_at ? ` ${fmtDate(r.decided_at)}` : ""}</span>}
                </div>
                <p className="mt-3 whitespace-pre-line text-[15px]">{r.reason}</p>
                {history && r.admin_note && <p className="mt-3 border-l-2 border-gold-deep pl-3 text-[15px]">{r.admin_note}</p>}
                {!history && (
                  <form action={decideWorkRequest} className="mt-4 space-y-3">
                    <input type="hidden" name="id" value={r.id} />
                    <div>
                      <label htmlFor={`note-${r.id}`} className="text-sm font-medium">Note to the professional <span className="font-normal text-slate">(required to decline)</span></label>
                      <textarea id={`note-${r.id}`} name="note" rows={2} maxLength={500} className={`mt-1 ${inputCls}`} />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <ConfirmSubmit label="Approve" title="Approve this request?" message={svc ? `${svc} will be added to ${who}'s services.` : "This records the request as approved. A suggested service must still be added to the catalogue by you."} name="decision" value="approved" tone="primary" />
                      <ConfirmSubmit label="Decline" title="Decline this request?" message={`${who} will see your note.`} name="decision" value="declined" tone="danger" requires="note" />
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/admin/professionals/requests">) {
  return (
    <Suspense fallback={<p className="text-slate">Loading…</p>}>
      <Body {...props} />
    </Suspense>
  );
}
