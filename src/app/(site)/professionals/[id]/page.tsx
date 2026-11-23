import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAnonClient } from "@/lib/supabase";
import { day } from "@/lib/format";

export const metadata = { title: "Professional | HandyCorp" };

type Profile = {
  id: string; name: string; description: string; experience: string; city: string; region: string;
  services: string[]; areas: string[]; average: number | null; total: number;
  reviews: { rating: number; comment: string | null; reply: string | null; date: string; service: string; who: string }[];
};
const years: Record<string, string> = { "under-1": "Under 1 year", "1-3": "1 to 3 years", "4-9": "4 to 9 years", "10-plus": "10+ years" };
const stars = (n: number) => (<span aria-label={`${n} out of 5`}>{"★".repeat(n)}<span className="text-ink/25">{"★".repeat(5 - n)}</span></span>);

async function Body({ id }: { id: string }) {
  await connection();
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data } = await createAnonClient().rpc("public_professional_profile", { p_id: id });
  const p = data as Profile | null;
  if (!p) notFound();
  return (
    <>
      <Link href="/services" className="text-sm text-slate underline">Browse services</Link>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{p.name}</h1>
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="rounded bg-sand px-2 py-0.5 text-sm font-semibold">Verified by HandyCorp</span>
        <span className="text-slate">{years[p.experience] ?? p.experience} experience</span>
        <span className="text-slate">{p.total > 0 ? <>★ {p.average} ({p.total} review{p.total > 1 ? "s" : ""})</> : "No reviews yet"}</span>
      </p>
      <p className="mt-5 max-w-2xl whitespace-pre-wrap text-lg leading-relaxed">{p.description}</p>

      <dl className="mt-6 divide-y divide-line border-y border-line">
        <div className="grid gap-1 py-3 sm:grid-cols-4"><dt className="text-slate">Services</dt><dd className="sm:col-span-3">{p.services.length ? p.services.join(", ") : "Not listed yet"}</dd></div>
        <div className="grid gap-1 py-3 sm:grid-cols-4"><dt className="text-slate">Areas covered</dt><dd className="sm:col-span-3">{p.areas.length ? p.areas.join(", ") : "Not listed yet"}</dd></div>
      </dl>
      <div className="mt-6">
        <Link href="/request/new" className="inline-block rounded-md bg-gold px-6 py-3 font-bold hover:bg-gold-deep">Request a quote</Link>
        <p className="mt-2 text-sm text-slate">Send a request and choose this professional on the last step.</p>
      </div>

      <section className="mt-10" aria-labelledby="rv">
        <h2 id="rv" className="font-display text-xl font-bold">Reviews</h2>
        {p.reviews.length === 0 ? (
          <p className="mt-2 text-slate">No reviews yet. Reviews come only from customers who finished a job with this professional.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {p.reviews.map((r, i) => (
              <li key={i} className="rounded-md border border-line bg-white p-5">
                <p className="flex flex-wrap justify-between gap-2">{stars(r.rating)}<span className="text-sm text-slate">{r.who} · {r.service} · {day(r.date)}</span></p>
                {r.comment && <p className="mt-2 whitespace-pre-wrap">{r.comment}</p>}
                {r.reply && <p className="mt-3 border-l-4 border-line pl-3 text-slate"><strong>Reply:</strong> {r.reply}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function Page(props: PageProps<"/professionals/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <Suspense fallback={<p className="text-slate">Loading…</p>}><Resolve {...props} /></Suspense>
    </main>
  );
}

async function Resolve(props: PageProps<"/professionals/[id]">) {
  const { id } = await props.params;
  return <Body id={id} />;
}
