"use server";

import {
  readApplication,
  validateApplication,
  type ApplicationValues,
  type FieldErrors,
} from "@/lib/professional-application";

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

  // Applications are only accepted once real storage exists. Until then the
  // form validates and says so plainly instead of pretending to save.
  if (process.env.APPLICATIONS_ENABLED !== "true") {
    return { status: "preview", values };
  }

  try {
    // TODO: save to the database (Supabase `professional_profiles` +
    // `verifications`) and notify the operations team.
    throw new Error("Application storage is not connected yet.");
  } catch {
    return {
      status: "error",
      values,
      message:
        "We couldn't save your application. Your answers are still here. Please try again in a few minutes.",
    };
  }
}
