"use client";

import { useActionState } from "react";
import { saveTrip, type AdminState } from "@/app/admin/actions";
import type { Trip } from "@/lib/types";
import { statusMeta } from "@/lib/utils";
import { ItineraryEditor, StaysEditor } from "./ItineraryEditor";
import { Notice, Submit } from "./ui";

function Row({ label, hint, children, wide }: { label: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className="field-label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-olive/50">{hint}</p>}
    </div>
  );
}

function Card({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl bg-white p-6 ring-1 ring-olive/5">
      <legend className="sr-only">{title}</legend>
      <h2 className="font-serif text-xl">{title}</h2>
      {intro && <p className="mt-1 text-sm text-olive/60">{intro}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

const Check = ({ name, label, checked }: { name: string; label: string; checked?: boolean }) => (
  <label className="flex items-center gap-2 text-sm text-olive">
    <input type="checkbox" name={name} defaultChecked={checked} className="h-4 w-4 accent-terracotta" /> {label}
  </label>
);

export function TripForm({ trip }: { trip?: Trip }) {
  const [state, action] = useActionState<AdminState, FormData>(saveTrip, {});
  const t = trip;
  const photos = [t?.cover_image, ...(t?.gallery ?? [])].filter((x): x is string => Boolean(x));

  return (
    <form action={action} className="space-y-6">
      {t && <input type="hidden" name="id" value={t.id} />}

      <Card title="Overview">
        <Row label="Trip title" wide><input name="title" required defaultValue={t?.title} className="field" /></Row>
        <Row label="Destination" hint="Use “Coming Soon” if not decided yet"><input name="destination" required defaultValue={t?.destination ?? ""} className="field" /></Row>
        <Row label="Country" hint="Leave blank while to be announced"><input name="country" defaultValue={t?.country ?? ""} className="field" /></Row>
        <Row label="Arrival airport" hint="Pre-fills flight requests, e.g. Denpasar, Bali (DPS)"><input name="arrival_airport" defaultValue={t?.arrival_airport ?? ""} className="field" /></Row>
        <Row label="Trip type"><input name="trip_type" defaultValue={t?.trip_type ?? "Curated group travel"} className="field" /></Row>
        <Row label="URL slug" hint="Leave blank to generate from the title"><input name="slug" defaultValue={t?.slug} className="field" /></Row>
        <Row label="Short tagline"><input name="tagline" defaultValue={t?.tagline} className="field" /></Row>
        <Row label="Who it's for" hint="e.g. Girls aged 18+"><input name="audience" defaultValue={t?.audience ?? ""} className="field" /></Row>
        <Row label="Group size note" hint="e.g. Approximately 8–10 travelers (subject to confirmation)"><input name="group_note" defaultValue={t?.group_note ?? ""} className="field" /></Row>
        <Row label="Card summary" hint="Shown on trip cards" wide><input name="short_description" defaultValue={t?.short_description ?? ""} className="field" /></Row>
        <Row label="Description" wide><textarea name="description" rows={5} defaultValue={t?.description} className="field" /></Row>
        <Row label="Highlights" hint="One per line" wide><textarea name="highlights" rows={5} defaultValue={t?.highlights.join("\n")} className="field font-mono text-sm" /></Row>
      </Card>

      <Card title="Dates, price & availability" intro="Leave dates empty to show “Dates to be announced”, and price empty to show “To be confirmed”.">
        <Row label="Start date"><input name="start_date" type="date" defaultValue={t?.start_date ?? ""} className="field" /></Row>
        <Row label="End date"><input name="end_date" type="date" defaultValue={t?.end_date ?? ""} className="field" /></Row>
        <Row label="Days" hint="Calculated automatically when both dates are set"><input name="duration_days" type="number" min={1} defaultValue={t?.duration_days ?? ""} className="field" /></Row>
        <Row label="Nights"><input name="duration_nights" type="number" min={0} defaultValue={t?.duration_nights ?? ""} className="field" /></Row>
        <Row label="Price per person"><input name="price" type="number" min={0} step="1" defaultValue={t?.price ?? ""} placeholder="To be confirmed" className="field" /></Row>
        <Row label="First payment (deposit) per person" hint="E.g. 1049 for a 70% deposit on €1,499. The second payment is the price minus this."><input name="deposit_amount" type="number" min={0} step="1" defaultValue={t?.deposit_amount ?? ""} placeholder="Not set" className="field" /></Row>
        <Row label="First payment due date" hint="Pre-filled when you approve a request."><input name="deposit_due_date" type="date" defaultValue={t?.deposit_due_date ?? ""} className="field" /></Row>
        <Row label="Second payment due date" hint="Shown in booking agreements. Leave empty until confirmed."><input name="balance_due_date" type="date" defaultValue={t?.balance_due_date ?? ""} className="field" /></Row>
        <Row label="Currency" hint="Shown as e.g. €1,499 / person"><select name="currency" defaultValue={t?.currency ?? "EUR"} className="field">{["EUR", "USD", "GBP", "AUD"].map((c) => <option key={c}>{c}</option>)}</select></Row>
        <Row label="Minimum group size"><input name="group_size_min" type="number" min={1} defaultValue={t?.group_size_min ?? ""} placeholder="To be confirmed" className="field" /></Row>
        <Row label="Maximum group size"><input name="group_size_max" type="number" min={1} defaultValue={t?.group_size_max ?? ""} placeholder="To be confirmed" className="field" /></Row>
        <Row label="Spots available" hint="Leave blank until verified — only shown publicly when filled in"><input name="spots_available" type="number" min={0} defaultValue={t?.spots_available ?? ""} className="field" /></Row>
        <Row label="Status (sets the main button)">
          <select name="status" defaultValue={t?.status ?? "interest"} className="field">
            {Object.entries(statusMeta).map(([k, m]) => <option key={k} value={k}>{m.label} → “{m.cta}”</option>)}
          </select>
        </Row>
        <div className="flex flex-wrap gap-6 sm:col-span-2">
          <Check name="inquiry_only" label="Inquiry only (not yet bookable)" checked={t?.inquiry_only ?? true} />
          <Check name="published" label="Published on website" checked={t?.published ?? false} />
          <Check name="featured" label="Show on homepage" checked={t?.featured ?? false} />
        </div>
        <Row label="Sort order" hint="Lower numbers appear first"><input name="sort_order" type="number" defaultValue={t?.sort_order ?? 100} className="field" /></Row>
      </Card>

      <fieldset className="rounded-2xl bg-white p-6 ring-1 ring-olive/5">
        <legend className="sr-only">Areas</legend>
        <h2 className="font-serif text-xl">Areas & stays</h2>
        <p className="mb-4 mt-1 text-sm text-olive/60">Groups the itinerary into parts (e.g. Ubud, Uluwatu, Canggu) and draws the route map.</p>
        <StaysEditor initial={t?.stays ?? []} photos={photos} />
      </fieldset>

      <fieldset className="rounded-2xl bg-white p-6 ring-1 ring-olive/5">
        <legend className="sr-only">Itinerary</legend>
        <h2 className="font-serif text-xl">Day-by-day itinerary</h2>
        <div className="mb-4 mt-3"><Check name="itinerary_confirmed" label="Itinerary is confirmed (removes the “Provisional” labels)" checked={t?.itinerary_confirmed} /></div>
        <ItineraryEditor initial={t?.itinerary ?? []} photos={photos} />
      </fieldset>

      <Card title="Accommodation, inclusions & FAQ">
        <div className="sm:col-span-2"><Check name="accommodation_confirmed" label="Accommodation confirmed" checked={t?.accommodation_confirmed} /></div>
        <Row label="Accommodation" wide><textarea name="accommodation" rows={3} defaultValue={t?.accommodation} className="field" /></Row>
        <div className="sm:col-span-2"><Check name="inclusions_confirmed" label="Inclusions confirmed" checked={t?.inclusions_confirmed} /></div>
        <Row label="What's included" hint="One per line" wide><textarea name="included" rows={8} defaultValue={t?.included.join("\n")} className="field font-mono text-sm" /></Row>
        <Row label="Not included" hint="One per line — leave empty to use the standard list" wide><textarea name="excluded" rows={6} defaultValue={t?.excluded.join("\n")} className="field font-mono text-sm" /></Row>
        <Row label="Note under “Not included”" wide><input name="excluded_note" defaultValue={t?.excluded_note ?? ""} className="field" /></Row>
        <Row label="FAQ" hint="One per line:  Question | Answer" wide><textarea name="faqs" rows={6} defaultValue={t?.faqs.map((f) => `${f.q} | ${f.a}`).join("\n")} className="field font-mono text-sm" /></Row>
      </Card>

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl bg-ivory/95 p-4 shadow-lg ring-1 ring-olive/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <Notice state={state} />
        <Submit className="sm:ml-auto">{t ? "Save changes" : "Create trip"}</Submit>
      </div>
    </form>
  );
}
