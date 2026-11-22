import Link from "next/link";
import { signOut } from "@/app/(site)/(auth)/actions";

const statuses: Record<string, { label: string; text: string }> = {
  submitted: { label: "Registration submitted", text: "We have your details. We'll review your profile and tell you the next steps." },
  under_review: { label: "Under review", text: "Our team is reviewing your profile. We'll notify you when there's an update." },
  more_info_required: { label: "More information required", text: "We need a little more from you before we can continue." },
  approved: { label: "Approved", text: "Your profile has been approved by HandyCorp." },
  rejected: { label: "Rejected", text: "We couldn't approve your profile this time." },
};

export function StatusCard({ status, note }: { status: string; note: string | null }) {
  const s = statuses[status] ?? statuses.submitted;
  return (
    <section className="rounded-lg border border-line bg-white p-6">
      <h2 className="text-sm font-medium text-slate">Profile status</h2>
      <p className="mt-1 font-display text-2xl font-bold">{s.label}</p>
      <p className="mt-2 max-w-xl leading-relaxed text-slate">{s.text}</p>
      {note && <p className="mt-3 border-l-2 border-gold-deep pl-3">{note}</p>}
      {status !== "approved" && (
        <p className="mt-4 text-sm text-slate">Your profile won&apos;t show as verified until HandyCorp approves it.</p>
      )}
    </section>
  );
}

// The admin's read-only preview of a professional's dashboard.
export default function DashboardView({ firstName, status, note, preview = false }: { firstName: string; status: string; note: string | null; preview?: boolean }) {
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Hello, {firstName}</h1>
      <div className="mt-8"><StatusCard status={status} note={note} /></div>
      {!preview && (
        <>
          <form action={signOut} className="mt-8">
            <button className="rounded-md border border-ink px-6 py-3 font-semibold hover:bg-ink hover:text-paper">Sign out</button>
          </form>
          <p className="mt-6 text-sm text-slate"><Link href="/services" className="underline underline-offset-4">Browse services</Link></p>
        </>
      )}
    </>
  );
}
