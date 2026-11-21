"use server";

import { areaSlug } from "@/data/areas";
import {
  normaliseGhanaPhone,
  readApplication,
  validateApplication,
  type ApplicationValues,
  type FieldErrors,
} from "@/lib/professional-application";
import { createAnonClient } from "@/lib/supabase";

export type ApplicationState = {
  status: "idle" | "invalid" | "preview" | "received" | "error";
  errors?: FieldErrors;
  values?: ApplicationValues;
  message?: string;
};

export async function submitApplication(
  _prev: ApplicationState,
  formData: FormData,
): Promise<ApplicationState> {
  // Honeypot: real people never see or fill this field.
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "received" };
  }

  const values = readApplication(formData);
  const errors = validateApplication(values);
  if (Object.keys(errors).length > 0) {
    return { status: "invalid", errors, values };
  }

  // Launch switch: until APPLICATIONS_ENABLED=true the form only previews.
  if (process.env.APPLICATIONS_ENABLED !== "true") {
    console.info(
      "[applications] Preview only: APPLICATIONS_ENABLED is not 'true' (restart the dev server after editing .env.local). Nothing saved.",
    );
    return { status: "preview", values };
  }

  try {
    const supabase = createAnonClient();
    const { error } = await supabase.rpc("submit_professional_application", {
      p_full_name: values.fullName,
      p_phone: normaliseGhanaPhone(values.phone),
      p_email: values.email,
      p_experience: values.experience,
      p_work_mode: values.workMode,
      p_about: values.about,
      p_service_slugs: values.services,
      p_area_slugs: values.areas.map(areaSlug),
    });
    if (error) {
      // Message and code only. Never log applicant details.
      throw new Error(`${error.code || "no code"}: ${error.message}`);
    }
    console.info("[applications] Saved to Supabase.");
    return { status: "received" };
  } catch (e) {
    console.error(
      "[applications] Could not save:",
      e instanceof Error ? e.message : "unknown error",
    );
    return {
      status: "error",
      values,
      message:
        "We couldn't save your application. Your answers are still here. Please try again in a few minutes.",
    };
  }
}
