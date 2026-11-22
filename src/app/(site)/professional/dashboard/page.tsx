import { Suspense } from "react";
import { redirect } from "next/navigation";
import DashboardView from "@/components/professional/DashboardView";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Professional dashboard | HandyCorp" };

async function Body() {
  const user = await requireRole("professional", "/professional/login", "/professional/dashboard");
  const supabase = await createClient();
  const { data } = await supabase.from("professional_profiles").select("status, status_note").eq("user_id", user.id).maybeSingle();
  if (!data) redirect("/professional/onboarding");
  return <DashboardView firstName={user.fullName.split(" ")[0]} status={data.status} note={data.status_note} />;
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
