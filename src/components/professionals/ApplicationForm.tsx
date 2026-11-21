"use client";

import { useActionState } from "react";
import {
  submitApplication,
  type ApplicationState,
} from "@/app/(site)/professionals/join/actions";
import { areas } from "@/data/areas";
import { categories } from "@/data/services";
import {
  experienceOptions,
  workModes,
  type ApplicationValues,
} from "@/lib/professional-application";

const initial: ApplicationState = { status: "idle" };

const input =
  "mt-2 w-full rounded-md border border-ink/25 bg-white px-4 py-3 text-base text-ink placeholder:text-slate focus:border-ink";
const legend = "font-display text-lg font-bold";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-[15px] font-medium text-[#b3261e]">
      {message}
    </p>
  );
}

export default function ApplicationForm({ open }: { open: boolean }) {
  const [state, action, pending] = useActionState(submitApplication, initial);
  const errors = state.errors ?? {};
  const v: Partial<ApplicationValues> = state.values ?? {};
  const hasErrors = state.status === "invalid";

  if (state.status === "received") {
    return (
      <div role="status" className="rounded-lg border border-line bg-white p-8">
        <h3 className="font-display text-2xl font-bold">Application received</h3>
        <p className="mt-3 max-w-md leading-relaxed text-slate">
          Thank you. We&apos;ll review your details and contact you on the phone
          number you gave.
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="space-y-10">
      {!open && (
        <div
          role="note"
          className="rounded-md border border-gold-deep bg-[#fff6d9] p-4 text-[15px] leading-relaxed"
        >
          <strong className="font-semibold">Applications aren&apos;t open yet.</strong>{" "}
          You can fill in this form to see how it works, but nothing is saved or
          sent.
        </div>
      )}

      {hasErrors && (
        <div
          role="alert"
          className="rounded-md border border-[#b3261e] bg-[#fdf0ee] p-4 text-[15px] font-medium text-[#b3261e]"
        >
          Some answers need fixing. Check the fields marked below.
        </div>
      )}

      {state.status === "preview" && (
        <div role="status" className="rounded-md border border-line bg-white p-5">
          <p className="font-display text-lg font-bold">Your answers look complete.</p>
          <p className="mt-1 leading-relaxed text-slate">
            Nothing was saved, because applications aren&apos;t open yet.
          </p>
        </div>
      )}

      {state.status === "error" && (
        <div role="alert" className="rounded-md border border-[#b3261e] bg-[#fdf0ee] p-4 text-[15px] font-medium text-[#b3261e]">
          {state.message}
        </div>
      )}

      {/* Honeypot, hidden from people and assistive technology. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset className="space-y-6">
        <legend className={legend}>About you</legend>

        <div>
          <label htmlFor="fullName" className="font-medium">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            defaultValue={v.fullName}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            className={input}
          />
          <FieldError id="fullName-error" message={errors.fullName} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="phone" className="font-medium">
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="024 123 4567"
              defaultValue={v.phone}
              aria-invalid={!!errors.phone}
              aria-describedby={`phone-hint${errors.phone ? " phone-error" : ""}`}
              className={input}
            />
            <p id="phone-hint" className="mt-2 text-sm text-slate">
              We&apos;ll use this to contact you.
            </p>
            <FieldError id="phone-error" message={errors.phone} />
          </div>

          <div>
            <label htmlFor="email" className="font-medium">
              Email <span className="font-normal text-slate">(optional)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={v.email}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={input}
            />
            <FieldError id="email-error" message={errors.email} />
          </div>
        </div>
      </fieldset>

      <fieldset
        aria-describedby={errors.services ? "services-error" : undefined}
      >
        <legend className={legend}>Services you offer</legend>
        <p className="mt-1 text-slate">Choose every service you can do.</p>
        <FieldError id="services-error" message={errors.services} />

        <div className="mt-5 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {categories.map((category) => (
            <div key={category.slug}>
              <p className="border-b border-line pb-2 font-semibold">
                {category.name}
              </p>
              <ul>
                {category.services.map((service) => (
                  <li key={service.slug}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-line py-2">
                      <input
                        type="checkbox"
                        name="services"
                        value={service.slug}
                        defaultChecked={v.services?.includes(service.slug)}
                        className="h-5 w-5 shrink-0 accent-ink"
                      />
                      {service.name}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset aria-describedby={errors.areas ? "areas-error" : undefined}>
        <legend className={legend}>Where you work</legend>
        <p className="mt-1 text-slate">
          We&apos;re starting in these parts of Kumasi.
        </p>
        <FieldError id="areas-error" message={errors.areas} />
        <ul className="mt-4 grid gap-x-10 sm:grid-cols-2">
          {areas.map((area) => (
            <li key={area}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-line py-2">
                <input
                  type="checkbox"
                  name="areas"
                  value={area}
                  defaultChecked={v.areas?.includes(area)}
                  className="h-5 w-5 shrink-0 accent-ink"
                />
                {area}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset className="space-y-6">
        <legend className={legend}>Your experience</legend>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="experience" className="font-medium">
              Years of experience
            </label>
            <select
              id="experience"
              name="experience"
              key={`experience-${v.experience ?? ""}`}
              defaultValue={v.experience ?? ""}
              aria-invalid={!!errors.experience}
              aria-describedby={errors.experience ? "experience-error" : undefined}
              className={input}
            >
              <option value="" disabled>
                Select
              </option>
              {experienceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <FieldError id="experience-error" message={errors.experience} />
          </div>

          <div>
            <label htmlFor="workMode" className="font-medium">
              How you usually work
            </label>
            <select
              id="workMode"
              name="workMode"
              key={`workMode-${v.workMode ?? ""}`}
              defaultValue={v.workMode ?? ""}
              aria-invalid={!!errors.workMode}
              aria-describedby={errors.workMode ? "workMode-error" : undefined}
              className={input}
            >
              <option value="" disabled>
                Select
              </option>
              {workModes.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <FieldError id="workMode-error" message={errors.workMode} />
          </div>
        </div>

        <div>
          <label htmlFor="about" className="font-medium">
            Tell us about your work{" "}
            <span className="font-normal text-slate">(optional)</span>
          </label>
          <textarea
            id="about"
            name="about"
            rows={4}
            maxLength={600}
            defaultValue={v.about}
            aria-invalid={!!errors.about}
            aria-describedby={errors.about ? "about-error" : undefined}
            className={input}
          />
          <FieldError id="about-error" message={errors.about} />
        </div>
      </fieldset>

      <div>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="consent"
            defaultChecked={v.consent}
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            className="mt-1 h-5 w-5 shrink-0 accent-ink"
          />
          <span className="leading-relaxed">
            I confirm these details are correct, and I understand HandyCorp will
            contact me about joining.
          </span>
        </label>
        <FieldError id="consent-error" message={errors.consent} />
      </div>

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gold px-8 py-4 text-base font-bold text-ink transition-colors hover:bg-gold-deep disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send application"}
        </button>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate">
          You don&apos;t need to upload ID now. We&apos;ll explain verification
          when we contact you.
        </p>
      </div>
    </form>
  );
}
