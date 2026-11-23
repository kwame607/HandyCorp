"use server";

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { dbMessage } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export async function setReviewStatus(f: FormData) {
  await requirePermission("support.view", "/admin/reviews");
  const { error } = await (await createClient()).rpc("admin_set_review_status", {
    p_id: String(f.get("id") ?? ""),
    p_status: String(f.get("status") ?? ""),
    p_reason: String(f.get("reason") ?? "").trim() || null,
  });
  redirect(error ? `/admin/reviews?error=${encodeURIComponent(dbMessage(error))}` : "/admin/reviews");
}
