// Kumasi neighbourhoods, compiled from general knowledge rather than an official
// list. Admins can add or hide areas in the admin panel; this copy is only used
// if the database can't be reached.
// The same areas live in the database `areas` table, matched by slug.
export const regions = ["Greater Accra", "Ashanti", "Central"] as const;
export type Region = (typeof regions)[number];
export type Area = { slug: string; name: string; region: Region; lat?: number; lng?: number };

const names: string[] = [
  "Aboabo",
  "Abrepo",
  "Abuakwa",
  "Adiebeba",
  "Adoato",
  "Adum",
  "Ahenema Kokoben",
  "Ahinsan",
  "Ahodwo",
  "Amakom",
  "Anloga",
  "Apire",
  "Asafo",
  "Ash Town",
  "Asokore Mampong",
  "Asokwa",
  "Asuoyeboah",
  "Atasomanso",
  "Atonsu",
  "Ayeduase",
  "Ayigya",
  "Bantama",
  "Bomso",
  "Breman",
  "Buokrom",
  "Chirapatre",
  "Daban",
  "Danyame",
  "Dichemso",
  "Emena",
  "Fante New Town",
  "Gyenyase",
  "Kejetia",
  "Kentinkrono",
  "KNUST area",
  "Kotei",
  "Krofrom",
  "Kronum",
  "Kwadaso",
  "Kwadaso Estate",
  "Maakro",
  "Manhyia",
  "Moshie Zongo",
  "Nhyiaeso",
  "Nsenie",
  "Oduom",
  "Oforikrom",
  "Old Tafo",
  "Pankrono",
  "Patasi",
  "Ridge",
  "Roman Hill",
  "Santasi",
  "Sawaba",
  "Sepe Buokrom",
  "Sokoban",
  "Suame",
  "Suame Magazine",
  "Subin",
  "Suntreso",
  "Tafo",
  "Tanoso",
  "Tech Junction",
];

export function areaSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Built-in copy of the Kumasi areas (Ashanti). The full three-region list lives in the database.
export const areas: Area[] = names.map((name) => ({ slug: areaSlug(name), name, region: "Ashanti" }));
