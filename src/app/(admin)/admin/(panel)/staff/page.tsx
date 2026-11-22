import { connection } from "next/server";
import { Suspense } from "react";
import { Card, Empty, NotConnected, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { type AdminRow, actionLabels, fmtDateTime } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Staff & Permissions | HandyCorp Admin" };
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

const roles = [
  ["Super Administrator", "Everything, including staff and critical settings."],
  ["Operations Manager", "Customers, professionals, requests and bookings."],
  ["Verification Officer", "Review professional documents and verification decisions."],
  ["Customer Support", "Complaints, disputes and messages."],
  ["Finance Officer", "Payment records and permitted financial actions."],
];

async function Body() {
  await connection();
  const supabase = await createClient();
  const [{ data: admins }, { data: log }] = await Promise.all([
    supabase.rpc("admin_list_admins"),
    supabase.from("admin_audit_log").select("id, action, target_type, target_id, detail, created_at, profiles(full_name)").order("created_at", { ascending: false }).limit(50),
  ]);
  return (
    <>
      <PageHeader title="Staff & Permissions" text="Who can use the admin panel, and a record of what they did." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Administrators">
          {!admins?.length ? <p className="text-slate">None.</p> : (
            <ul className="divide-y divide-line">
              {(admins as AdminRow[]).map((a) => (
                <li key={a.id} className="py-2.5">
                  <p className="font-medium">{a.full_name}</p>
                  <p className="break-all text-sm text-slate">{a.email} · last signed in {fmtDateTime(a.last_sign_in_at)}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm text-slate">To add an administrator, turn on <code>is_admin</code> for their row in the <code>profiles</code> table in Supabase. They can keep any customer or professional role too. Admin sign-up is never public.</p>
        </Card>
        <Card title="Roles (planned)">
          <NotConnected>Today every administrator has full access. Role-based permissions are the next step before you add other staff.</NotConnected>
          <ul className="mt-4 divide-y divide-line">
            {roles.map(([n, d]) => <li key={n} className="py-2"><p className="font-medium">{n}</p><p className="text-sm text-slate">{d}</p></li>)}
          </ul>
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

export default function Page() {
  return (
    <Suspense fallback={<p className="text-slate">Loading…</p>}>
      <Body />
    </Suspense>
  );
}
