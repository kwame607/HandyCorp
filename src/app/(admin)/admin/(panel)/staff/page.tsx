import { requirePermission } from "@/lib/auth";
import { connection } from "next/server";
import { Suspense } from "react";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { Card, Empty, inputCls, Notice, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { setStaffRole } from "../../actions";
import { type AdminRow, actionLabels, fmtDateTime, str } from "@/lib/admin";
import { roleLabel, staffRoles } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Staff & Permissions | HandyCorp Admin" };
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

async function Body({ searchParams }: PageProps<"/admin/staff">) {
  await connection();
  await requirePermission("staff.manage", "/admin/staff");
  const sp = await searchParams;
  const err = str(sp.error);
  const supabase = await createClient();
  const [{ data: admins }, { data: log }] = await Promise.all([
    supabase.rpc("admin_list_admins"),
    supabase.from("admin_audit_log").select("id, action, target_type, target_id, detail, created_at, profiles(full_name)").order("created_at", { ascending: false }).limit(50),
  ]);
  return (
    <>
      <PageHeader title="Staff & Permissions" text="Who can use the admin panel, what each person may do, and a record of what they did." />
      {sp.saved && <Notice tone="ok">Saved.</Notice>}
      {err && <Notice tone="error">{err === "1" ? "Something went wrong. Please try again." : err}</Notice>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Staff">
          {!admins?.length ? <p className="text-slate">None.</p> : (
            <ul className="divide-y divide-line">
              {(admins as AdminRow[]).map((a) => (
                <li key={a.id} className="py-3">
                  <p className="font-medium">{a.full_name} <span className="ml-1 rounded bg-ink/5 px-2 py-0.5 text-sm font-normal">{roleLabel(a.staff_role)}</span></p>
                  <p className="break-all text-sm text-slate">{a.email} · last signed in {fmtDateTime(a.last_sign_in_at)}</p>
                  <form action={setStaffRole} className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="email" value={a.email} />
                    <label htmlFor={`r-${a.id}`} className="sr-only">Role for {a.full_name}</label>
                    <select id={`r-${a.id}`} name="role" defaultValue={a.staff_role} className={`w-auto ${inputCls}`}>
                      {staffRoles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <button className="rounded-md border border-ink/30 px-3 py-2 text-[15px] font-semibold hover:bg-ink/5">Change role</button>
                    <ConfirmSubmit label="Remove access" tone="danger" name="remove" value="1" title={`Remove ${a.full_name}'s admin access?`} message="They will no longer be able to open the admin panel. Their customer or professional account stays." />
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={setStaffRole} className="mt-6 space-y-3 border-t border-line pt-5">
            <h3 className="font-display text-base font-bold">Give someone a role</h3>
            <p className="text-sm text-slate">They must already have a HandyCorp account. Admin sign-up is never public. You can&apos;t change your own role.</p>
            <div>
              <label htmlFor="email" className="text-sm font-medium">Their account email</label>
              <input id="email" name="email" type="email" required className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <label htmlFor="role" className="text-sm font-medium">Role</label>
              <select id="role" name="role" defaultValue="customer_support" className={`mt-1 ${inputCls}`}>
                {staffRoles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <button className="rounded-md bg-gold px-5 py-2.5 font-bold hover:bg-gold-deep">Give role</button>
          </form>
        </Card>
        <Card title="What each role can do">
          <ul className="divide-y divide-line">
            {staffRoles.map((r) => <li key={r.value} className="py-2.5"><p className="font-medium">{r.label}</p><p className="text-sm text-slate">{r.text}</p></li>)}
          </ul>
          <p className="mt-3 text-sm text-slate">These limits are enforced by the database, not just hidden in the menu.</p>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 font-display text-xl font-bold">Audit log</h2>
      {!log?.length ? (
        <Empty title="Nothing recorded yet" text="Verification decisions, suspensions and category changes appear here." />
      ) : (
        <Table>
          <thead className="border-b border-line bg-ink/[0.03]"><tr><Th>When</Th><Th>Who</Th><Th>Action</Th><Th>Details</Th></tr></thead>
          <tbody className="divide-y divide-line">
            {log.map((a) => {
              const d = a.detail as Record<string, string> | null;
              const bits = [d?.from && d?.to ? `${d.from} → ${d.to}` : "", d?.name, d?.note, d?.reason].filter(Boolean).join(" · ");
              return (
                <tr key={a.id}>
                  <Td className="whitespace-nowrap">{fmtDateTime(a.created_at)}</Td>
                  <Td>{one(a.profiles)?.full_name ?? "Unknown"}</Td>
                  <Td>{actionLabels[a.action] ?? a.action}</Td>
                  <Td className="break-words text-slate">{bits || "—"}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/admin/staff">) {
  return (
    <Suspense fallback={<p className="text-slate">Loading…</p>}>
      <Body {...props} />
    </Suspense>
  );
}
