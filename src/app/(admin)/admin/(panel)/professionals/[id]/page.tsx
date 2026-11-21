import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { Card, NotConnected, Notice, PageHeader, StatusBadge } from "@/components/admin/ui";
import { actionLabels, fmtDate, fmtDateTime, str } from "@/lib/admin";
import { experienceOptions } from "@/lib/professional-application";
import { createClient } from "@/lib/supabase/server";
import { setAccountStatus, setProfessionalStatus } from "../../../actions";

export const metadata = { title: "Professional | HandyCorp Admin" };

const kindLabel: Record<string, string> = { profile_photo: "Profile photo", portfolio: "Work photo", certificate: "Certificate" };
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

async function Body({ params, searchParams }: PageProps<"/admin/professionals/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();

  const [{ data: r }, { data: svc }, { data: ar }, { data: docs }, { data: u }, { data: log }] = await Promise.all([
    supabase.from("professional_profiles").select("*, profiles(full_name, phone, status), service_categories(name)").eq("user_id", id).maybeSingle(),
    supabase.from("professional_services").select("services(name)").eq("user_id", id),
    supabase.from("professional_areas").select("areas(name)").eq("user_id", id),
    supabase.from("professional_documents").select("kind, storage_path, file_name").eq("user_id", id).order("created_at"),
    supabase.rpc("admin_get_user", { p_id: id }),
    supabase.from("admin_audit_log").select("id, action, detail, created_at, profiles(full_name)").eq("target_id", id).order("created_at", { ascending: false }).limit(20),
  ]);
  if (!r) notFound();

  const paths = (docs ?? []).map((d) => d.storage_path);
  const { data: signed } = paths.length ? await supabase.storage.from("professional-uploads").createSignedUrls(paths, 600) : { data: [] };
  const urlFor = (p: string) => signed?.find((s) => s.path === p)?.signedUrl;

  const person = one(r.profiles);
  const cat = one(r.service_categories);
  const email = u?.[0];
  const suspended = person?.status === "suspended";
  const name = r.display_name || person?.full_name || "Professional";
  const row = (label: string, value: string | null | undefined) => (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-slate">{label}</dt>
      <dd className="break-words sm:max-w-[65%] sm:text-right">{value || "Not given"}</dd>
    </div>
  );

  return (
    <>
      <Link href="/admin/professionals" className="text-[15px] underline underline-offset-4">All professionals</Link>
      <div className="mt-3">
        <PageHeader title={name} actions={<div className="flex gap-2"><StatusBadge status={r.status} />{suspended && <StatusBadge status="suspended" />}</div>} />
      </div>
      {sp.saved && <Notice tone="ok">Saved.</Notice>}
      {sp.error && <Notice tone="error">{str(sp.error) === "1" ? "Something went wrong." : str(sp.error)}</Notice>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Registration details">
            <dl className="divide-y divide-line">
              {row("Full name", person?.full_name)}
              {row("Email", email?.email)}
              {row("Phone", person?.phone)}
              {row("Main category", cat?.name)}
              {row("Services", (svc ?? []).map((s) => one(s.services)?.name).filter(Boolean).join(", "))}
              {row("About their work", r.description)}
              {row("Experience", experienceOptions.find((o) => o.value === r.experience)?.label)}
              {row("Location", `${r.area}, ${r.city}, ${r.region}`)}
              {row("Work address", r.work_address)}
              {row("Areas covered", (ar ?? []).map((a) => one(a.areas)?.name).filter(Boolean).join(", "))}
              {row("Additional experience", r.extra_experience)}
              {row("Registered", fmtDateTime(r.submitted_at))}
              {row("Last signed in", fmtDateTime(email?.last_sign_in_at))}
            </dl>
          </Card>

          <Card title="Uploaded files">
            {!docs?.length ? (
              <p className="text-slate">No files uploaded.</p>
            ) : (
              <ul className="divide-y divide-line">
                {docs.map((d) => {
                  const url = urlFor(d.storage_path);
                  return (
                    <li key={d.storage_path} className="flex items-center justify-between gap-4 py-3">
                      <span>
                        <span className="block font-medium">{kindLabel[d.kind] ?? d.kind}</span>
                        <span className="block break-all text-sm text-slate">{d.file_name}</span>
                      </span>
                      {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 font-semibold underline underline-offset-4">Open</a> : <span className="text-sm text-slate">Unavailable</span>}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-3 text-sm text-slate">Files are private. Links last 10 minutes, then reload the page for new ones.</p>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            {["Booking history", "Ratings and reviews", "Reported issues"].map((t) => (
              <Card key={t} title={t}><NotConnected>Nothing yet. Fills in once bookings and reviews exist.</NotConnected></Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card title="Verification decision">
            <form action={setProfessionalStatus} className="space-y-4">
              <input type="hidden" name="id" value={id} />
              <p className="text-[15px] text-slate">Current: <strong className="text-ink">{r.status === "approved" ? "Verified" : r.status === "submitted" ? "Pending verification" : r.status.replace(/_/g, " ")}</strong>. The verified badge shows only after you approve.</p>
              <div>
                <label htmlFor="note" className="text-sm font-medium">Message to the professional</label>
                <textarea id="note" name="note" rows={3} maxLength={500} defaultValue={r.status_note ?? ""} className="mt-1 w-full rounded-md border border-ink/25 bg-white px-3 py-2.5 text-[15px]" />
                <p className="mt-1 text-sm text-slate">Required to reject or ask for more information. They see it on their dashboard.</p>
              </div>
              <div className="flex flex-col items-stretch gap-2">
                <ConfirmSubmit label="Approve and verify" tone="primary" name="status" value="approved" title="Verify this professional?" message={`${name} will be marked as verified.`} />
                <ConfirmSubmit label="Request more information" tone="plain" name="status" value="more_info_required" requires="note" title="Ask for more information?" message="Your message will be shown on their dashboard." />
                <ConfirmSubmit label="Reject" tone="danger" name="status" value="rejected" requires="note" title="Reject this registration?" message="They will see your reason on their dashboard." />
                {r.status !== "under_review" && <button name="status" value="under_review" className="rounded-md border border-ink/30 px-4 py-2.5 text-[15px] font-semibold hover:bg-ink/5">Mark as under review</button>}
              </div>
            </form>
          </Card>

          <Card title={suspended ? "Reactivate account" : "Suspend account"}>
            <form action={setAccountStatus} className="space-y-4">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="back" value="professional" />
              {suspended ? (
                <ConfirmSubmit label="Reactivate account" tone="primary" name="status" value="active" title="Reactivate this account?" message={`${name} will be able to sign in again.`} />
              ) : (
                <>
                  <div>
                    <label htmlFor="reason" className="text-sm font-medium">Reason</label>
                    <textarea id="reason" name="reason" rows={2} maxLength={500} className="mt-1 w-full rounded-md border border-ink/25 bg-white px-3 py-2.5 text-[15px]" />
                  </div>
                  <ConfirmSubmit label="Suspend account" tone="danger" name="status" value="suspended" requires="reason" title="Suspend this account?" message={`${name} will be signed out and can't sign in until reactivated.`} />
                </>
              )}
            </form>
          </Card>

          <Card title="Decision history">
            {!log?.length ? (
              <p className="text-slate">No decisions recorded yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {log.map((a) => {
                  const who = one(a.profiles);
                  const d = a.detail as { from?: string; to?: string; note?: string; reason?: string } | null;
                  return (
                    <li key={a.id} className="py-2.5 text-[15px]">
                      <p className="font-medium">{actionLabels[a.action] ?? a.action}{d?.to ? `: ${d.from ?? "?"} → ${d.to}` : ""}</p>
                      <p className="text-sm text-slate">{who?.full_name ?? "Unknown"} · {fmtDate(a.created_at)}</p>
                      {(d?.note || d?.reason) && <p className="mt-1 border-l-2 border-gold-deep pl-3">{d.note || d.reason}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

export default function Page(props: PageProps<"/admin/professionals/[id]">) {
  return (
    <Suspense fallback={<p className="text-slate">Loading…</p>}>
      <Body {...props} />
    </Suspense>
  );
}
