"use client";

import { useEffect, useRef, useState } from "react";
import AreaPicker from "@/components/AreaPicker";
import { areaSlug } from "@/data/areas";
import type { Category } from "@/data/services";
import { experienceOptions } from "@/lib/professional-application";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { FieldError, inputClass } from "./fields";
import { Progress } from "./Progress";

type Data = {
  displayName: string;
  category: string;
  services: string[];
  description: string;
  experience: string;
  region: string;
  city: string;
  area: string;
  workAddress: string;
  coverage: string[];
  extraExperience: string;
  terms: boolean;
  accurate: boolean;
};
type Files = { photo: File[]; portfolio: File[]; certificates: File[] };
type Errors = Record<string, string>;

const MAX = 5 * 1024 * 1024;
const IMAGES = ["image/jpeg", "image/png", "image/webp"];
const heading = "font-display text-2xl font-bold tracking-tight";
const titles = ["", "", "Tell us about your work", "Where do you work?", "Show customers what you can do", "Review your information"];

function checkFiles(list: File[], allowPdf: boolean, max: number, label: string): string | undefined {
  if (list.length > max) return `Choose up to ${max} ${label}.`;
  for (const f of list) {
    const ok = IMAGES.includes(f.type) || (allowPdf && f.type === "application/pdf");
    if (!ok) return `${f.name}: use ${allowPdf ? "JPG, PNG, WebP or PDF" : "JPG, PNG or WebP"} files.`;
    if (f.size > MAX) return `${f.name} is over 5 MB. Choose a smaller file.`;
  }
}

function FilePicker(props: {
  id: string; label: string; hint: string; accept: string; multiple?: boolean;
  files: File[]; onChange: (f: File[]) => void; error?: string;
}) {
  return (
    <div>
      <label htmlFor={props.id} className="font-medium">{props.label}</label>
      <p id={`${props.id}-hint`} className="mt-1 text-sm text-slate">{props.hint}</p>
      <input
        id={props.id}
        type="file"
        accept={props.accept}
        multiple={props.multiple}
        onChange={(e) => props.onChange(Array.from(e.target.files ?? []))}
        aria-describedby={`${props.id}-hint${props.error ? ` ${props.id}-error` : ""}`}
        aria-invalid={!!props.error}
        className="mt-2 block w-full text-sm file:mr-4 file:rounded-md file:border file:border-ink/25 file:bg-white file:px-4 file:py-2.5 file:font-medium"
      />
      {props.files.length > 0 && <p className="mt-2 text-sm text-slate">{props.files.length} selected</p>}
      <FieldError id={`${props.id}-error`} message={props.error} />
    </div>
  );
}

export default function ProfessionalOnboarding({ userId, name, categories, areas }: { userId: string; name: string; categories: Category[]; areas: string[] }) {
  const [step, setStep] = useState(2);
  const [d, setD] = useState<Data>({
    displayName: "", category: "", services: [], description: "", experience: "",
    region: "Ashanti", city: "Kumasi", area: "", workAddress: "", coverage: [],
    extraExperience: "", terms: false, accurate: false,
  });
  const [files, setFiles] = useState<Files>({ photo: [], portfolio: [], certificates: [] });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const topRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { topRef.current?.focus(); }, [step, done]);

  const set = <K extends keyof Data>(k: K, v: Data[K]) => setD((p) => ({ ...p, [k]: v }));
  const toggle = (k: "services" | "coverage", v: string) =>
    setD((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));
  const category = categories.find((c) => c.slug === d.category);

  function validate(s: number): Errors {
    const e: Errors = {};
    if (s === 2) {
      if (d.displayName && (d.displayName.length < 2 || d.displayName.length > 100)) e.displayName = "Use between 2 and 100 characters.";
      if (!d.category) e.category = "Choose your main category.";
      if (d.category && d.services.length === 0) e.services = "Choose at least one service you offer.";
      if (d.description.trim().length < 20) e.description = "Write at least 20 characters about your work.";
      if (d.description.length > 600) e.description = "Keep it under 600 characters.";
      if (!d.experience) e.experience = "Choose your years of experience.";
      const p = checkFiles(files.photo, false, 1, "photo");
      if (p) e.photo = p;
    }
    if (s === 3) {
      if (d.region.trim().length < 2) e.region = "Enter your region.";
      if (d.city.trim().length < 2) e.city = "Enter your city or town.";
      if (d.area.trim().length < 2) e.area = "Enter the area you work from.";
      if (d.coverage.length === 0) e.coverage = "Choose at least one area you cover.";
    }
    if (s === 4) {
      const a = checkFiles(files.portfolio, false, 6, "work photos");
      if (a) e.portfolio = a;
      const b = checkFiles(files.certificates, true, 4, "certificates");
      if (b) e.certificates = b;
    }
    if (s === 5) {
      if (!d.terms) e.terms = "Please accept the Terms and Privacy Policy.";
      if (!d.accurate) e.accurate = "Please confirm your information is accurate.";
    }
    return e;
  }

  function go(to: number) {
    if (to > step) {
      const e = validate(step);
      setErrors(e);
      if (Object.keys(e).length) return;
    } else setErrors({});
    setStep(to);
  }

  async function submit() {
    const e = validate(5);
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const supabase = createBrowserSupabase();
      const docs: { kind: string; path: string; name: string; type: string; size: number }[] = [];
      const queue: [string, File][] = [
        ...files.photo.map((f) => ["profile_photo", f] as [string, File]),
        ...files.portfolio.map((f) => ["portfolio", f] as [string, File]),
        ...files.certificates.map((f) => ["certificate", f] as [string, File]),
      ];
      for (const [kind, f] of queue) {
        const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
        const path = `${userId}/${kind}/${crypto.randomUUID()}-${safe}`;
        const { error } = await supabase.storage.from("professional-uploads").upload(path, f, { contentType: f.type });
        if (error) throw new Error("upload");
        docs.push({ kind, path, name: f.name.slice(0, 200), type: f.type, size: f.size });
      }
      const { error } = await supabase.rpc("submit_professional_registration", {
        p_display_name: d.displayName,
        p_main_category_slug: d.category,
        p_description: d.description,
        p_experience: d.experience,
        p_region: d.region,
        p_city: d.city,
        p_area: d.area,
        p_work_address: d.workAddress,
        p_extra_experience: d.extraExperience,
        p_service_slugs: d.services,
        p_area_slugs: d.coverage.map(areaSlug),
        p_documents: docs,
      });
      if (error) throw new Error("save");
      setDone(true);
    } catch (err) {
      setErrors({
        form: err instanceof Error && err.message === "upload"
          ? "One of your files couldn't be uploaded. Check the file types and sizes, then try again."
          : "We couldn't submit your registration. Your answers are still here. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="space-y-4">
        <h1 ref={topRef} tabIndex={-1} className="font-display text-3xl font-bold tracking-tight focus:outline-none">
          Your registration has been received.
        </h1>
        <p className="text-lg leading-relaxed text-slate">
          Thank you for joining HandyCorp. We will review your professional profile and notify you about the next steps.
        </p>
        <a href="/professional/dashboard" className="inline-block rounded-md bg-gold px-6 py-3 font-bold hover:bg-gold-deep">
          Go to your dashboard
        </a>
      </div>
    );
  }

  const row = (label: string, value: string) => (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-slate">{label}</dt>
      <dd className="sm:max-w-[60%] sm:text-right">{value || "Not given"}</dd>
    </div>
  );

  return (
    <div>
      <Progress current={step} />
      <h1 ref={topRef} tabIndex={-1} className={`${heading} focus:outline-none`}>{titles[step]}</h1>
      <p className="mt-2 text-slate">Step {step} of 5, {name.split(" ")[0]}.</p>

      <div className="mt-6 space-y-6">
        {errors.form && (
          <div role="alert" className="rounded-md border border-[#b3261e] bg-[#fdf0ee] p-4 text-[15px] font-medium text-[#b3261e]">{errors.form}</div>
        )}

        {step === 2 && (
          <>
            <div>
              <label htmlFor="displayName" className="font-medium">Display name <span className="font-normal text-slate">(optional)</span></label>
              <input id="displayName" value={d.displayName} onChange={(e) => set("displayName", e.target.value)} className={inputClass} aria-invalid={!!errors.displayName} />
              <p className="mt-2 text-sm text-slate">A trade or business name customers will see.</p>
              <FieldError id="displayName-error" message={errors.displayName} />
            </div>
            <div>
              <label htmlFor="category" className="font-medium">Main category</label>
              <select id="category" value={d.category} onChange={(e) => { set("category", e.target.value); set("services", []); }} className={inputClass} aria-invalid={!!errors.category}>
                <option value="" disabled>Select</option>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
              <FieldError id="category-error" message={errors.category} />
            </div>
            {category && (
              <fieldset>
                <legend className="font-medium">Services you offer</legend>
                <FieldError id="services-error" message={errors.services} />
                <ul className="mt-2">
                  {category.services.map((s) => (
                    <li key={s.slug}>
                      <label className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-line py-2">
                        <input type="checkbox" checked={d.services.includes(s.slug)} onChange={() => toggle("services", s.slug)} className="h-5 w-5 accent-ink" />
                        {s.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            )}
            <div>
              <label htmlFor="description" className="font-medium">Short description of your work</label>
              <textarea id="description" rows={4} maxLength={600} value={d.description} onChange={(e) => set("description", e.target.value)} className={inputClass} aria-invalid={!!errors.description} />
              <FieldError id="description-error" message={errors.description} />
            </div>
            <div>
              <label htmlFor="experience" className="font-medium">Years of experience</label>
              <select id="experience" value={d.experience} onChange={(e) => set("experience", e.target.value)} className={inputClass} aria-invalid={!!errors.experience}>
                <option value="" disabled>Select</option>
                {experienceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <FieldError id="experience-error" message={errors.experience} />
            </div>
            <FilePicker id="photo" label="Profile photo (optional)" hint="A clear photo of you. JPG, PNG or WebP, up to 5 MB." accept="image/jpeg,image/png,image/webp" files={files.photo} onChange={(f) => setFiles((p) => ({ ...p, photo: f }))} error={errors.photo} />
          </>
        )}

        {step === 3 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="region" className="font-medium">Region</label>
                <input id="region" value={d.region} onChange={(e) => set("region", e.target.value)} className={inputClass} aria-invalid={!!errors.region} />
                <FieldError id="region-error" message={errors.region} />
              </div>
              <div>
                <label htmlFor="city" className="font-medium">City or town</label>
                <input id="city" value={d.city} onChange={(e) => set("city", e.target.value)} className={inputClass} aria-invalid={!!errors.city} />
                <FieldError id="city-error" message={errors.city} />
              </div>
            </div>
            <div>
              <label htmlFor="area" className="font-medium">Area</label>
              <input id="area" value={d.area} onChange={(e) => set("area", e.target.value)} className={inputClass} aria-invalid={!!errors.area} placeholder="For example, Ahodwo" />
              <FieldError id="area-error" message={errors.area} />
            </div>
            <div>
              <label htmlFor="workAddress" className="font-medium">Work or workshop address <span className="font-normal text-slate">(optional)</span></label>
              <input id="workAddress" value={d.workAddress} onChange={(e) => set("workAddress", e.target.value)} className={inputClass} maxLength={200} />
              <p className="mt-2 text-sm text-slate">Only shown to HandyCorp for review. Never tracked.</p>
            </div>
            <fieldset>
              <legend className="font-medium">Areas you cover</legend>
              <p className="mt-1 text-sm text-slate">Choose every part of Kumasi you can travel to.</p>
              <FieldError id="coverage-error" message={errors.coverage} />
              <div className="mt-3"><AreaPicker areas={areas} selected={d.coverage} onChange={(next) => set("coverage", next)} /></div>
            </fieldset>
          </>
        )}

        {step === 4 && (
          <>
            <p className="rounded-md border border-line bg-white p-4 leading-relaxed text-slate">
              Your portfolio must show work you actually did. Photos or documents that aren&apos;t yours can lead to rejection. Everything here is optional.
            </p>
            <FilePicker id="portfolio" label="Photos of your work" hint="Up to 6 images. JPG, PNG or WebP, up to 5 MB each." accept="image/jpeg,image/png,image/webp" multiple files={files.portfolio} onChange={(f) => setFiles((p) => ({ ...p, portfolio: f }))} error={errors.portfolio} />
            <FilePicker id="certificates" label="Certificates and qualifications" hint="Up to 4 files. JPG, PNG, WebP or PDF, up to 5 MB each." accept="image/jpeg,image/png,image/webp,application/pdf" multiple files={files.certificates} onChange={(f) => setFiles((p) => ({ ...p, certificates: f }))} error={errors.certificates} />
            <div>
              <label htmlFor="extra" className="font-medium">Additional experience <span className="font-normal text-slate">(optional)</span></label>
              <textarea id="extra" rows={3} maxLength={600} value={d.extraExperience} onChange={(e) => set("extraExperience", e.target.value)} className={inputClass} />
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <dl className="divide-y divide-line border-y border-line">
              {row("Display name", d.displayName)}
              {row("Main category", category?.name ?? "")}
              {row("Services", category?.services.filter((s) => d.services.includes(s.slug)).map((s) => s.name).join(", ") ?? "")}
              {row("About your work", d.description)}
              {row("Experience", experienceOptions.find((o) => o.value === d.experience)?.label ?? "")}
              {row("Location", `${d.area}, ${d.city}, ${d.region}`)}
              {row("Work address", d.workAddress)}
              {row("Areas covered", d.coverage.join(", "))}
              {row("Profile photo", files.photo.length ? files.photo[0].name : "")}
              {row("Work photos", `${files.portfolio.length} selected`)}
              {row("Certificates", `${files.certificates.length} selected`)}
              {row("Additional experience", d.extraExperience)}
            </dl>
            <p className="text-sm text-slate">Need to change something? Use Back to edit earlier steps.</p>
            <div>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={d.terms} onChange={(e) => set("terms", e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-ink" />
                <span className="leading-relaxed">I agree to the <a href="/terms" target="_blank" className="underline underline-offset-4">Terms</a> and have read the <a href="/privacy" target="_blank" className="underline underline-offset-4">Privacy Policy</a>.</span>
              </label>
              <FieldError id="terms-error" message={errors.terms} />
            </div>
            <div>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={d.accurate} onChange={(e) => set("accurate", e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-ink" />
                <span className="leading-relaxed">I confirm the information and work I&apos;ve shown are accurate and mine.</span>
              </label>
              <FieldError id="accurate-error" message={errors.accurate} />
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        {step > 2 && (
          <button type="button" disabled={busy} onClick={() => go(step - 1)} className="rounded-md border border-ink px-6 py-3.5 font-semibold hover:bg-ink hover:text-paper disabled:opacity-60">
            Back
          </button>
        )}
        {step < 5 ? (
          <button type="button" onClick={() => go(step + 1)} className="flex-1 rounded-md bg-gold px-6 py-3.5 font-bold hover:bg-gold-deep">
            Continue
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={submit} className="flex-1 rounded-md bg-gold px-6 py-3.5 font-bold hover:bg-gold-deep disabled:opacity-60">
            {busy ? "Submitting…" : "Submit Registration"}
          </button>
        )}
      </div>
    </div>
  );
}
