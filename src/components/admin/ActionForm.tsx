"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { CopyButton } from "../booking/CopyButton";
import { dismissLinkFlash, type BookingAdminState } from "@/app/admin/booking-actions";

type Action = (state: BookingAdminState, form: FormData) => Promise<BookingAdminState>;

/** A form wired to an admin server action, showing its result (and any generated link) underneath. */
export function ActionForm({ action, children, className, confirm, showOk = true }: { action: Action; children: React.ReactNode; className?: string; confirm?: string; showOk?: boolean }) {
  const [state, dispatch] = useActionState(action, {});
  return (
    <form
      action={dispatch}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      {state.error && <p role="alert" className="mt-3 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta-dark">{state.error}</p>}
      {showOk && state.ok && <p role="status" className="mt-3 rounded-xl bg-sage-light px-4 py-3 text-sm text-olive">{state.ok}</p>}
    </form>
  );
}

/** Shows a freshly created traveler link (passed from the server once, after the page refreshes). */
export function LinkFlash({ link, message }: { link?: string; message: string }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div role="status" className="mb-6 rounded-2xl bg-sand p-4 ring-1 ring-olive/10">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-olive">{message}</p>
        <button type="button" aria-label="Dismiss" onClick={() => { setOpen(false); void dismissLinkFlash(); }} className="text-olive/50 hover:text-olive"><X className="h-4 w-4" /></button>
      </div>
      {link && (<>
      <div className="mt-3 flex items-center gap-2">
        <input readOnly value={link} className="field py-2 text-xs" onFocus={(e) => e.currentTarget.select()} aria-label="Traveler link" />
        <CopyButton value={link} label="link" />
      </div>
      <p className="mt-2 text-xs text-olive/55">For security this link is shown only for a few minutes — we store a scrambled version of it. <a href={link} target="_blank" rel="noopener noreferrer" className="text-terracotta underline">Open traveler page</a></p>
      </>)}
    </div>
  );
}
