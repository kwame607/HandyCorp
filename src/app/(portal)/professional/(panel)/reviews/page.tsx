import { Suspense } from "react";
import { connection } from "next/server";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { day } from "@/lib/format";
import { replyToReview } from "../requests/actions";

export const metadata = { title: "Reviews | HandyCorp" };

async function Body({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const user = await requireRole("professional", "/professional/login", "/professional/reviews");
  const s = await searchParams;
  const pick = (k: string) => (typeof s[k] === "string" ? (s[k] as string).slice(0, 200) : undefined);
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, comment, reply, created_at, bookings(service_requests(services(name)))")
    .eq("professional_id", user.id)
    .eq("status", "visible")
    .order("created_at", { ascending: false });
  const rows = data ?? [];
  const avg = rows.length ? rows.reduce((t, r) => t + r.rating, 0) / rows.length : 0;
  const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Reviews</h1>
      <p className="mt-1 text-slate">What customers say after a finished job. Each review comes from a real completed booking.</p>
      {pick("done") && <p role="status" className="mt-5 rounded-md border border-line bg-white px-4 py-3">{pick("done")}</p>}
      {pick("error") && <p role="alert" className="mt-5 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800">{pick("error")}</p>}
      {rows.length === 0 ? (
        <div className="mt-6 rounded-md border border-line bg-white px-6 py-14 text-center">
          <p className="font-display text-lg font-bold">No reviews yet</p>
          <p className="mx-auto mt-1 max-w-md text-slate">After you mark a job completed, the customer can review you. Your average rating and written reviews will appear here.</p>
        </div>
      ) : (
        <>
          <p className="mt-5 font-display text-3xl font-bold">★ {avg.toFixed(1)} <span className="text-base font-normal text-slate">from {rows.length} review{rows.length > 1 ? "s" : ""}</span></p>
          <ul className="mt-4 space-y-4">
            {rows.map((r) => {
              const svc = one(one(one(r.bookings)?.service_requests)?.services)?.name;
              return (
                <li key={r.id} className="rounded-md border border-line bg-white p-5">
                  <p className="flex flex-wrap justify-between gap-2"><span aria-label={`${r.rating} out of 5`}>{"★".repeat(r.rating)}<span className="text-ink/25">{"★".repeat(5 - r.rating)}</span></span><span className="text-sm text-slate">{svc} · {day(r.created_at)}</span></p>
                  {r.comment ? <p className="mt-2 whitespace-pre-wrap">{r.comment}</p> : <p className="mt-2 text-slate">No comment.</p>}
                  {r.reply ? (
                    <p className="mt-3 border-l-4 border-line pl-3 text-slate"><strong>Your reply:</strong> {r.reply}</p>
                  ) : (
                    <form action={replyToReview} className="mt-3 flex flex-wrap items-end gap-3">
                      <input type="hidden" name="review" value={r.id} />
                      <label className="min-w-56 flex-1"><span className="text-sm font-semibold">Reply publicly</span><input name="reply" required minLength={2} maxLength={600} className="mt-1 w-full rounded-md border border-ink/30 px-3 py-2 text-[16px]" /></label>
                      <button className="rounded-md border border-ink px-5 py-2.5 font-bold hover:bg-ink hover:text-paper">Post reply</button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/professional/reviews">) {
  return <Suspense fallback={<p className="text-slate">Loading…</p>}><Body searchParams={props.searchParams} /></Suspense>;
}
