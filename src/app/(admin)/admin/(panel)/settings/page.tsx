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
  const { data: areas } = await supabase.from("areas").select("name, city, is_active").order("sort_order");
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
          <ul className="divide-y divide-line text-[15px]">
            {areas?.map((a) => <li key={a.name} className="flex justify-between py-2"><span>{a.name}, {a.city}</span><span className="text-slate">{a.is_active ? "Active" : "Inactive"}</span></li>)}
          </ul>
          <p className="mt-3 text-sm text-slate">Read-only for now. Editing locations comes with the move of site lists into the database.</p>
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
