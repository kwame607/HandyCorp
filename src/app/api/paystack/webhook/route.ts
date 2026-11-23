import { createHmac, timingSafeEqual } from "node:crypto";
import { verifyAndRecord } from "@/lib/paystack";

// Paystack calls this when a payment succeeds. We check the signature, then ask
// Paystack directly to confirm before recording anything.
export async function POST(request: Request) {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return new Response("Not configured", { status: 503 });

  const raw = await request.text();
  const given = request.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", key).update(raw).digest("hex");
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return new Response("Invalid signature", { status: 401 });

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (event.event === "charge.success" && typeof event.data?.reference === "string") {
    try {
      await verifyAndRecord(event.data.reference);
    } catch {
      return new Response("Try again", { status: 500 }); // Paystack retries on errors.
    }
  }
  return new Response("ok");
}
