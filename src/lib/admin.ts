export const PAGE_SIZE = 20;

export type SP = Record<string, string | string[] | undefined>;

export const str = (v: string | string[] | undefined): string => (Array.isArray(v) ? (v[0] ?? "") : (v ?? "")).trim().slice(0, 100);

export const pageOf = (sp: SP): number => Math.min(Math.max(parseInt(str(sp.page), 10) || 1, 1), 500);

// Builds a query string from the current filters, with some values replaced.
export function qs(sp: SP, over: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  for (const k of Object.keys({ ...sp, ...over })) {
    const v = k in over ? over[k] : str(sp[k]);
    if (v) p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const dateOnly = (v: string): string | null => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

export const fmtDate = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { timeZone: "Africa/Accra", day: "numeric", month: "short", year: "numeric" }) : "Never";

export const fmtDateTime = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString("en-GB", { timeZone: "Africa/Accra", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never";

export const actionLabels: Record<string, string> = {
  "professional.status": "Changed a professional's verification status",
  "account.suspended": "Suspended an account",
  "account.active": "Reactivated an account",
  "category.create": "Created a category",
  "category.update": "Edited a category",
  "category.activate": "Activated a category",
  "category.deactivate": "Deactivated a category",
  "workrequest.approved": "Approved a request for more work",
  "workrequest.declined": "Declined a request for more work",
  "service.create": "Added a service",
  "service.activate": "Activated a service",
  "service.deactivate": "Deactivated a service",
};

// Request-time clock helpers (kept out of components so pages stay pure to read).
export const msNow = (): number => Date.now();
export const daysAgoISO = (n: number): string => new Date(Date.now() - n * 86_400_000).toISOString();

export type CustomerRow = { id: string; full_name: string; phone: string | null; email: string; status: string; created_at: string; total: number };
export type ProRow = {
  user_id: string; full_name: string; display_name: string | null; email: string; phone: string | null; category: string;
  city: string; area: string; status: string; account_status: string; submitted_at: string; total: number;
};
export type AdminRow = { id: string; full_name: string; email: string; last_sign_in_at: string | null };
