// Initial Kumasi launch areas from the proposal. Final coverage depends on
// provider availability and customer interviews, so keep this list editable.
// The same areas live in the database `areas` table, matched by slug.
export const areas: string[] = [
  "Ahodwo",
  "Asokwa",
  "Adum",
  "Bantama",
  "KNUST area",
];

export function areaSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
