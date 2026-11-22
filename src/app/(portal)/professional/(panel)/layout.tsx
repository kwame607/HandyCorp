import { Suspense } from "react";
import { redirect } from "next/navigation";
import PortalShell from "@/components/professional/PortalShell";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Professional | HandyCorp", robots: { index: false, follow: false } };

const label: Record<string, { label: string; tone: string }> = {
  submitted: { label: "Registration submitted", tone: "amber" },
  under_review: { label: "Under review", tone: "amber" },
  more_info_required: { label: "More information required", tone: "amber" },
  approved: { label: "Verified", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
};

async function Guard({ children }: { children: React.ReactNode }) {
  const user = await requireRole("professional", "/professional/login", "/professional/dashboard");
  const supabase = await createClient();
  const { data } = await supabase.from("professional_profiles").select("status").eq("user_id", user.id).maybeSingle();
  if (!data) redirect("/professional/onboarding");
  return <PortalShell name={user.fullName} status={label[data.status] ?? label.submitted}>{children}</PortalShell>;
}

export default function PanelLayout({ children }: LayoutProps<"/professional">) {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-paper text-slate">Loading…</div>}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}
