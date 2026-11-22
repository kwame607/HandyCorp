"use server";

import { redirect } from "next/navigation";
import { areaSlug } from "@/data/areas";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const field = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function pro() {
  await requireRole("professional", "/professional/login", "/professional/dashboard");
  return createClient();
}

const friendly = (m?: string) => {
  if (!m) return "Something went wrong. Please try again.";
  if (/Already offered/.test(m)) return "You already offer that service.";
  if (/Already requested/.test(m)) return "You've already asked for that service. We'll reply soon.";
  if (/Reason must be/.test(m)) return "Please explain why you should offer it, in 10 to 500 characters.";
  if (/Name must be/.test(m)) return "Enter the service name, 2 to 80 characters.";
  if (/Too many pending/.test(m)) return "You have too many requests waiting. Please wait for a reply first.";
  if (/Description must be/.test(m)) return "Your description needs 20 to 600 characters.";
  if (/Display name/.test(m)) return "Your display name needs 2 to 100 characters.";
  if (/areas/.test(m)) return "Choose at least one area you cover.";
  if (/suspended/.test(m)) return "This account is suspended.";
  return "Something went wrong. Please try again.";
};

export async function requestMoreWork(f: FormData) {
  const supabase = await pro();
  const { error } = await supabase.rpc("request_more_work", {
    p_service_slug: field(f, "service"),
    p_other_name: field(f, "otherName"),
    p_category_slug: field(f, "otherCategory"),
    p_reason: field(f, "reason"),
  });
  if (error) {
    console.error("[portal] request more work failed:", error.code || "no code");
    redirect(`/professional/services?error=${encodeURIComponent(friendly(error.message))}#request`);
  }
  redirect("/professional/services?saved=1");
}

export async function updateProfile(f: FormData) {
  const supabase = await pro();
  const areas = f.getAll("areas").map(String);
  const { data, error } = await supabase.rpc("update_professional_profile", {
    p_display_name: field(f, "displayName"),
    p_description: field(f, "description"),
    p_work_address: field(f, "workAddress"),
    p_extra_experience: field(f, "extra"),
    p_area_slugs: areas.map(areaSlug),
  });
  if (error) {
    console.error("[portal] update profile failed:", error.code || "no code");
    redirect(`/professional/profile?error=${encodeURIComponent(friendly(error.message))}`);
  }
  redirect(`/professional/profile?saved=${data === "under_review" ? "review" : "1"}`);
}
