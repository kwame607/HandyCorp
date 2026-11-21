"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { statusList } from "@/lib/professional-status";
import { createClient } from "@/lib/supabase/server";

export async function setStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "");
  // Check again on the server. The database also refuses anyone who isn't an admin.
  await requireRole("admin", "/login", "/admin");
  if (!/^[0-9a-f-]{36}$/.test(id) || !statusList.some((s) => s.value === status)) {
    redirect("/admin");
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_professional_status", { p_user: id, p_status: status, p_note: note });
  if (error) {
    console.error("[admin] status change failed:", error.code || "no code");
    redirect(`/admin/professionals/${id}?error=1`);
  }
  redirect(`/admin/professionals/${id}?saved=1`);
}
