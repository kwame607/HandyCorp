export const money = (n: number | string) => `GH₵ ${Number(n).toLocaleString("en-GH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
export const day = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
export const stamp = (d: string) => new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Only database messages we wrote ourselves are safe to show to people.
export function dbMessage(e: { code?: string; message?: string }): string {
  if (e.code === "22023" || e.code === "42501") return e.message ?? "That is not allowed.";
  return "Something went wrong. Please try again.";
}

export const statusLabel: Record<string, string> = {
  open: "Open", booked: "Booked", cancelled: "Cancelled",
  invited: "Waiting for reply", declined: "Declined", quoted: "Quote received", closed: "Closed",
  submitted: "Sent", accepted: "Accepted", withdrawn: "Withdrawn", superseded: "Replaced", 
  confirmed: "Confirmed", in_progress: "In progress", completed: "Completed",
};
