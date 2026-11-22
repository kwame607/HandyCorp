"use client";

import { useId, useRef } from "react";

// A button that asks "are you sure?" before submitting the form it sits in.
export default function ConfirmSubmit(props: {
  label: string;
  title: string;
  message: string;
  name?: string;
  value?: string;
  tone?: "primary" | "danger" | "plain";
  requires?: string; // name of a field in the same form that must be filled first
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const tone =
    props.tone === "danger"
      ? "border border-[#b3261e] text-[#9c2019] hover:bg-[#fdf0ee]"
      : props.tone === "primary"
        ? "bg-gold font-bold hover:bg-gold-deep"
        : "border border-ink/30 hover:bg-ink/5";

  function open(e: React.MouseEvent<HTMLButtonElement>) {
    if (props.requires) {
      const field = e.currentTarget.form?.elements.namedItem(props.requires) as HTMLTextAreaElement | HTMLInputElement | null;
      if (field && !field.value.trim()) {
        field.setCustomValidity("Please write a reason first.");
        field.reportValidity();
        field.oninput = () => field.setCustomValidity("");
        return;
      }
    }
    ref.current?.showModal();
  }

  return (
    <>
      <button type="button" onClick={open} className={`rounded-md px-4 py-2.5 text-[15px] font-semibold ${tone}`}>
        {props.label}
      </button>
      <dialog ref={ref} aria-labelledby={`${uid}-t`} className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-md border border-line bg-white p-0 shadow-xl backdrop:bg-ink/40">
        <div className="p-6">
          <h2 id={`${uid}-t`} className="font-display text-xl font-bold">{props.title}</h2>
          <p className="mt-2 leading-relaxed text-slate">{props.message}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => ref.current?.close()} className="rounded-md border border-ink/30 px-4 py-2.5 font-semibold hover:bg-ink/5">
              Cancel
            </button>
            <button type="submit" name={props.name} value={props.value} className={`rounded-md px-4 py-2.5 font-semibold ${props.tone === "danger" ? "bg-[#b3261e] text-white hover:bg-[#9c2019]" : "bg-gold font-bold hover:bg-gold-deep"}`}>
              Confirm
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
