"use server";

import { updateTag } from "next/cache";
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
  if (ok && (path.startsWith("/admin/categories") || path.startsWith("/admin/areas"))) updateTag("catalogue");
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${ok ? "saved=1" : `error=${encodeURIComponent(msg ?? "1")}`}`);
}

const friendly = (m?: string) =>
  m && /not allowed/i.test(m) ? "Your role doesn't allow this." : m && /reason is required/i.test(m) ? "Please write a reason." : m && /cannot be changed/i.test(m) ? "Administrator accounts can't be changed here." : m && /2 to 80/.test(m) ? "Names must be 2 to 80 characters." : "Something went wrong. Please try again.";

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
  const { error } = await supabase.rpc("admin_add_service", { p_category: id, p_name: field(f, "name"), p_keywords: field(f, "keywords") });
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

export async function decideWorkRequest(f: FormData) {
  const id = field(f, "id");
  const decision = field(f, "decision");
  const supabase = await admin();
  if (!uuid.test(id) || !["approved", "declined"].includes(decision)) redirect("/admin/professionals/requests");
  const { error } = await supabase.rpc("admin_decide_service_request", { p_id: id, p_decision: decision, p_note: field(f, "note") });
  if (error) console.error("[admin] work request decision failed:", error.code || "no code");
  const msg = error && /note|reason/i.test(error.message) ? "Please write a reason when declining." : error && /already/i.test(error.message) ? "This request was already decided." : "Something went wrong. Please try again.";
  done("/admin/professionals/requests", !error, msg);
}

export async function addArea(f: FormData) {
  const supabase = await admin();
  const { error } = await supabase.rpc("admin_add_area", { p_name: field(f, "name"), p_region: field(f, "region") });
  if (error) console.error("[admin] add area failed:", error.code || "no code");
  const msg = error?.code === "23505" ? "That area already exists." : error?.code === "22023" ? "Area names must be 2 to 60 characters." : "Something went wrong. Please try again.";
  done("/admin/areas", !error, msg);
}

export async function setAreaActive(f: FormData) {
  const id = field(f, "id");
  const supabase = await admin();
  if (!uuid.test(id)) redirect("/admin/areas");
  const { error } = await supabase.rpc("admin_set_area_active", { p_id: id, p_active: field(f, "active") === "true" });
  if (error) console.error("[admin] area status failed:", error.code || "no code");
  done("/admin/areas", !error, "Something went wrong. Please try again.");
}

export async function setStaffRole(f: FormData) {
  const supabase = await admin();
  const { error } = await supabase.rpc("admin_set_staff_role", { p_email: field(f, "email"), p_role: field(f, "remove") ? "none" : field(f, "role") });
  if (error) console.error("[admin] staff role failed:", error.code || "no code");
  const m = error?.message ?? "";
  const msg = /No account/i.test(m) ? "No account has that email. They need to sign up first." : /your own role/i.test(m) ? "You can't change your own role." : /one Super/i.test(m) ? "There must always be one Super Administrator." : /not allowed/i.test(m) ? "Only a Super Administrator can do this." : "Something went wrong. Please try again.";
  done("/admin/staff", !error, msg);
}
