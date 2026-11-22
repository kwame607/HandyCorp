export const metadata = { title: "Bookings | HandyCorp" };

const tabs = ["Upcoming", "In progress", "Completed", "Cancelled"];

export default function Page() {
  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Bookings</h1>
      <p className="mt-1 text-slate">Jobs customers book with you will appear here.</p>
      <div role="tablist" aria-label="Booking status" className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t, i) => (
          <span key={t} role="tab" aria-selected={i === 0} className={`rounded-md border px-3 py-1.5 text-sm ${i === 0 ? "border-ink bg-ink text-paper" : "border-ink/20 text-slate"}`}>{t}</span>
        ))}
      </div>
      <div className="mt-4 rounded-md border border-line bg-white px-6 py-14 text-center">
        <p className="font-display text-lg font-bold">No bookings yet</p>
        <p className="mx-auto mt-1 max-w-md text-slate">Customers can&apos;t book yet. When they can, each job will show here with the customer, the service, the agreed price and the date.</p>
      </div>
    </>
  );
}
