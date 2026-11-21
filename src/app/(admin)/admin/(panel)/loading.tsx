// Shown while an admin page loads. It also gives every admin page its own loading boundary.
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <div className="h-8 w-56 rounded bg-ink/10" />
      <div className="h-4 w-80 max-w-full rounded bg-ink/5" />
      <div className="mt-6 h-64 rounded-md border border-line bg-white" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
