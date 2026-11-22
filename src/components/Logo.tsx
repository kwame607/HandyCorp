import Image from "next/image";
import Link from "next/link";
import dark from "../../public/brand/handycorp-wordmark.png";
import lightLogo from "../../public/brand/handycorp-wordmark-light.png";

// The HandyCorp wordmark. Use light on dark backgrounds.
export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" aria-label="HandyCorp home" className="inline-flex items-center">
      <Image src={light ? lightLogo : dark} alt="HandyCorp" priority={!light} className="h-8 w-auto md:h-9" />
    </Link>
  );
}
