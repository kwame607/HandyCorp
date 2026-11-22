import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { StatusCard } from "@/components/professional/DashboardView";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Overview | HandyCorp" };

const box = "rounded-md border border-line bg-white p-5";

async function Body() {
  await connection();
  const user = await requireRole("professional", "/professional/login", "/professional/dashboard");
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };
  const [{ data: pp }, { data: docs }, svc, pending, areas] = await Promise.all([
    supabase.from("professional_profiles").select("status, status_note, description").eq("user_id", user.id).maybeSingle(),
    supabase.from("professional_documents").select("kind").eq("user_id", user.id),
    supabase.from("professional_services").select("service_id", head).eq("user_id", user.id),
    supabase.from("professional_service_requests").select("id", head).eq("user_id", user.id).eq("status", "pending"),
    supabase.from("professional_areas").select("area_id", head).eq("user_id", user.id),
  ]);
  if (!pp) return null;
  const has = (k: string) => (docs ?? []).some((d) => d.kind === k);
  const checklist = [
    ["Describe your work", (pp.description ?? "").length >= 20, "/professional/profile"],
    ["Add a profile photo", has("profile_photo"), "/professional/profile"],
    ["Show photos of your work", has("portfolio"), "/professional/profile"],
    ["Add a certificate or qualification", has("certificate"), "/professional/profile"],
    ["Choose the areas you cover", (areas.count ?? 0) > 0, "/professional/profile"],
  ] as const;
  const done = checklist.filter((c) => c[1]).length;

  const stat = (title: string, value: string, note: string, muted = false) => (
    <div className={box}>
      <p className="text-[15px] text-slate">{title}</p>
      <p className={`mt-2 font-display text-3xl font-bold tabular-nums ${muted ? "text-slate/60" : ""}`}>{value}</p>
      <p className="mt-1 text-sm text-slate">{note}</p>
    </div>
  );

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Hello, {user.fullName.split(" ")[0]}</h1>
      <p className="mt-1 text-slate">Here&apos;s where your HandyCorp profile stands.</p>

      <div className="mt-6"><StatusCard status={pp.status} note={pp.status_note} /></div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stat("Upcoming bookings", "—", "Shows here once customers can book you", true)}
        {stat("Rating", "—", "Appears after your first review", true)}
        {stat("Earnings", "—", "Appears once payments are connected", true)}
        {stat("Services you offer", String(svc.count ?? 0), "Approved by HandyCorp")}
        {stat("Requests for more work", String(pending.count ?? 0), (pending.count ?? 0) > 0 ? "Waiting for a reply" : "None waiting")}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className={box}>
          <h2 className="font-display text-base font-bold">Strengthen your profile</h2>
          <p className="mt-1 text-sm text-slate">{done} of {checklist.length} done. A complete profile with real photos of your work earns customers&apos; trust.</p>
          <ul className="mt-4 divide-y divide-line">
            {checklist.map(([label, ok, href]) => (
              <li key={label} className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
                <span><span aria-hidden="true" className={ok ? "text-[#1f5c36]" : "text-slate"}>{ok ? "✓ " : "• "}</span>{label}<span className="sr-only">{ok ? " (done)" : " (not done)"}</span></span>
                {!ok && <Link href={href} className="text-sm font-semibold underline underline-offset-4">Add</Link>}
              </li>
            ))}
          </ul>
        </section>
        <section className={box}>
          <h2 className="font-display text-base font-bold">Want more work?</h2>
          <p className="mt-2 leading-relaxed text-slate">Ask to add another service to your name, or suggest one we don&apos;t list yet. HandyCorp reviews each request.</p>
          <Link href="/professional/services#request" className="mt-4 inline-block rounded-md bg-gold px-5 py-3 font-bold hover:bg-gold-deep">Request more work</Link>
        </section>
      </div>
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
