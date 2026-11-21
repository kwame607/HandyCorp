export const experienceOptions = [
  { value: "under-1", label: "Less than 1 year" },
  { value: "1-3", label: "1 to 3 years" },
  { value: "4-9", label: "4 to 9 years" },
  { value: "10-plus", label: "10 years or more" },
] as const;

/** Accepts 0XXXXXXXXX or +233XXXXXXXXX (spaces and dashes ignored). Returns +233 form. */
export function normaliseGhanaPhone(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "");
  const match = digits.match(/^(?:\+233|233|0)([2-5]\d{8})$/);
  return match ? `+233${match[1]}` : null;
}
