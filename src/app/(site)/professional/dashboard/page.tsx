import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../../(auth)/actions";

export const metadata = { title: "Professional dashboard | HandyCorp" };

const statuses: Record<string, { label: string; text: string }> = {
  submitted: { label: "Registration submitted", text: "We have your details. We'll review your profile and tell you the next steps." },
  under_review: { label: "Under review", text: "Our team is reviewing your profile. We'll notify you when there's an update." },
  more_info_required: { label: "More information required", text: "We need a little more from you before we can continue." },
  approved: { label: "Approved", text: "Your profile has been approved by HandyCorp." },
  rejected: { label: "Rejected", text: "We couldn't approve your profile this time." },
};

async function Body() {
  const user = await requireRole("professional", "/professional/login", "/professional/dashboard");
  const supabase = await createClient();
  const { data } = await supabase.from("professional_profiles").select("status, status_note").eq("user_id", user.id).maybeSingle();
  if (!data) redirect("/professional/onboarding");
  const s = statuses[data.status] ?? statuses.submitted;
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Hello, {user.fullName.split(" ")[0]}</h1>
      <section className="mt-8 rounded-lg border border-line bg-white p-6">
        <h2 className="text-sm font-medium text-slate">Profile status</h2>
        <p className="mt-1 font-display text-2xl font-bold">{s.label}</p>
        <p className="mt-2 max-w-xl leading-relaxed text-slate">{s.text}</p>
        {data.status_note && <p className="mt-3 border-l-2 border-gold-deep pl-3">{data.status_note}</p>}
        {data.status !== "approved" && (
          <p className="mt-4 text-sm text-slate">Your profile won&apos;t show as verified until HandyCorp approves it.</p>
        )}
      </section>
      <form action={signOut} className="mt-8">
        <button className="rounded-md border border-ink px-6 py-3 font-semibold hover:bg-ink hover:text-paper">Sign out</button>
      </form>
      <p className="mt-6 text-sm text-slate"><Link href="/services" className="underline underline-offset-4">Browse services</Link></p>
    </>
  );
}

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16">
      <Suspense fallback={<p className="text-slate">Loading…</p>}>
        <Body />
      </Suspense>
    </main>
  );
}
