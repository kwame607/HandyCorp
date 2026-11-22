export const metadata = { title: "Reviews | HandyCorp" };

export default function Page() {
  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Reviews</h1>
      <p className="mt-1 text-slate">What customers say after a finished job.</p>
      <div className="mt-6 rounded-md border border-line bg-white px-6 py-14 text-center">
        <p className="font-display text-lg font-bold">No reviews yet</p>
        <p className="mx-auto mt-1 max-w-md text-slate">Customers can review you only after a completed job, so every review comes from a real booking. Your average rating and written reviews will appear here.</p>
      </div>
    </>
  );
}
