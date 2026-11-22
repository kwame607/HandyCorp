import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { Card, NotConnected, Notice, PageHeader, StatusBadge } from "@/components/admin/ui";
import { actionLabels, fmtDate, fmtDateTime, str } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { setAccountStatus } from "../../../actions";

export const metadata = { title: "Customer | HandyCorp Admin" };

async function Body({ params, searchParams }: PageProps<"/admin/customers/[id]">) {
  await connection();
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: p }, { data: u }, { data: log }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone, status, role, created_at").eq("id", id).maybeSingle(),
    supabase.rpc("admin_get_user", { p_id: id }),
    supabase.from("admin_audit_log").select("id, action, detail, created_at, profiles(full_name)").eq("target_id", id).order("created_at", { ascending: false }).limit(10),
  ]);
  if (!p || p.role !== "customer") notFound();
  const email = u?.[0];
  const suspended = p.status === "suspended";
  const row = (l: string, v: React.ReactNode) => (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between"><dt className="text-slate">{l}</dt><dd>{v}</dd></div>
  );

  return (
    <>
      <Link href="/admin/customers" className="text-[15px] underline underline-offset-4">All customers</Link>
      <div className="mt-3"><PageHeader title={p.full_name} actions={<StatusBadge status={p.status} />} /></div>
      {sp.saved && <Notice tone="ok">Saved.</Notice>}
      {sp.error && <Notice tone="error">{str(sp.error) === "1" ? "Something went wrong." : str(sp.error)}</Notice>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Profile" className="lg:col-span-2">
          <dl className="divide-y divide-line">
            {row("Email", email?.email ?? "Unavailable")}
            {row("Phone", p.phone ?? "Not given")}
            {row("Registered", fmtDate(p.created_at))}
            {row("Last signed in", fmtDateTime(email?.last_sign_in_at))}
            {row("Total requests", "0")}
            {row("Completed bookings", "0")}
          </dl>
        </Card>
        <Card title={suspended ? "Reactivate account" : "Suspend account"}>
          <form action={setAccountStatus} className="space-y-4">
            <input type="hidden" name="id" value={id} />
            {suspended ? (
              <>
                <p className="text-[15px] leading-relaxed text-slate">This customer can&apos;t sign in. Reactivating lets them use their account again.</p>
                <ConfirmSubmit label="Reactivate account" tone="primary" name="status" value="active" title="Reactivate this account?" message={`${p.full_name} will be able to sign in again.`} />
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="reason" className="text-sm font-medium">Reason</label>
                  <textarea id="reason" name="reason" rows={3} maxLength={500} className="mt-1 w-full rounded-md border border-ink/25 bg-white px-3 py-2.5 text-[15px]" />
                  <p className="mt-1 text-sm text-slate">Recorded in the audit log.</p>
                </div>
                <ConfirmSubmit label="Suspend account" tone="danger" name="status" value="suspended" requires="reason" title="Suspend this account?" message={`${p.full_name} will be signed out and won't be able to sign in until you reactivate the account.`} />
              </>
            )}
          </form>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {["Request history", "Booking history", "Reviews submitted", "Reported issues"].map((t) => (
          <Card key={t} title={t}><NotConnected>Nothing to show yet. This fills in once customers can send requests and book.</NotConnected></Card>
        ))}
      </div>

      <Card title="Admin actions on this account" className="mt-6">
        {!log?.length ? (
          <p className="text-slate">None recorded.</p>
        ) : (
          <ul className="divide-y divide-line">
            {log.map((a) => {
              const who = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
              const reason = (a.detail as { reason?: string } | null)?.reason;
              return (
                <li key={a.id} className="py-2.5 text-[15px]">
                  <p className="font-medium">{actionLabels[a.action] ?? a.action}</p>
                  <p className="text-sm text-slate">{who?.full_name ?? "Unknown"} · {fmtDateTime(a.created_at)}</p>
                  {reason && <p className="mt-1 border-l-2 border-gold-deep pl-3">{reason}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}

export default function Page(props: PageProps<"/admin/customers/[id]">) {
  return (
    <Suspense fallback={<p className="text-slate">Loading…</p>}>
      <Body {...props} />
    </Suspense>
  );
}
