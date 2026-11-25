"use client";

import { useState } from "react";
import { submitFlightQuote } from "@/app/actions";
import { cabinClasses, cabinLabels } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { a11y, Consent, Field, FormMessage, SpamTraps, SubmitButton, SuccessPanel, useLuxForm } from "./FormKit";

export function FlightQuoteForm({ trips, defaultTripId }: { trips: { id: string; title: string }[]; defaultTripId?: string }) {
  const { state, onSubmit, pending, errors } = useLuxForm(submitFlightQuote);
  const [tripType, setTripType] = useState<"round_trip" | "one_way">("round_trip");
  const [forTrip, setForTrip] = useState(Boolean(defaultTripId));
  const today = new Date().toISOString().slice(0, 10);

  if (state.status === "success") return <SuccessPanel title="Quote request received" message={state.message} />;

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-8">
      <SpamTraps />

      <fieldset>
        <legend className="field-label">Journey type</legend>
        <div className="inline-flex rounded-full bg-sand p-1">
          {(["round_trip", "one_way"] as const).map((t) => (
            <label key={t} className={cn("cursor-pointer rounded-full px-5 py-2.5 text-[13px] font-medium transition", tripType === t ? "bg-olive text-ivory shadow" : "text-olive")}>
              <input type="radio" name="trip_type" value={t} checked={tripType === t} onChange={() => setTripType(t)} className="sr-only" />
              {t === "round_trip" ? "Round trip" : "One way"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="From" name="origin" error={errors.origin}>
          <input {...a11y("origin", errors)} placeholder="City or airport, e.g. London (LHR)" className="field" />
        </Field>
        <Field label="To" name="destination" error={errors.destination}>
          <input {...a11y("destination", errors)} placeholder="e.g. Denpasar, Bali (DPS)" className="field" />
        </Field>
        <Field label="Departure date" name="depart_date" error={errors.depart_date}>
          <input {...a11y("depart_date", errors)} type="date" min={today} className="field" />
        </Field>
        <Field label="Return date" name="return_date" error={errors.return_date}>
          <input {...a11y("return_date", errors)} type="date" min={today} disabled={tripType === "one_way"} className="field disabled:opacity-40" />
        </Field>
        <Field label="Adults" name="adults" error={errors.adults}>
          <input {...a11y("adults", errors)} type="number" min={1} max={9} defaultValue={1} inputMode="numeric" className="field" />
        </Field>
        <Field label="Children (under 12)" name="children" error={errors.children}>
          <input {...a11y("children", errors)} type="number" min={0} max={9} defaultValue={0} inputMode="numeric" className="field" />
        </Field>
        <Field label="Cabin class" name="cabin_class" error={errors.cabin_class}>
          <select {...a11y("cabin_class", errors)} className="field" defaultValue="economy">
            {cabinClasses.map((c) => <option key={c} value={c}>{cabinLabels[c]}</option>)}
          </select>
        </Field>
        <Field label="Preferred airline" name="preferred_airline" optional>
          <input {...a11y("preferred_airline", errors)} placeholder="Any" className="field" />
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="field-label">Are your dates flexible?</legend>
          <div className="flex gap-3">
            {["yes", "no"].map((v) => (
              <label key={v}>
                <input type="radio" name="flexible_dates" value={v} defaultChecked={v === "no"} className="peer sr-only" />
                <span className="chip-input inline-block peer-checked:border-olive peer-checked:bg-olive peer-checked:text-ivory">{v === "yes" ? "Yes, a few days either way" : "No, fixed dates"}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="h-px bg-olive/10" />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="full_name" error={errors.full_name}>
          <input {...a11y("full_name", errors)} autoComplete="name" className="field" />
        </Field>
        <Field label="Email" name="email" error={errors.email}>
          <input {...a11y("email", errors)} type="email" autoComplete="email" className="field" />
        </Field>
        <Field label="WhatsApp (with country code)" name="whatsapp" error={errors.whatsapp} className="sm:col-span-2">
          <input {...a11y("whatsapp", errors)} type="tel" autoComplete="tel" placeholder="+44 7700 900123" className="field" />
        </Field>
        <Field label="Special requests" name="special_requests" optional className="sm:col-span-2">
          <textarea {...a11y("special_requests", errors)} rows={3} placeholder="Seat preferences, extra baggage, stopovers, accessibility needs…" className="field" />
        </Field>
      </div>

      <div className="rounded-2xl bg-sand/70 p-5">
        <label className="flex items-center gap-3 text-[15px] font-medium text-olive">
          <input type="checkbox" name="for_group_trip" checked={forTrip} onChange={(e) => setForTrip(e.target.checked)} className="h-4 w-4 accent-terracotta" />
          I&apos;m booking this flight for an Elsewhere Club group trip.
        </label>
        {forTrip && (
          <Field label="Which trip?" name="trip_id" error={errors.trip_id} className="mt-5">
            <select {...a11y("trip_id", errors)} className="field" defaultValue={defaultTripId ?? ""}>
              <option value="" disabled>Select your trip</option>
              {trips.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </Field>
        )}
      </div>

      <Consent error={errors.consent} />
      <FormMessage state={state} />
      <SubmitButton pending={pending}>Request a Personalised Quote</SubmitButton>
    </form>
  );
}
