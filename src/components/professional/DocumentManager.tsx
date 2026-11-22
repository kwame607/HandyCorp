"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Doc = { id: string; kind: string; file_name: string; url?: string | null };

const MAX = 5 * 1024 * 1024;
const IMG = ["image/jpeg", "image/png", "image/webp"];
const kinds: Record<string, string> = { profile_photo: "Profile photo", portfolio: "Work photo", certificate: "Certificate" };

export default function DocumentManager({ userId, docs }: { userId: string; docs: Doc[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function upload(kind: "portfolio" | "certificate", e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const allowPdf = kind === "certificate";
    const bad = files.find((f) => !(IMG.includes(f.type) || (allowPdf && f.type === "application/pdf")) || f.size > MAX);
    if (files.length > 6) return setMsg({ ok: false, text: "Add up to 6 files at a time." });
    if (bad) return setMsg({ ok: false, text: `${bad.name}: use ${allowPdf ? "JPG, PNG, WebP or PDF" : "JPG, PNG or WebP"} up to 5 MB.` });
    setBusy(true);
    setMsg(null);
    const supabase = createBrowserSupabase();
    try {
      const rows: { kind: string; path: string; name: string; type: string; size: number }[] = [];
      for (const f of files) {
        const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
        const path = `${userId}/${kind}/${crypto.randomUUID()}-${safe}`;
        const { error } = await supabase.storage.from("professional-uploads").upload(path, f, { contentType: f.type });
        if (error) throw new Error("upload");
        rows.push({ kind, path, name: f.name.slice(0, 200), type: f.type, size: f.size });
      }
      const { error } = await supabase.rpc("add_professional_documents", { p_documents: rows });
      if (error) {
        await supabase.storage.from("professional-uploads").remove(rows.map((r) => r.path));
        throw new Error(/limit/i.test(error.message) ? "limit" : "save");
      }
      setMsg({ ok: true, text: "Added." });
      router.refresh();
    } catch (err) {
      const k = err instanceof Error ? err.message : "";
      setMsg({ ok: false, text: k === "limit" ? "You've reached the file limit (12 work photos, 8 certificates). Remove one first." : "We couldn't add those files. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  async function remove(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const supabase = createBrowserSupabase();
    const { data: path, error } = await supabase.rpc("remove_professional_document", { p_id: id });
    if (error) setMsg({ ok: false, text: "We couldn't remove that file. Please try again." });
    else {
      if (typeof path === "string") await supabase.storage.from("professional-uploads").remove([path]);
      setMsg({ ok: true, text: "Removed." });
      router.refresh();
    }
    setBusy(false);
  }

  const pick = "mt-2 block w-full text-sm file:mr-4 file:rounded-md file:border file:border-ink/25 file:bg-white file:px-4 file:py-2.5 file:font-medium";
  return (
    <div>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mb-4 rounded-md border p-3 text-[15px] font-medium ${msg.ok ? "border-[#1f5c36] bg-[#e8f3ec]" : "border-[#b3261e] bg-[#fdf0ee] text-[#9c2019]"}`}>{msg.text}</p>}

      {docs.length === 0 ? (
        <p className="text-slate">No files yet.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-3">
              <span className="min-w-0">
                <span className="block font-medium">{kinds[d.kind] ?? d.kind}</span>
                <span className="block break-all text-sm text-slate">{d.file_name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-[15px] font-semibold underline underline-offset-4">Open</a>}
                {d.kind !== "profile_photo" && (
                  <form onSubmit={(e) => remove(e, d.id)}>
                    <ConfirmSubmit label="Remove" tone="plain" title="Remove this file?" message={`${d.file_name} will be deleted from your profile.`} />
                  </form>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="add-portfolio" className="font-medium">Add photos of your work</label>
          <p className="text-sm text-slate">Real work you did. Up to 12 in total.</p>
          <input id="add-portfolio" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => upload("portfolio", e)} className={pick} />
        </div>
        <div>
          <label htmlFor="add-cert" className="font-medium">Add a certificate</label>
          <p className="text-sm text-slate">Photo or PDF. Up to 8 in total.</p>
          <input id="add-cert" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy} onChange={(e) => upload("certificate", e)} className={pick} />
        </div>
      </div>
      {busy && <p className="mt-3 text-sm text-slate" role="status">Working…</p>}
    </div>
  );
}
