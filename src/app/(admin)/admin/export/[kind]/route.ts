import { NextResponse } from "next/server";
import type { CustomerRow, ProRow } from "@/lib/admin";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Spreadsheet programs run text that starts with = + - @ as a formula, so defuse it.
const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(_: Request, ctx: RouteContext<"/admin/export/[kind]">) {
  const { kind } = await ctx.params;
  await requireRole("admin", "/admin/login", `/admin/${kind}`);
  const supabase = await createClient();
  const lines: string[] = [];

  if (kind === "customers") {
    lines.push(["Name", "Email", "Phone", "Registered", "Status"].map(cell).join(","));
    for (let off = 0; off < 5000; off += 100) {
      const { data } = await supabase.rpc("admin_list_customers", { p_q: "", p_status: "", p_from: null as unknown as string, p_to: null as unknown as string, p_limit: 100, p_offset: off });
      if (!data?.length) break;
      (data as CustomerRow[]).forEach((r) => lines.push([r.full_name, r.email, r.phone, r.created_at, r.status].map(cell).join(",")));
      if (data.length < 100) break;
    }
  } else if (kind === "professionals") {
    lines.push(["Name", "Display name", "Email", "Phone", "Category", "City", "Area", "Verification", "Account", "Registered"].map(cell).join(","));
    for (let off = 0; off < 5000; off += 100) {
      const { data } = await supabase.rpc("admin_list_professionals", { p_q: "", p_status: "", p_category: "", p_location: "", p_account: "", p_limit: 100, p_offset: off });
      if (!data?.length) break;
      (data as ProRow[]).forEach((r) => lines.push([r.full_name, r.display_name, r.email, r.phone, r.category, r.city, r.area, r.status, r.account_status, r.submitted_at].map(cell).join(",")));
      if (data.length < 100) break;
    }
  } else {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="handycorp-${kind}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
