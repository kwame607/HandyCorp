import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;
export type NotifyEvent = "inspection_proposed" | "new_request" | "quote" | "declined" | "message" | "booked" | "booking_update";
type Row = { to_email: string; to_name: string; service: string; area: string; ref: string; detail: string; path: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const first = (n: string) => n.trim().split(/\s+/)[0] || "there";

const bookingWords: Record<string, string> = { in_progress: "has started the job", completed: "has marked the job as completed" };

function compose(event: NotifyEvent, r: Row): { subject: string; lines: string[]; button: string } {
  const job = `${r.service} in ${r.area}`;
  switch (event) {
    case "inspection_proposed":
      return { subject: `A professional proposes a visit for ${job}`, lines: [`A professional wants to inspect the job before quoting (${r.ref}): ${r.detail}.`, "Open your request to read why, then approve and pay, or decline. The fee is credited to the job if you book this professional."], button: "Review proposal" };
    case "new_request":
      return { subject: `New request: ${job}`, lines: [`A customer wants a quote for ${job}.`, `“${r.detail}”`, "Open the request to reply with a quote, a question, or a decline."], button: "View request" };
    case "quote":
      return { subject: `You have a quote for ${job}`, lines: [`A professional sent a quote of ${r.detail} for your ${job} request (${r.ref}).`, "Open your request to see the details, ask questions, or accept."], button: "View quote" };
    case "declined":
      return { subject: `A professional declined your ${r.service} request`, lines: [`A professional can't take on your ${job} request (${r.ref}).${r.detail ? ` Reason: ${r.detail}` : ""}`, "Other professionals you asked can still reply."], button: "View request" };
    case "message":
      return { subject: `New message about ${job}`, lines: [`You have a new message about ${job} (${r.ref}):`, `“${r.detail}”`], button: "Read and reply" };
    case "booked":
      return { subject: `You are booked: ${job}`, lines: [`A customer accepted your quote of ${r.detail} for ${job} (${r.ref}).`, "Open Bookings for their phone number and address. The customer pays you directly."], button: "View booking" };
    case "booking_update": {
      const [status, ...why] = r.detail.split(": ");
      const text = status === "cancelled" ? `has cancelled the booking${why.length ? `. Reason: ${why.join(": ")}` : ""}` : (bookingWords[status] ?? `updated the booking to ${status}`);
      return { subject: `Booking ${r.ref} update`, lines: [`The other party ${text}.`, `Job: ${job} (${r.ref}).`], button: "View booking" };
    }
  }
}

async function send(to: string, subject: string, html: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return; // Email is optional until it is set up.
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
      signal: AbortSignal.timeout(8000),
    });
    // Log the status only. Never log addresses or message contents.
    if (!res.ok) console.error("[email] Resend refused a message:", res.status);
  } catch {
    console.error("[email] Could not reach Resend");
  }
}

// Sends the email for an event that just happened. Who gets it is decided by the
// database, which only returns recipients tied to a record the signed-in person
// is part of. A failure here never breaks the action that triggered it.
export async function notify(supabase: Supabase, event: NotifyEvent, id: string) {
  try {
    const { data } = event === "inspection_proposed" ? await supabase.rpc("inspection_notice", { p_id: id }) : await supabase.rpc("notification_info", { p_event: event, p_id: id });
    const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
    for (const r of (data ?? []) as Row[]) {
      const m = compose(event, r);
      const link = site ? `${site}${r.path}` : "";
      const text = [`Hello ${first(r.to_name)},`, "", ...m.lines, "", link || "Sign in to HandyCorp to continue.", "", "HandyCorp"].join("\n");
      const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#001d57"><p>Hello ${esc(first(r.to_name))},</p>${m.lines.map((l) => `<p>${esc(l)}</p>`).join("")}${link ? `<p><a href="${esc(link)}" style="display:inline-block;background:#e85d00;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:bold">${esc(m.button)}</a></p>` : "<p>Sign in to HandyCorp to continue.</p>"}<p style="color:#667">HandyCorp</p></div>`;
      await send(r.to_email, m.subject, html, text);
    }
  } catch {
    console.error("[email] Notification failed");
  }
}
