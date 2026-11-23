"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Area } from "@/data/areas";
import { NEAR_KM, nearestArea } from "@/lib/geo";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { notifyRequestSent } from "@/app/(site)/(auth)/account/requests/actions";
import Combobox from "@/components/Combobox";
import AddressPicker, { type Place } from "./AddressPicker";

export type ServiceOption = { slug: string; name: string; category: string };
type Pro = { user_id: string; name: string; description: string; experience: string };

const steps = ["The job", "Where", "When", "Who", "Review"];
const years: Record<string, string> = { "under-1": "Under 1 year", "1-3": "1 to 3 years", "4-9": "4 to 9 years", "10-plus": "10+ years" };
const field = "mt-1 w-full rounded-md border border-ink/30 bg-white px-4 py-3 text-[16px]";
const areaLabel = (a: Area) => `${a.name} (${a.region})`;

function friendly(m?: string) {
  if (!m) return "Something went wrong. Please try again.";
  if (/not available for this request/.test(m)) return "One of the professionals is no longer available. Go back and choose again.";
  if (/Description must/.test(m)) return "Describe the job in 10 to 1000 characters.";
  if (/Choose a date/.test(m)) return "Choose a date within the next 6 months.";
  if (/Only customers/.test(m)) return "Only customer accounts can send requests.";
  return "Something went wrong. Please try again.";
}

export default function RequestWizard({ services, areas, initialService }: { services: ServiceOption[]; areas: Area[]; initialService?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [serviceText, setServiceText] = useState(services.find((s) => s.slug === initialService)?.name ?? "");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [place, setPlace] = useState<Place>({ address: "", lat: null, lng: null });
  const [areaText, setAreaText] = useState("");
  const [areaTouched, setAreaTouched] = useState(false);
  const [date, setDate] = useState("");
  const [timeNote, setTimeNote] = useState("");
  const [budget, setBudget] = useState("");
  const [pros, setPros] = useState<Pro[] | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const service = services.find((s) => s.name.toLowerCase() === serviceText.trim().toLowerCase());
  const area = areas.find((a) => areaLabel(a).toLowerCase() === areaText.trim().toLowerCase());
  const serviceOptions = useMemo(() => services.map((s) => ({ value: s.name, hint: s.category })), [services]);
  const areaOptions = useMemo(() => areas.map((a) => ({ value: areaLabel(a) })), [areas]);

  // Suggest the nearest area when a pin is placed, unless the customer already picked one.
  function onPlace(p: Place) {
    setPlace(p);
    if (areaTouched || p.lat == null || p.lng == null || (p.lat === place.lat && p.lng === place.lng)) return;
    const n = nearestArea([p.lat, p.lng], areas);
    if (n && n.km <= NEAR_KM) setAreaText(areaLabel(n.area));
  }

  function check(i: number): string {
    if (i === 0) {
      if (!service) return "Choose a service from the list.";
      if (description.trim().length < 10) return "Describe the job in at least 10 characters.";
    }
    if (i === 1) {
      if (place.address.trim().length < 3) return "Enter the address of the job.";
      if (!area) return "Choose the area from the list.";
    }
    if (i === 2 && budget && !(Number(budget) > 0)) return "Enter a budget above zero, or leave it empty.";
    return "";
  }

  async function next() {
    const problem = check(step);
    setError(problem);
    if (problem) return;
    if (step === 2 && service && area) {
      setPros(null);
      const { data, error: e } = await createBrowserSupabase().rpc("eligible_professionals", { p_service_slug: service.slug, p_area_slug: area.slug });
      if (e) return setError("Could not load professionals. Please try again.");
      const list = (data ?? []) as Pro[];
      setPros(list);
      setChosen(list.slice(0, 3).map((p) => p.user_id));
    }
    setStep(step + 1);
    window.scrollTo({ top: 0 });
  }

  function addFiles(list: FileList | null) {
    const picked = Array.from(list ?? []);
    const ok = picked.filter((f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 5 * 1024 * 1024);
    if (ok.length < picked.length) setError("Photos must be JPG, PNG or WebP, up to 5 MB each.");
    setFiles((cur) => [...cur, ...ok].slice(0, 6));
  }

  async function send() {
    if (!service || !area) return;
    setBusy(true);
    setError("");
    const supabase = createBrowserSupabase();
    const { data: me } = await supabase.auth.getUser();
    const uid = me.user?.id;
    if (!uid) {
      setBusy(false);
      return setError("Your session ended. Sign in again to send the request.");
    }
    const photos: { path: string; name: string }[] = [];
    for (const f of files) {
      const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
      const path = `${uid}/${crypto.randomUUID()}-${safe}`;
      const { error: up } = await supabase.storage.from("request-uploads").upload(path, f, { contentType: f.type });
      if (up) {
        setBusy(false);
        return setError("A photo could not be uploaded. Remove it or try again.");
      }
      photos.push({ path, name: f.name });
    }
    const { data, error: e } = await supabase.rpc("create_service_request", {
      p_service_slug: service.slug,
      p_area_slug: area.slug,
      p_description: description.trim(),
      p_address: place.address.trim(),
      p_lat: place.lat,
      p_lng: place.lng,
      p_date: date || null,
      p_time_note: timeNote.trim() || null,
      p_budget: budget ? Number(budget) : null,
      p_professionals: chosen,
      p_photos: photos,
    });
    if (e || !data) {
      if (photos.length) await supabase.storage.from("request-uploads").remove(photos.map((p) => p.path));
      setBusy(false);
      return setError(friendly(e?.message));
    }
    // Email the professionals. If email is not set up or fails, the request is still sent.
    await notifyRequestSent(String(data)).catch(() => {});
    router.push(`/account/requests/${data}?sent=1`);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <ol className="mb-8 flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label="Progress">
        {steps.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={i === step ? "font-bold text-ink" : i < step ? "text-ink" : "text-slate"}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-5">
          <div>
            <label htmlFor="svc" className="font-semibold">Service</label>
            <div className="mt-1 flex">
              <Combobox name="service" value={serviceText} onChange={setServiceText} options={serviceOptions} placeholder="Start typing, for example plumber" max={10} className="w-full rounded-md border border-ink/30 bg-white px-4 py-3 text-[16px]" />
            </div>
          </div>
          <label className="block">
            <span className="font-semibold">What needs doing?</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={1000} className={field} placeholder="Describe the problem and what you want done." />
            <span className="text-sm text-slate">{description.length}/1000</span>
          </label>
          <div>
            <span className="font-semibold">Photos (optional)</span>
            <p className="text-sm text-slate">Up to 6 photos help professionals quote accurately.</p>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} className="mt-2 block w-full text-sm" />
            {files.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 rounded border border-line bg-white px-3 py-1.5">
                    <span className="truncate">{f.name}</span>
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="shrink-0 font-semibold text-ink underline">Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <AddressPicker value={place} onChange={onPlace} />
          <div>
            <label className="font-semibold">Area</label>
            <p className="text-sm text-slate">We use this to find professionals who work near you. Pick the closest one.</p>
            <div className="mt-1 flex">
              <Combobox name="area" value={areaText} onChange={(v) => { setAreaText(v); setAreaTouched(true); }} options={areaOptions} placeholder="Start typing your area" max={10} className="w-full rounded-md border border-ink/30 bg-white px-4 py-3 text-[16px]" />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <label className="block">
            <span className="font-semibold">Preferred date (optional)</span>
            <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="font-semibold">Time or other notes (optional)</span>
            <input value={timeNote} onChange={(e) => setTimeNote(e.target.value)} maxLength={200} className={field} placeholder="For example: mornings, or after 5pm" />
          </label>
          <label className="block">
            <span className="font-semibold">Your budget in GH₵ (optional)</span>
            <input inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^0-9.]/g, ""))} className={field} placeholder="Leave empty if you are not sure" />
          </label>
        </div>
      )}

      {step === 3 && (
        <div>
          <p className="text-slate">Choose up to 3 verified professionals to send your request to. They reply with a quote, a question, or a decline. You choose who to book.</p>
          {pros && pros.length === 0 && (
            <div className="mt-4 rounded-md border border-line bg-white p-5">
              <p className="font-bold">No verified professionals cover this yet</p>
              <p className="mt-1 text-slate">You can still send the request. It will be saved on your account, and you can cancel it any time. Try a nearby area to reach more professionals.</p>
            </div>
          )}
          <ul className="mt-4 space-y-3">
            {(pros ?? []).map((p) => {
              const on = chosen.includes(p.user_id);
              return (
                <li key={p.user_id}>
                  <label className={`flex cursor-pointer gap-3 rounded-md border p-4 ${on ? "border-ink bg-white" : "border-line bg-white"}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={!on && chosen.length >= 3}
                      onChange={() => setChosen(on ? chosen.filter((c) => c !== p.user_id) : [...chosen, p.user_id])}
                      className="mt-1 size-5 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block font-bold">{p.name} <span className="ml-1 rounded bg-sand px-2 py-0.5 text-xs font-semibold">Verified</span></span>
                      <span className="block text-sm text-slate">{years[p.experience] ?? p.experience} experience</span>
                      <span className="mt-1 line-clamp-3 block text-[15px]">{p.description}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {step === 4 && (
        <dl className="divide-y divide-line border-y border-line">
          {[
            ["Service", service?.name],
            ["Job", description.trim()],
            ["Photos", files.length ? `${files.length} attached` : "None"],
            ["Address", place.address.trim()],
            ["Area", area ? areaLabel(area) : ""],
            ["Date", date || "Flexible"],
            ["Notes", timeNote.trim() || "None"],
            ["Budget", budget ? `GH₵ ${Number(budget).toLocaleString()}` : "Not given"],
            ["Sent to", chosen.length ? `${chosen.length} professional${chosen.length > 1 ? "s" : ""}` : "Nobody yet"],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-3 py-3"><dt className="text-slate">{k}</dt><dd className="col-span-2 whitespace-pre-wrap break-words">{v}</dd></div>
          ))}
        </dl>
      )}

      {error && <p role="alert" className="mt-5 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800">{error}</p>}

      <div className="mt-8 flex flex-wrap gap-3">
        {step > 0 && <button type="button" disabled={busy} onClick={() => { setError(""); setStep(step - 1); }} className="rounded-md border border-ink px-6 py-3 font-semibold hover:bg-ink hover:text-paper">Back</button>}
        {step < 4 ? (
          <button type="button" onClick={next} className="rounded-md bg-gold px-6 py-3 font-bold hover:bg-gold-deep">Continue</button>
        ) : (
          <button type="button" disabled={busy} onClick={send} className="rounded-md bg-gold px-6 py-3 font-bold hover:bg-gold-deep disabled:opacity-60">{busy ? "Sending…" : "Send request"}</button>
        )}
      </div>
    </div>
  );
}
