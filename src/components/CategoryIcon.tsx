import type { SVGProps } from "react";
import { CarIcon, PhoneIcon, ScissorsIcon, WrenchIcon } from "./icons";

const byCategory = {
  "home-services-repairs": WrenchIcon,
  "electronics-technology": PhoneIcon,
  "grooming-personal-care": ScissorsIcon,
  "automotive-services": CarIcon,
} as const;

// Icons live here (not in the data file) so the data stays plain and DB-ready.
export default function CategoryIcon({
  slug,
  ...props
}: { slug: string } & SVGProps<SVGSVGElement>) {
  const Icon = byCategory[slug as keyof typeof byCategory] ?? WrenchIcon;
  return <Icon {...props} />;
}
