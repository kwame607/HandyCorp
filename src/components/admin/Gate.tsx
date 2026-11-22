import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import type { Permission } from "@/lib/permissions";

async function Check({ permission, next, children }: { permission: Permission; next: string; children: React.ReactNode }) {
  await requirePermission(permission, next);
  return <>{children}</>;
}

// Wraps a page that has no data of its own so only the right staff can open it.
export default function Gate(props: { permission: Permission; next: string; children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="text-slate">Loading…</p>}>
      <Check {...props} />
    </Suspense>
  );
}
