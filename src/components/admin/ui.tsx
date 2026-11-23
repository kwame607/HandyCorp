import Link from "next/link";
import { PAGE_SIZE, qs, type SP } from "@/lib/admin";

const tones: Record<string, string> = {
  green: "bg-[#e8f3ec] text-[#1f5c36]",
  amber: "bg-[#ffeedd] text-[#7a4f00]",
  red: "bg-[#fdf0ee] text-[#9c2019]",
  grey: "bg-ink/5 text-slate",
};
const statusTone: Record<string, string> = {
  submitted: "amber", under_review: "amber", more_info_required: "amber", approved: "green", rejected: "red",
  active: "green", suspended: "red",
  open: "amber", booked: "green", cancelled: "red", confirmed: "amber", in_progress: "amber", completed: "green",
  proposed: "amber", pending: "amber", paid: "green", failed: "red", refund_due: "amber", refunded: "grey", sent: "green", visible: "green", hidden: "red", accepted: "green", declined: "red", withdrawn: "grey", superseded: "grey", closed: "grey",
};
const statusText: Record<string, string> = {
  submitted: "Pending verification", under_review: "Under review", more_info_required: "More information required",
  approved: "Verified", rejected: "Rejected", active: "Active", suspended: "Suspended",
  open: "Open", booked: "Booked", cancelled: "Cancelled", confirmed: "Confirmed", in_progress: "In progress", completed: "Completed",
  proposed: "Proposed", pending: "Pending", paid: "Paid", failed: "Failed", refund_due: "Refund due", refunded: "Refunded", sent: "Sent", visible: "Visible", hidden: "Hidden", accepted: "Accepted", declined: "Declined", withdrawn: "Withdrawn", superseded: "Replaced", closed: "Closed",
};
export const statusName = (s: string) => statusText[s] ?? s;

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-[13px] font-medium ${tones[statusTone[status] ?? "grey"]}`}>
      {statusText[status] ?? status}
    </span>
  );
}

export function PageHeader({ title, text, actions }: { title: string; text?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {text && <p className="mt-1 max-w-2xl text-slate">{text}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ title, children, right, className = "" }: { title?: string; children: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-md border border-line bg-white shadow-[0_1px_0_rgba(0,29,87,0.04)] ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
          <h2 className="font-display text-base font-bold">{title}</h2>
          {right}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function SampleTag() {
  return <span className="rounded border border-gold-deep bg-[#fff1e6] px-2 py-0.5 text-xs font-semibold">Sample data</span>;
}

export function NotConnected({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-dashed border-ink/25 bg-white/60 p-4 text-[15px] leading-relaxed text-slate">{children}</p>;
}

export function Notice({ tone, children }: { tone: "ok" | "error" | "info"; children: React.ReactNode }) {
  const c = tone === "ok" ? "border-[#1f5c36] bg-[#e8f3ec]" : tone === "error" ? "border-[#b3261e] bg-[#fdf0ee] text-[#9c2019]" : "border-line bg-white";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`mb-6 rounded-md border p-4 font-medium ${c}`}>
      {children}
    </p>
  );
}

export const inputCls = "w-full rounded-md border border-ink/25 bg-white px-3 py-2.5 text-[15px]";

export function Pagination({ sp, page, total, base }: { sp: SP; page: number; total: number; base: string }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const link = "rounded-md border border-ink/20 px-3 py-1.5 text-[15px] hover:bg-ink/5";
  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[15px] text-slate">
      <p>{total === 0 ? "No results" : `Showing ${from} to ${to} of ${total}`}</p>
      <div className="flex gap-2">
        {page > 1 ? <Link className={link} href={`${base}${qs(sp, { page: String(page - 1) })}`}>Previous</Link> : null}
        {page < pages ? <Link className={link} href={`${base}${qs(sp, { page: String(page + 1) })}`}>Next</Link> : null}
      </div>
    </nav>
  );
}

export function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th scope="col" className={`px-4 py-3 text-left text-sm font-semibold text-slate ${className}`}>{children}</th>;
}
export const Td = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 align-top text-[15px] ${className}`}>{children}</td>
);

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-line bg-white">
      <table className="w-full min-w-[640px] border-collapse">{children}</table>
    </div>
  );
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="rounded-md border border-line bg-white px-6 py-12 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-md text-slate">{text}</p>}
    </div>
  );
}
