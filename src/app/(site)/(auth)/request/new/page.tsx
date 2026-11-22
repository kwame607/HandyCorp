import { Suspense } from "react";
import { connection } from "next/server";
import { requireRole } from "@/lib/auth";
import { getCatalogue } from "@/lib/catalogue";
import RequestWizard from "@/components/request/RequestWizard";

export const metadata = { title: "New request | HandyCorp" };

async function Body({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  await connection();
  const { service } = await searchParams;
  const next = `/request/new${service ? `?service=${encodeURIComponent(service)}` : ""}`;
  await requireRole("customer", "/login", next);
  const { categories, areas } = await getCatalogue();
  const services = categories.flatMap((c) => c.services.map((s) => ({ slug: s.slug, name: s.name, category: c.name })));
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Request a professional</h1>
      <p className="mt-2 mb-8 max-w-xl text-slate">Tell us about the job. Verified professionals reply with a quote. There is nothing to pay to send a request.</p>
      <RequestWizard services={services} areas={areas} initialService={service} />
    </>
  );
}

export default function Page(props: PageProps<"/request/new">) {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12">
      <Suspense fallback={<p className="text-slate">Loading…</p>}>
        <Body searchParams={props.searchParams as Promise<{ service?: string }>} />
      </Suspense>
    </main>
  );
}
