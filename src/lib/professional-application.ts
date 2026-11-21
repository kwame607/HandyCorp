import { areas } from "@/data/areas";
import { categories } from "@/data/services";

export const experienceOptions = [
  { value: "under-1", label: "Less than 1 year" },
  { value: "1-3", label: "1 to 3 years" },
  { value: "4-9", label: "4 to 9 years" },
  { value: "10-plus", label: "10 years or more" },
] as const;

export const workModes = [
  { value: "workshop", label: "I work from a workshop or shop" },
  { value: "travel", label: "I travel to customers" },
  { value: "both", label: "Both" },
] as const;

export type ApplicationValues = {
  fullName: string;
  phone: string;
  email: string;
  services: string[];
  areas: string[];
  experience: string;
  workMode: string;
  about: string;
  consent: boolean;
};

export type FieldErrors = Partial<Record<keyof ApplicationValues, string>>;

const allServiceSlugs = new Set(
  categories.flatMap((c) => c.services.map((s) => s.slug)),
);
const allAreas = new Set(areas);

/** Accepts 0XXXXXXXXX or +233XXXXXXXXX (spaces and dashes ignored). Returns +233 form. */
export function normaliseGhanaPhone(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "");
  const match = digits.match(/^(?:\+233|233|0)([2-5]\d{8})$/);
  return match ? `+233${match[1]}` : null;
}

export function readApplication(formData: FormData): ApplicationValues {
  const text = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    fullName: text("fullName"),
    phone: text("phone"),
    email: text("email"),
    services: formData.getAll("services").map(String),
    areas: formData.getAll("areas").map(String),
    experience: text("experience"),
    workMode: text("workMode"),
    about: text("about"),
    consent: formData.get("consent") === "on",
  };
}

export function validateApplication(v: ApplicationValues): FieldErrors {
  const errors: FieldErrors = {};

  if (v.fullName.length < 2) errors.fullName = "Enter your full name.";
  else if (v.fullName.length > 100) errors.fullName = "Use 100 characters or fewer.";

  if (!normaliseGhanaPhone(v.phone)) {
    errors.phone =
      "Enter a Ghana mobile number, for example 024 123 4567 or +233 24 123 4567.";
  }

  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) {
    errors.email = "Enter a valid email address, or leave this empty.";
  }

  if (v.services.length === 0) {
    errors.services = "Choose at least one service you offer.";
  } else if (v.services.some((s) => !allServiceSlugs.has(s))) {
    errors.services = "Choose services from the list.";
  }

  if (v.areas.length === 0) {
    errors.areas = "Choose at least one area you cover.";
  } else if (v.areas.some((a) => !allAreas.has(a))) {
    errors.areas = "Choose areas from the list.";
  }

  if (!experienceOptions.some((o) => o.value === v.experience)) {
    errors.experience = "Select how long you have worked in this trade.";
  }
  if (!workModes.some((o) => o.value === v.workMode)) {
    errors.workMode = "Select how you usually work.";
  }

  if (v.about.length > 600) errors.about = "Use 600 characters or fewer.";

  if (!v.consent) {
    errors.consent = "Please confirm before sending your application.";
  }

  return errors;
}
