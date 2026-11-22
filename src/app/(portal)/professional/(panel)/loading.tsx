export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <div className="h-8 w-56 rounded bg-ink/10" />
      <div className="mt-6 h-48 rounded-md border border-line bg-white" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
