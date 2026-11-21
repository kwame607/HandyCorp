import Link from "next/link";
import Logo from "./Logo";
import { FacebookIcon, InstagramIcon, XIcon } from "./icons";

const links = [
  { href: "/services", label: "Explore Services" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#professionals", label: "Become a Professional" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/legal", label: "Terms and Privacy" },
];

// Social URLs are placeholders until the accounts exist.
const socials = [
  { href: "#", label: "HandyCorp on Facebook", Icon: FacebookIcon },
  { href: "#", label: "HandyCorp on Instagram", Icon: InstagramIcon },
  { href: "#", label: "HandyCorp on X", Icon: XIcon },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-2">
        <div>
          <Logo light />
          <p className="mt-5 max-w-sm leading-relaxed text-paper/65">
            HandyCorp helps you find, compare and hire skilled independent
            professionals near you. Starting in Kumasi, Ghana.
          </p>
          <ul className="mt-6 flex gap-3">
            {socials.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  className="grid h-11 w-11 place-items-center rounded-full bg-paper/10 transition-colors hover:bg-gold hover:text-ink"
                >
                  <Icon />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-4 md:justify-items-start">
            {links.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="text-paper/80 transition-colors hover:text-gold"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-paper/10">
        <p className="mx-auto max-w-6xl px-5 py-6 text-sm text-paper/50">
          © HandyCorp (Handy Jobs Corporations). All rights reserved.
        </p>
      </div>
    </footer>
  );
}
