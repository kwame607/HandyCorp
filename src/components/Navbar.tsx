"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "./Logo";
import { CloseIcon, MenuIcon } from "./icons";

const links = [
  { href: "#services", label: "Explore Services" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#professionals", label: "Become a Professional" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-20">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[15px] font-medium text-ink/80 transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/signin"
            className="rounded-full px-4 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-ink/5"
          >
            Sign In
          </Link>
          <Link
            href="/get-started"
            className="rounded-full bg-ink px-5 py-2.5 text-[15px] font-semibold text-paper transition-colors hover:bg-ink/85"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-full hover:bg-ink/5 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="border-t border-ink/10 bg-paper px-5 pb-6 pt-2 md:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-ink/10 py-4 text-lg font-medium"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 flex gap-3">
            <Link
              href="/signin"
              className="flex-1 rounded-full border border-ink/20 py-3 text-center font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/get-started"
              className="flex-1 rounded-full bg-ink py-3 text-center font-semibold text-paper"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
