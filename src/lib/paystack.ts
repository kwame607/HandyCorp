import { createAnonClient } from "@/lib/supabase";

const API = "https://api.paystack.co";

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

export const paymentsConfigured = () => !!process.env.PAYSTACK_SECRET_KEY && !!process.env.PAYMENT_RECORDING_SECRET && !!process.env.NEXT_PUBLIC_SITE_URL;

async function call(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/json", ...init?.headers },
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok && body?.status === true, body };
}

// Starts a Paystack checkout. Amounts go to Paystack in pesewas (GH₵ 1 = 100).
export async function initialize(args: { email: string; amount: number; reference: string; callbackUrl: string; paymentRef: string }) {
  const { ok, body } = await call("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: args.email,
      amount: Math.round(args.amount * 100),
      currency: "GHS",
      reference: args.reference,
      callback_url: args.callbackUrl,
      metadata: { payment_ref: args.paymentRef },
    }),
  });
  const url = body?.data?.authorization_url;
  return ok && typeof url === "string" ? url : null;
}

// Asks Paystack whether this payment really succeeded, and only then records it.
// Never trust a message or a browser redirect on its own.
export async function verifyAndRecord(reference: string): Promise<"recorded" | "already_paid" | "pending" | "failed"> {
  if (!/^[A-Za-z0-9._=-]{8,100}$/.test(reference)) return "failed";
  const { ok, body } = await call(`/transaction/verify/${encodeURIComponent(reference)}`);
  if (!ok) return "failed";
  const d = body.data;
  if (d?.status !== "success") return d?.status === "failed" || d?.status === "abandoned" ? "failed" : "pending";
  if (d.currency !== "GHS" || !Number.isInteger(d.amount)) return "failed";
  const secret = process.env.PAYMENT_RECORDING_SECRET;
  if (!secret) throw new Error("PAYMENT_RECORDING_SECRET is not set");
  const { data, error } = await createAnonClient().rpc("record_gateway_payment", { p_reference: reference, p_amount_pesewas: d.amount, p_secret: secret });
  if (error) {
    console.error("[payments] Could not record a confirmed payment:", error.code);
    return "failed";
  }
  return data === "recorded" ? "recorded" : data === "already_paid" ? "already_paid" : "failed";
}
