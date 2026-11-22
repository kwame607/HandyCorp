"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "./Logo";
import { signOut } from "@/app/(site)/(auth)/actions";
import { useAuthState } from "./auth/useAuthState";
import { CloseIcon, MenuIcon } from "./icons";

const links = [
  { href: "/services", label: "Explore Services", section: "/services" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/professionals/join", label: "Become a Professional", section: "/professionals" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthState();
  const home = user?.role === "professional" ? "/professional/dashboard" : "/account";

  const isActive = (section?: string) =>
    !!section && (pathname === section || pathname.startsWith(`${section}/`));

  const linkClass = (active: boolean) =>
    `text-[15px] font-medium transition-colors hover:text-ink ${
      active
        ? "text-ink underline decoration-gold decoration-2 underline-offset-[10px]"
        : "text-ink/80"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-20">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {links.map((l) => {
            const active = isActive(l.section);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={linkClass(active)}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user === undefined ? (
            <span className="h-10 w-48" aria-hidden="true" />
          ) : user ? (
            <>
              <Link href={home} className="rounded-full px-4 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-ink/5">
                {user.role === "customer" ? "My Account" : "Dashboard"}
              </Link>
              {user.isAdmin && (
                <Link href="/admin" className="rounded-full px-4 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-ink/5">
                  Admin
                </Link>
              )}
              <form action={signOut}>
                <button className="rounded-full bg-ink px-5 py-2.5 text-[15px] font-semibold text-paper transition-colors hover:bg-ink/85">
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-4 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-ink/5">
                Sign In
              </Link>
              <Link href="/signup" className="rounded-full bg-ink px-5 py-2.5 text-[15px] font-semibold text-paper transition-colors hover:bg-ink/85">
                Get Started
              </Link>
            </>
          )}
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
            {links.map((l) => {
              const active = isActive(l.section);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between border-b border-ink/10 py-4 text-lg font-medium ${
                    active ? "text-ink" : "text-ink/85"
                  }`}
                >
                  {l.label}
                  {active && (
                    <span
                      className="h-2 w-2 rounded-full bg-gold"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="mt-5 flex gap-3">
            {user ? (
              <>
                <Link href={home} onClick={() => setOpen(false)} className="flex-1 rounded-full border border-ink/20 py-3 text-center font-medium">
                  {user.role === "customer" ? "My Account" : "Dashboard"}
                </Link>
                {user.isAdmin && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="flex-1 rounded-full border border-ink/20 py-3 text-center font-medium">
                    Admin
                  </Link>
                )}
                <form action={signOut} className="flex-1">
                  <button className="w-full rounded-full bg-ink py-3 text-center font-semibold text-paper">Sign Out</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="flex-1 rounded-full border border-ink/20 py-3 text-center font-medium">
                  Sign In
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="flex-1 rounded-full bg-ink py-3 text-center font-semibold text-paper">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
