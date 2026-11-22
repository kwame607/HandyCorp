import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Card, NotConnected, PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export const metadata = { title: "Settings | HandyCorp Admin" };

async function Body() {
  await connection();
  const user = await requireRole("admin", "/admin/login", "/admin/settings");
  const supabase = await createClient();
  const { data: areas } = await supabase.from("areas").select("is_active").limit(5000);
  return (
    <>
      <PageHeader title="Settings" text="Platform settings. Critical settings will need extra permission once staff roles exist." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Account">
          <dl className="divide-y divide-line text-[15px]">
            <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate">Name</dt><dd>{user.fullName}</dd></div>
            <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate">Email</dt><dd className="break-all">{user.email}</dd></div>
          </dl>
          <p className="mt-3 text-sm text-slate">To change your password, sign out and use “Forgot password?” on the admin sign-in page.</p>
        </Card>
        <Card title="Supported locations">
          <p className="text-[15px]">{areas?.filter((a) => a.is_active).length ?? 0} active areas across Greater Accra, Ashanti and Central.</p>
          <p className="mt-3 text-sm text-slate">Add or hide areas on the <Link href="/admin/areas" className="underline underline-offset-4">Areas</Link> page.</p>
        </Card>
        <Card title="Commission">
          <NotConnected>No commission rate is set because payments aren&apos;t connected. When they are, the rate will be a setting here, with a confirmation and an audit entry on every change.</NotConnected>
        </Card>
        <Card title="Other settings">
          <NotConnected>Branding, notification settings, verification requirements and security settings will be added here as those features are built. Service categories are managed under Service Categories.</NotConnected>
        </Card>
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
