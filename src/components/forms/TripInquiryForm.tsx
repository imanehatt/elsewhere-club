"use client";

import { useState } from "react";
import { Info, Plane } from "lucide-react";
import { submitTripInquiry } from "@/app/actions";
import { countryNames } from "@/lib/countries";
import { FLIGHT_DISCLAIMER } from "@/lib/utils";
import { cabinClasses, cabinLabels } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { a11y, Consent, Field, FormMessage, SpamTraps, SubmitButton, SuccessPanel, useLuxForm } from "./FormKit";

export interface InquiryTrip {
  id: string;
  title: string;
  datesLabel: string;
  destination: string; // pre-filled, read-only flight destination
  startDate: string | null;
  endDate: string | null;
}

/**
 * mode "booking" = Request Your Spot on a bookable trip (full legal details for the agreement).
 * mode "interest" = waitlist / register interest.
 */
export function TripInquiryForm({ trip, cta, successTitle, mode = "interest" }: { trip: InquiryTrip; cta: string; successTitle: string; mode?: "booking" | "interest" }) {
  const booking = mode === "booking";
  const { state, onSubmit, pending, errors } = useLuxForm(submitTripInquiry);
  const [flights, setFlights] = useState<"yes" | "no">("no");
  const [travellers, setTravellers] = useState("1");

  if (state.status === "success") return <SuccessPanel title={successTitle} message={state.message} />;

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-6">
      <SpamTraps />
      <input type="hidden" name="trip_id" value={trip.id} />

      {booking && (
        <div role="note" className="flex gap-3 rounded-2xl bg-champagne-light p-4 text-sm leading-relaxed text-olive">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
          <p><strong>Submitting a request does not guarantee a confirmed booking.</strong> No payment is required at this stage. If your request is approved, we&rsquo;ll email you a secure link to review and sign your personalised booking agreement before any payment.</p>
        </div>
      )}

      {booking ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full legal name" name="full_name" hint="As shown on your passport" error={errors.full_name} className="sm:col-span-2">
            <input {...a11y("full_name", errors)} autoComplete="name" className="field" />
          </Field>
          <Field label="Email address" name="email" error={errors.email}>
            <input {...a11y("email", errors)} type="email" autoComplete="email" className="field" />
          </Field>
          <Field label="Phone number (with country code)" name="phone" error={errors.phone}>
            <input {...a11y("phone", errors)} type="tel" autoComplete="tel" placeholder="+212 600 000000" className="field" />
          </Field>
          <Field label="Country of residence" name="country" error={errors.country}>
            <select {...a11y("country", errors)} className="field" defaultValue="">
              <option value="" disabled>Select a country</option>
              {countryNames().map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Nationality" name="nationality" error={errors.nationality}>
            <select {...a11y("nationality", errors)} className="field" defaultValue="">
              <option value="" disabled>Select a country</option>
              {countryNames().map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Date of birth" name="date_of_birth" hint="Travelers must be 18+" error={errors.date_of_birth}>
            <input {...a11y("date_of_birth", errors)} type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} className="field" />
          </Field>
          <Field label="Number of travelers" name="travellers" error={errors.travellers}>
            <input {...a11y("travellers", errors)} type="number" min={1} max={12} inputMode="numeric" value={travellers} onChange={(e) => setTravellers(e.target.value)} className="field" />
          </Field>
          <Field label="Special requests" name="special_requests" optional error={errors.special_requests} className="sm:col-span-2">
            <textarea {...a11y("special_requests", errors)} rows={3} placeholder="Travelling with a friend, dietary needs, celebrating something…" className="field resize-y" />
          </Field>
        </div>
      ) : (
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="full_name" error={errors.full_name}>
          <input {...a11y("full_name", errors)} autoComplete="name" className="field" />
        </Field>
        <Field label="Email" name="email" error={errors.email}>
          <input {...a11y("email", errors)} type="email" autoComplete="email" className="field" />
        </Field>
        <Field label="WhatsApp number (with country code)" name="whatsapp" error={errors.whatsapp}>
          <input {...a11y("whatsapp", errors)} type="tel" autoComplete="tel" placeholder="+44 7700 900123" className="field" />
        </Field>
        <Field label="Country of residence" name="country" error={errors.country}>
          <select {...a11y("country", errors)} className="field" defaultValue="">
            <option value="" disabled>Select a country</option>
            {countryNames().map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Number of travelers" name="travellers" error={errors.travellers}>
          <input {...a11y("travellers", errors)} type="number" min={1} max={12} inputMode="numeric" value={travellers} onChange={(e) => setTravellers(e.target.value)} className="field" />
        </Field>
        <Field label="Special requests" name="special_requests" optional error={errors.special_requests} className="sm:col-span-2">
          <textarea {...a11y("special_requests", errors)} rows={3} placeholder="Travelling with a friend, dietary needs, celebrating something…" className="field resize-y" />
        </Field>
      </div>
      )}

      <fieldset className="rounded-2xl bg-sand/70 p-5 sm:p-6">
        <legend className="sr-only">Flights</legend>
        <p className="font-serif text-xl text-olive">Would you like us to arrange your flights too?</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {([
            ["yes", "Yes, request a flight quote"],
            ["no", "No, I’ll book my own flights"],
          ] as const).map(([v, label]) => (
            <label key={v} className={cn("flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 text-[15px] text-olive transition", flights === v ? "border-olive ring-4 ring-olive/5" : "border-olive/15")}>
              <input type="radio" name="flights" value={v} checked={flights === v} onChange={() => setFlights(v)} className="h-4 w-4 accent-terracotta" />
              {label}
            </label>
          ))}
        </div>

        {flights === "yes" && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Departure airport" name="flight_origin" error={errors.flight_origin}>
              <input {...a11y("flight_origin", errors)} placeholder="e.g. London Heathrow (LHR)" className="field" />
            </Field>
            <div>
              <span className="field-label">Destination</span>
              <p className="field bg-sand/70 text-olive-soft">{trip.destination || "To be announced"}</p>
            </div>
            <Field label="Preferred outbound date" name="flight_depart_date" error={errors.flight_depart_date}>
              <input {...a11y("flight_depart_date", errors)} type="date" defaultValue={trip.startDate ?? ""} className="field" />
            </Field>
            <Field label="Preferred return date" name="flight_return_date" error={errors.flight_return_date}>
              <input {...a11y("flight_return_date", errors)} type="date" defaultValue={trip.endDate ?? ""} className="field" />
            </Field>
            <p className="-mt-2 text-xs text-olive/60 sm:col-span-2">
              {trip.startDate ? "Dates are pre-filled from the trip — change them if you’d like to arrive earlier or stay longer." : "Add your preferred dates, or leave blank and we’ll match the trip dates once announced."}
            </p>
            <Field label="Flight class" name="flight_cabin_class" error={errors.flight_cabin_class}>
              <select {...a11y("flight_cabin_class", errors)} className="field" defaultValue="economy">
                {cabinClasses.map((c) => <option key={c} value={c}>{cabinLabels[c]}</option>)}
              </select>
            </Field>
            <Field label="Number of passengers" name="flight_passengers" error={errors.flight_passengers}>
              <input {...a11y("flight_passengers", errors)} type="number" min={1} max={12} inputMode="numeric" key={travellers} defaultValue={travellers} className="field" />
            </Field>
            <Field label="Preferred airline" name="flight_airline" optional className="sm:col-span-2">
              <input {...a11y("flight_airline", errors)} placeholder="Any" className="field" />
            </Field>
          </div>
        )}

        <p className="mt-5 flex gap-3 rounded-xl bg-white p-4 text-sm text-olive">
          <Plane className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
          {FLIGHT_DISCLAIMER}
        </p>
      </fieldset>

      {booking && (
        <p className="text-sm leading-relaxed text-olive-soft">
          Before you send your request, please read what&rsquo;s{" "}
          <a href="#included" className="underline underline-offset-2" onClick={(e) => (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close()}>not included</a>, our{" "}
          <a href="/cancellation-policy" target="_blank" className="underline underline-offset-2">Cancellation &amp; Refund Policy</a> and the{" "}
          <a href="/booking-agreement" target="_blank" className="underline underline-offset-2">Booking Agreement</a>.
        </p>
      )}
      <Consent error={errors.consent} />
      <FormMessage state={state} />
      <SubmitButton pending={pending} className="sm:w-full">{cta}</SubmitButton>
      <p className="text-center text-xs leading-relaxed text-olive/55">
        {booking
          ? "Submitting a request does not guarantee a confirmed booking. No payment is required at this stage."
          : "Submitting this form registers your interest — it isn’t a booking, and no payment is required."}
      </p>
    </form>
  );
}
