"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { statusList } from "@/lib/professional-status";
import { createClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f-]{36}$/;
const field = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function admin() {
  // Checked on the server every time. The database checks again.
  await requireRole("admin", "/admin/login", "/admin");
  return createClient();
}

function done(path: string, ok: boolean, msg?: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${ok ? "saved=1" : `error=${encodeURIComponent(msg ?? "1")}`}`);
}

const friendly = (m?: string) =>
  m && /reason is required/i.test(m) ? "Please write a reason." : m && /cannot be changed/i.test(m) ? "Administrator accounts can't be changed here." : m && /2 to 80/.test(m) ? "Names must be 2 to 80 characters." : "Something went wrong. Please try again.";

export async function setProfessionalStatus(f: FormData) {
  const id = field(f, "id");
  const status = field(f, "status");
  const supabase = await admin();
  if (!uuid.test(id) || !statusList.some((s) => s.value === status)) redirect("/admin/professionals");
  const { error } = await supabase.rpc("admin_set_professional_status", { p_user: id, p_status: status, p_note: field(f, "note") });
  if (error) console.error("[admin] status change failed:", error.code || "no code");
  done(`/admin/professionals/${id}`, !error, friendly(error?.message));
}

export async function setAccountStatus(f: FormData) {
  const id = field(f, "id");
  const status = field(f, "status");
  const back = field(f, "back") === "professional" ? "professionals" : "customers";
  const supabase = await admin();
  if (!uuid.test(id) || !["active", "suspended"].includes(status)) redirect(`/admin/${back}`);
  const { error } = await supabase.rpc("admin_set_account_status", { p_user: id, p_status: status, p_reason: field(f, "reason") });
  if (error) console.error("[admin] account status failed:", error.code || "no code");
  done(`/admin/${back}/${id}`, !error, friendly(error?.message));
}

export async function createCategory(f: FormData) {
  const supabase = await admin();
  const { error } = await supabase.rpc("admin_create_category", { p_name: field(f, "name"), p_summary: field(f, "summary"), p_description: field(f, "description") });
  if (error) console.error("[admin] create category failed:", error.code || "no code");
  done("/admin/categories", !error, friendly(error?.message));
}

export async function updateCategory(f: FormData) {
  const id = field(f, "id");
  const supabase = await admin();
  if (!uuid.test(id)) redirect("/admin/categories");
  const { error } = await supabase.rpc("admin_update_category", { p_id: id, p_name: field(f, "name"), p_summary: field(f, "summary"), p_description: field(f, "description") });
  if (error) console.error("[admin] update category failed:", error.code || "no code");
  done("/admin/categories", !error, friendly(error?.message));
}

export async function setCategoryActive(f: FormData) {
  const id = field(f, "id");
  const supabase = await admin();
  if (!uuid.test(id)) redirect("/admin/categories");
  const { error } = await supabase.rpc("admin_set_category_active", { p_id: id, p_active: field(f, "active") === "true" });
  if (error) console.error("[admin] category active failed:", error.code || "no code");
  done("/admin/categories", !error, friendly(error?.message));
}

export async function addService(f: FormData) {
  const id = field(f, "category");
  const supabase = await admin();
  if (!uuid.test(id)) redirect("/admin/categories");
  const { error } = await supabase.rpc("admin_add_service", { p_category: id, p_name: field(f, "name") });
  if (error) console.error("[admin] add service failed:", error.code || "no code");
  done("/admin/categories", !error, friendly(error?.message));
}

export async function setServiceActive(f: FormData) {
  const id = field(f, "id");
  const supabase = await admin();
  if (!uuid.test(id)) redirect("/admin/categories");
  const { error } = await supabase.rpc("admin_set_service_active", { p_id: id, p_active: field(f, "active") === "true" });
  if (error) console.error("[admin] service active failed:", error.code || "no code");
  done("/admin/categories", !error, friendly(error?.message));
}
