"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/(site)/(auth)/actions";
import type { Permission } from "@/lib/permissions";
import { Icon } from "./icons";

type Item = { href: string; label: string; icon: string; perm?: Permission };
const groups: { label: string; items: Item[] }[] = [
  {
    label: "Main",
    items: [
      { href: "/admin", label: "Overview", icon: "overview" },
      { href: "/admin/customers", label: "Customers", icon: "customers", perm: "customers.view" },
      { href: "/admin/professionals", label: "Professionals", icon: "professionals", perm: "professionals.view" },
      { href: "/admin/categories", label: "Service Categories", icon: "categories", perm: "catalogue.manage" },
      { href: "/admin/areas", label: "Areas", icon: "categories", perm: "catalogue.manage" },
      { href: "/admin/requests", label: "Service Requests", icon: "requests", perm: "bookings.view" },
      { href: "/admin/bookings", label: "Bookings", icon: "bookings", perm: "bookings.view" },
      { href: "/admin/inspections", label: "Inspections & Quotations", icon: "inspections", perm: "bookings.view" },
      { href: "/admin/support", label: "Messages & Support", icon: "support", perm: "support.view" },
      { href: "/admin/reviews", label: "Reviews & Reports", icon: "reviews", perm: "support.view" },
    ],
  },
  {
    label: "Financial management",
    items: [
      { href: "/admin/payments", label: "Payments", icon: "payments", perm: "finance.view" },
      { href: "/admin/commissions", label: "Commissions", icon: "commissions", perm: "finance.view" },
      { href: "/admin/refunds", label: "Refunds & Disputes", icon: "refunds", perm: "finance.view" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/analytics", label: "Analytics & Reports", icon: "analytics", perm: "analytics.view" },
      { href: "/admin/staff", label: "Staff & Permissions", icon: "staff", perm: "staff.manage" },
      { href: "/admin/settings", label: "Settings", icon: "settings" },
    ],
  },
];
const all = groups.flatMap((g) => g.items);

export type Notice = { pending: number; requests: number; items: { id: string; name: string; when: string }[] };

function Nav({ collapsed, onNavigate, allowed }: { collapsed: boolean; onNavigate?: () => void; allowed: Permission[] }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
      {groups.map((g) => ({ ...g, items: g.items.filter((i) => !i.perm || allowed.includes(i.perm)) })).filter((g) => g.items.length > 0).map((g) => (
        <div key={g.label} className="mb-5">
          {!collapsed && <p className="mb-1 px-3 text-xs font-semibold text-slate">{g.label}</p>}
          {collapsed && <div className="mx-3 mb-2 border-t border-line" />}
          <ul className="space-y-0.5">
            {g.items.map((i) => {
              const on = active(i.href);
              return (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    onClick={onNavigate}
                    title={collapsed ? i.label : undefined}
                    aria-label={collapsed ? i.label : undefined}
                    aria-current={on ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-[15px] ${collapsed ? "justify-center" : ""} ${
                      on ? "bg-ink/[0.07] font-semibold shadow-[inset_3px_0_0_var(--color-gold)]" : "text-ink/80 hover:bg-ink/5"
                    }`}
                  >
                    <Icon name={i.icon} />
                    {!collapsed && <span>{i.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/admin" className="flex items-center gap-2.5" aria-label="HandyCorp Admin Panel">
      <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold font-display text-xl font-extrabold">H</span>
      {!collapsed && (
        <span className="leading-tight">
          <span className="block font-display text-lg font-bold">HandyCorp</span>
          <span className="block text-xs text-slate">Admin Panel</span>
        </span>
      )}
    </Link>
  );
}

function Profile({ user, collapsed }: { user: { name: string; email: string; role: string }; collapsed: boolean }) {
  return (
    <div className="border-t border-line p-3">
      <div className={`flex items-center gap-3 ${collapsed ? "flex-col" : ""}`}>
        <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-paper">
          {user.name.trim().charAt(0).toUpperCase()}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[15px] font-semibold">{user.name}</span>
            <span className="block truncate text-xs text-slate">{user.role}</span>
          </span>
        )}
        <form action={signOut}>
          <button title="Sign out" aria-label="Sign out" className="grid h-9 w-9 place-items-center rounded-md hover:bg-ink/5">
            <Icon name="logout" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminShell({ user, allowed, notices, children }: { user: { name: string; email: string; role: string }; allowed: Permission[]; notices: Notice; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();
  const current = [...all].sort((a, b) => b.href.length - a.href.length).find((i) => (i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href)));
  const title = pathname.startsWith("/admin/search") ? "Search" : (current?.label ?? "Admin");

  return (
    <div className="min-h-screen bg-paper lg:flex">
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-white lg:flex ${collapsed ? "w-[72px]" : "w-64"}`}>
        <div className={`flex h-16 items-center border-b border-line px-4 ${collapsed ? "justify-center" : "justify-between"}`}>
          <Brand collapsed={collapsed} />
        </div>
        <Nav collapsed={collapsed} allowed={allowed} />
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="mx-3 mb-2 flex items-center gap-3 rounded-md px-3 py-2 text-[15px] text-slate hover:bg-ink/5"
        >
          <Icon name={collapsed ? "right" : "left"} />
          {!collapsed && "Collapse"}
        </button>
        <Profile user={user} collapsed={collapsed} />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-ink/40" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <Brand collapsed={false} />
              <button aria-label="Close menu" onClick={() => setDrawer(false)} className="grid h-10 w-10 place-items-center rounded-md hover:bg-ink/5">
                <Icon name="close" />
              </button>
            </div>
            <Nav collapsed={false} onNavigate={() => setDrawer(false)} allowed={allowed} />
            <Profile user={user} collapsed={false} />
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur lg:px-8">
          <button aria-label="Open menu" onClick={() => setDrawer(true)} className="grid h-10 w-10 place-items-center rounded-md hover:bg-ink/5 lg:hidden">
            <Icon name="menu" />
          </button>
          <div className="min-w-0">
            <p className="hidden text-xs text-slate sm:block">Admin</p>
            <p className="truncate font-display text-lg font-bold leading-tight">{title}</p>
          </div>

          <form action="/admin/search" role="search" className="ml-auto hidden max-w-sm flex-1 md:block">
            <label htmlFor="admin-search" className="sr-only">Search customers and professionals</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate"><Icon name="search" size={18} /></span>
              <input id="admin-search" name="q" type="search" placeholder="Search customers and professionals" className="w-full rounded-md border border-ink/20 bg-white py-2 pl-10 pr-3 text-[15px]" />
            </div>
          </form>
          <a href="/admin/search" aria-label="Search" className="ml-auto grid h-10 w-10 place-items-center rounded-md hover:bg-ink/5 md:hidden">
            <Icon name="search" />
          </a>

          <details className="relative">
            <summary aria-label={`Notifications${notices.pending + notices.requests ? `, ${notices.pending + notices.requests} new` : ""}`} className="relative grid h-10 w-10 cursor-pointer list-none place-items-center rounded-md hover:bg-ink/5 [&::-webkit-details-marker]:hidden">
              <Icon name="bell" />
              {notices.pending + notices.requests > 0 && (
                <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold leading-4 text-ink">{notices.pending + notices.requests}</span>
              )}
            </summary>
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-md border border-line bg-white shadow-lg">
              <p className="border-b border-line px-4 py-3 font-semibold">Notifications</p>
              {notices.items.length === 0 && notices.requests === 0 ? (
                <p className="px-4 py-5 text-[15px] text-slate">Nothing needs your attention.</p>
              ) : (
                <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                  {notices.requests > 0 && (
                    <li>
                      <Link href="/admin/professionals/requests" className="block px-4 py-3 hover:bg-ink/5">
                        <span className="block text-[15px] font-medium">Requests for more work</span>
                        <span className="block text-sm text-slate">{notices.requests} waiting for a decision</span>
                      </Link>
                    </li>
                  )}
                  {notices.items.map((n) => (
                    <li key={n.id}>
                      <Link href={`/admin/professionals/${n.id}`} className="block px-4 py-3 hover:bg-ink/5">
                        <span className="block text-[15px] font-medium">New professional registration</span>
                        <span className="block text-sm text-slate">{n.name} · {n.when}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <p className="border-t border-line px-4 py-2.5 text-xs text-slate">Complaints, disputes and payment alerts will appear here when those features are connected.</p>
            </div>
          </details>

          <details className="relative">
            <summary aria-label="Account menu" className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full bg-ink text-sm font-semibold text-paper [&::-webkit-details-marker]:hidden">
              {user.name.trim().charAt(0).toUpperCase()}
            </summary>
            <div className="absolute right-0 mt-2 w-64 rounded-md border border-line bg-white p-4 shadow-lg">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-sm text-slate">{user.email}</p>
              <p className="text-sm font-medium">{user.role}</p>
              <form action={signOut} className="mt-3">
                <button className="w-full rounded-md border border-ink/30 px-4 py-2 font-semibold hover:bg-ink/5">Sign out</button>
              </form>
            </div>
          </details>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
