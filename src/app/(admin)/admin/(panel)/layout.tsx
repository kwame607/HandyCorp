import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";
import { fmtDate, type ProRow } from "@/lib/admin";

export const metadata = { title: "Admin | HandyCorp", robots: { index: false, follow: false } };

async function Guard({ children }: { children: React.ReactNode }) {
  // Every admin page is checked here on the server, and again by the database.
  const user = await requireRole("admin", "/admin/login", "/admin");
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_professionals", {
    p_q: "", p_status: "submitted", p_category: "", p_location: "", p_account: "", p_limit: 5, p_offset: 0,
  });
  const { count: requests } = await supabase.from("professional_service_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
  const rows = (data ?? []) as ProRow[];
  const notices = {
    pending: Number(rows[0]?.total ?? 0),
    requests: requests ?? 0,
    items: rows.map((r) => ({ id: r.user_id, name: r.display_name || r.full_name, when: fmtDate(r.submitted_at) })),
  };
  return (
    <AdminShell user={{ name: user.fullName, email: user.email ?? "" }} notices={notices}>
      {children}
    </AdminShell>
  );
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-paper text-slate">Loading…</div>}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}
