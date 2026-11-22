import { requirePermission } from "@/lib/auth";
import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import DashboardView from "@/components/professional/DashboardView";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard preview | HandyCorp Admin" };

async function Body({ params }: { params: PageProps<"/admin/professionals/[id]/preview">["params"] }) {
  await connection();
  await requirePermission("professionals.view", "/admin/professionals");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const { data: r } = await supabase.from("professional_profiles").select("status, status_note, profiles(full_name)").eq("user_id", id).maybeSingle();
  if (!r) notFound();
  const person = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
  const name = person?.full_name ?? "Professional";
  return (
    <>
      <Link href={`/admin/professionals/${id}`} className="text-[15px] underline underline-offset-4">Back to registration</Link>
      <p role="note" className="mt-4 rounded-md border border-gold-deep bg-[#fff1e6] p-4 text-[15px] font-medium">
        Preview only. This is what {name} sees on their dashboard. Nothing here can be changed.
      </p>
      <div className="mt-6 rounded-md border border-line bg-paper p-6 md:p-10">
        <DashboardView firstName={name.split(" ")[0]} status={r.status} note={r.status_note} preview />
      </div>
    </>
  );
}

export default function Page(props: PageProps<"/admin/professionals/[id]/preview">) {
  return (
    <Suspense fallback={<p className="text-slate">Loading…</p>}>
      <Body params={props.params} />
    </Suspense>
  );
}
