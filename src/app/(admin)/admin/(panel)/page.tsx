import Link from "next/link";
import { connection } from "next/server";
import { Icon } from "@/components/admin/icons";
import { BookingActivity, RevenueChart } from "@/components/admin/SampleCharts";
import { Card, NotConnected, PageHeader, SampleTag, StatusBadge } from "@/components/admin/ui";
import { actionLabels, daysAgoISO, fmtDate, fmtDateTime } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Overview | HandyCorp Admin" };

export default async function Page() {
  await connection();
  const supabase = await createClient();
  const d30 = daysAgoISO(30);
  const d60 = daysAgoISO(60);
  const count = { count: "exact" as const, head: true };

  const [cust, cust30, custPrev, active, pending, regs, audit, pros] = await Promise.all([
    supabase.from("profiles").select("id", count).eq("role", "customer"),
    supabase.from("profiles").select("id", count).eq("role", "customer").gte("created_at", d30),
    supabase.from("profiles").select("id", count).eq("role", "customer").gte("created_at", d60).lt("created_at", d30),
    supabase.from("professional_profiles").select("user_id", count).eq("status", "approved"),
    supabase.from("professional_profiles").select("user_id", count).in("status", ["submitted", "under_review"]),
    supabase.from("professional_profiles").select("user_id, display_name, status, submitted_at, profiles(full_name)").order("submitted_at", { ascending: false }).limit(6),
    supabase.from("admin_audit_log").select("id, action, created_at, profiles(full_name)").order("created_at", { ascending: false }).limit(6),
    supabase.from("professional_profiles").select("user_id", count),
  ]);

  const c30 = cust30.count ?? 0;
  const cPrev = custPrev.count ?? 0;
  const delta = c30 - cPrev;
  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

  const stat = (icon: string, title: string, value: string, note: string, muted = false) => (
    <div className="rounded-md border border-line bg-white p-5 shadow-[0_1px_0_rgba(23,23,27,0.04)]">
      <div className="flex items-center justify-between text-slate">
        <p className="text-[15px]">{title}</p>
        <Icon name={icon} size={18} />
      </div>
      <p className={`mt-2 font-display text-3xl font-bold tabular-nums ${muted ? "text-slate/60" : ""}`}>{value}</p>
      <p className="mt-1 text-sm text-slate">{note}</p>
    </div>
  );

  return (
    <>
      <PageHeader title="Overview" text="Here's what's happening across HandyCorp." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stat("customers", "Total Customers", String(cust.count ?? 0), `${c30} joined in the last 30 days (${delta >= 0 ? "+" : ""}${delta} vs the 30 days before)`)}
        {stat("professionals", "Active Professionals", String(active.count ?? 0), `${pros.count ?? 0} registered in total`)}
        {stat("requests", "Total Service Requests", "—", "Starts counting when booking opens", true)}
        {stat("bookings", "Completed Bookings", "—", "Starts counting when booking opens", true)}
        {stat("payments", "Platform Revenue", "—", "Starts counting when payments are connected", true)}
        {stat("staff", "Pending Verifications", String(pending.count ?? 0), (pending.count ?? 0) > 0 ? "Waiting for a decision" : "Nothing waiting")}
      </div>

      <section aria-labelledby="attention" className="mt-6 rounded-md border border-gold-deep bg-[#fff9e8] p-5">
        <h2 id="attention" className="font-display text-base font-bold">Needs your attention</h2>
        <ul className="mt-3 grid gap-x-8 gap-y-2 text-[15px] sm:grid-cols-2">
          <li className="flex justify-between gap-4">
            <Link href="/admin/professionals?status=submitted" className="underline underline-offset-4">Professionals awaiting verification</Link>
            <strong>{pending.count ?? 0}</strong>
          </li>
          {["Unresolved disputes", "Failed payments", "Customer complaints", "Pending refunds"].map((l) => (
            <li key={l} className="flex justify-between gap-4 text-slate"><span>{l}</span><span>Not connected</span></li>
          ))}
        </ul>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Revenue overview" right={<SampleTag />} className="xl:col-span-2">
          <RevenueChart />
          <p className="mt-3 text-sm text-slate">Sample figures to show the layout. Real revenue appears here once customers can book and pay.</p>
        </Card>
        <Card title="Booking activity" right={<SampleTag />}>
          <BookingActivity />
          <p className="mt-4 text-sm text-slate">Sample figures. Not real bookings.</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Recent professional registrations" right={<Link href="/admin/professionals" className="text-sm underline underline-offset-4">View all</Link>}>
          {!regs.data?.length ? (
            <NotConnected>No registrations yet.</NotConnected>
          ) : (
            <ul className="divide-y divide-line">
              {regs.data.map((r) => (
                <li key={r.user_id}>
                  <Link href={`/admin/professionals/${r.user_id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-ink/[0.03]">
                    <span>
                      <span className="block text-[15px] font-medium">{r.display_name || one(r.profiles)?.full_name}</span>
                      <span className="block text-sm text-slate">{fmtDate(r.submitted_at)}</span>
                    </span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Recent admin actions" right={<Link href="/admin/staff" className="text-sm underline underline-offset-4">Audit log</Link>}>
          {!audit.data?.length ? (
            <NotConnected>No admin actions recorded yet.</NotConnected>
          ) : (
            <ul className="divide-y divide-line">
              {audit.data.map((a) => (
                <li key={a.id} className="py-2.5">
                  <p className="text-[15px] font-medium">{actionLabels[a.action] ?? a.action}</p>
                  <p className="text-sm text-slate">{one(a.profiles)?.full_name ?? "Unknown"} · {fmtDateTime(a.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
