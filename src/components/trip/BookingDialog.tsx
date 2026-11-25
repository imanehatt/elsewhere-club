"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TripInquiryForm, type InquiryTrip } from "../forms/TripInquiryForm";

const EVENT = "open-booking";

/** Any button on the page can open the booking form. Pass `flights` to pre-select "Yes" for flights. */
export function BookingButton({ children, className, flights = false }: { children: React.ReactNode; className?: string; flights?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(EVENT, { detail: { flights } }))}
      className={cn("inline-flex items-center justify-center gap-2 rounded-full bg-olive px-7 py-3.5 text-[13px] font-medium uppercase tracking-[0.12em] text-ivory transition hover:-translate-y-0.5 hover:bg-ink", className)}
    >
      {children}
    </button>
  );
}

export function BookingDialog({ trip, heading, cta, successTitle, mode = "interest" }: { trip: InquiryTrip; heading: string; cta: string; successTitle: string; mode?: "booking" | "interest" }) {
  const ref = useRef<HTMLDialogElement>(null);
  const flightsRef = useRef(false);

  useEffect(() => {
    const open = (e: Event) => {
      flightsRef.current = Boolean((e as CustomEvent).detail?.flights);
      const d = ref.current;
      if (!d) return;
      d.showModal();
      document.body.style.overflow = "hidden";
      if (flightsRef.current) {
        const yes = d.querySelector<HTMLInputElement>('input[name="flights"][value="yes"]');
        if (yes && !yes.checked) yes.click();
      }
    };
    window.addEventListener(EVENT, open);
    if (window.location.hash === "#request") window.dispatchEvent(new CustomEvent(EVENT));
    return () => window.removeEventListener(EVENT, open);
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="booking-title"
      onClose={() => (document.body.style.overflow = "")}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto max-h-[92svh] w-[min(760px,calc(100vw-24px))] overflow-y-auto rounded-[22px] bg-ivory p-0 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.5)] backdrop:bg-ink/55 backdrop:backdrop-blur-sm"
    >
      <div className="relative p-6 sm:p-10">
        <button type="button" onClick={() => ref.current?.close()} aria-label="Close" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-olive/20 text-olive hover:bg-sand">
          <X className="h-5 w-5" />
        </button>
        <p className="eyebrow mb-2">{trip.title}</p>
        <h2 id="booking-title" className="display-md">{heading}</h2>
        <p className="mb-6 mt-2 text-sm text-olive/60">{trip.datesLabel}</p>
        <TripInquiryForm trip={trip} cta={cta} successTitle={successTitle} mode={mode} />
      </div>
    </dialog>
  );
}
