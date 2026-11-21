import { connection } from "next/server";
import { Card, NotConnected, PageHeader } from "@/components/admin/ui";
import { msNow } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Analytics & Reports | HandyCorp Admin" };
const week = 7 * 86_400_000;

function Bars({ rows }: { rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <ul className="space-y-2.5">
      {rows.map(([l, n]) => (
        <li key={l} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-3 text-[15px]">
          <span className="truncate">{l}</span>
          <span className="h-2.5 bg-ink/10"><span className="block h-full bg-ink/70" style={{ width: `${(n / max) * 100}%` }} /></span>
          <span className="text-right tabular-nums">{n}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function Page() {
  await connection();
  const supabase = await createClient();
  const startMs = msNow() - 8 * week;
  const since = new Date(startMs).toISOString();
  const [{ data: cust }, { data: pros }, { data: byCat }] = await Promise.all([
    supabase.from("profiles").select("created_at").eq("role", "customer").gte("created_at", since).limit(5000),
    supabase.from("professional_profiles").select("submitted_at").gte("submitted_at", since).limit(5000),
    supabase.from("professional_profiles").select("status, service_categories(name)").limit(5000),
  ]);
  const start = startMs;
  const buckets = (dates: string[]) => {
    const out = Array(8).fill(0) as number[];
    dates.forEach((d) => { const i = Math.floor((new Date(d).getTime() - start) / week); if (i >= 0 && i < 8) out[i]++; });
    return out.map((n, i): [string, number] => [`Week ${i + 1}`, n]);
  };
  const catCount = new Map<string, number>();
  byCat?.forEach((r) => {
    if (r.status !== "approved") return;
    const c = Array.isArray(r.service_categories) ? r.service_categories[0] : r.service_categories;
    if (c) catCount.set(c.name, (catCount.get(c.name) ?? 0) + 1);
  });

  return (
    <>
      <PageHeader title="Analytics & Reports" text="Only measures we can calculate from real data are shown. The rest appear once bookings and payments exist." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Customer growth" right={<span className="text-sm text-slate">New customers per week, last 8 weeks</span>}>
          <Bars rows={buckets((cust ?? []).map((c) => c.created_at))} />
        </Card>
        <Card title="Professional growth" right={<span className="text-sm text-slate">New registrations per week</span>}>
          <Bars rows={buckets((pros ?? []).map((p) => p.submitted_at))} />
        </Card>
        <Card title="Verified professionals by category">
          {catCount.size === 0 ? <p className="text-slate">No verified professionals yet.</p> : <Bars rows={[...catCount.entries()].sort((a, b) => b[1] - a[1])} />}
        </Card>
        <Card title="Waiting on bookings and payments">
          <NotConnected>Requests by category and location, booking conversion rate, average job value, commission revenue, repeat customer rate, cancellation rate and dispute rate can&apos;t be calculated yet. Each one will be added when the data behind it exists.</NotConnected>
        </Card>
      </div>
    </>
  );
}
