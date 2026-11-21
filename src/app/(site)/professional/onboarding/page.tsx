import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ProfessionalOnboarding from "@/components/auth/ProfessionalOnboarding";

export const metadata = { title: "Complete your registration | HandyCorp" };

async function Body() {
  const user = await requireRole("professional", "/professional/login", "/professional/onboarding");
  const supabase = await createClient();
  const { data } = await supabase.from("professional_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
  if (data) redirect("/professional/dashboard");
  return <ProfessionalOnboarding userId={user.id} name={user.fullName} />;
}

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12 md:py-16">
      <Suspense fallback={<p className="text-slate">Loading…</p>}>
        <Body />
      </Suspense>
    </main>
  );
}
