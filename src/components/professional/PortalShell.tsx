"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/(site)/(auth)/actions";
import { Icon } from "@/components/admin/icons";

const items = [
  { href: "/professional/dashboard", label: "Overview", icon: "overview" },
  { href: "/professional/bookings", label: "Bookings", icon: "bookings" },
  { href: "/professional/reviews", label: "Reviews", icon: "reviews" },
  { href: "/professional/services", label: "My Services", icon: "categories" },
  { href: "/professional/profile", label: "Profile & Portfolio", icon: "professionals" },
  { href: "/professional/settings", label: "Settings", icon: "settings" },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Professional" className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-0.5">
        {items.map((i) => {
          const on = pathname === i.href || pathname.startsWith(`${i.href}/`);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                onClick={onNavigate}
                aria-current={on ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] ${on ? "bg-ink/[0.07] font-semibold shadow-[inset_3px_0_0_var(--color-gold)]" : "text-ink/80 hover:bg-ink/5"}`}
              >
                <Icon name={i.icon} />
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/professional/dashboard" className="flex items-center gap-2.5" aria-label="HandyCorp professional dashboard">
      <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-lg bg-gold font-display text-xl font-extrabold">H</span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-bold">HandyCorp</span>
        <span className="block text-xs text-slate">For professionals</span>
      </span>
    </Link>
  );
}

export default function PortalShell({ name, status, children }: { name: string; status: { label: string; tone: string }; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const title = items.find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))?.label ?? "Dashboard";
  const tones: Record<string, string> = { green: "bg-[#e8f3ec] text-[#1f5c36]", amber: "bg-[#fff3d6] text-[#7a4f00]", red: "bg-[#fdf0ee] text-[#9c2019]" };

  const account = (
    <div className="border-t border-line p-3">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-paper">{name.trim().charAt(0).toUpperCase()}</span>
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{name}</span>
        <form action={signOut}>
          <button title="Sign out" aria-label="Sign out" className="grid h-9 w-9 place-items-center rounded-md hover:bg-ink/5"><Icon name="logout" /></button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-line px-4"><Brand /></div>
        <Nav />
        <Link href="/" className="mx-3 mb-2 rounded-md px-3 py-2 text-[15px] text-slate hover:bg-ink/5">Back to website</Link>
        {account}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <Brand />
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-md hover:bg-ink/5"><Icon name="close" /></button>
            </div>
            <Nav onNavigate={() => setOpen(false)} />
            <Link href="/" onClick={() => setOpen(false)} className="mx-3 mb-2 rounded-md px-3 py-2 text-[15px] text-slate hover:bg-ink/5">Back to website</Link>
            {account}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur lg:px-8">
          <button aria-label="Open menu" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-md hover:bg-ink/5 lg:hidden"><Icon name="menu" /></button>
          <p className="font-display text-lg font-bold">{title}</p>
          <span className={`ml-auto rounded px-2 py-0.5 text-[13px] font-medium ${tones[status.tone] ?? "bg-ink/5 text-slate"}`}>{status.label}</span>
        </header>
        <main className="mx-auto max-w-5xl p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
