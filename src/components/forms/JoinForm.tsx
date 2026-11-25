"use client";

import { submitJoin } from "@/app/actions";
import { countryNames } from "@/lib/countries";
import { a11y, Field, FormMessage, SpamTraps, SubmitButton, SuccessPanel, useLuxForm } from "./FormKit";

const destinations = ["Bali", "Thailand", "Morocco", "Greece", "Mexico", "Portugal", "Japan", "Surprise me"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Chips({ name, options, label }: { name: string; options: { value: string; label: string }[]; label: string }) {
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value}>
            <input type="checkbox" name={name} value={o.value} className="peer sr-only" />
            <span className="chip-input inline-block peer-checked:border-olive peer-checked:bg-olive peer-checked:text-ivory peer-focus-visible:ring-2 peer-focus-visible:ring-terracotta">{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function JoinForm() {
  const { state, onSubmit, pending, errors } = useLuxForm(submitJoin);
  if (state.status === "success") return <SuccessPanel title="You're in." message={state.message} />;

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-7">
      <SpamTraps />
      <input type="hidden" name="source" value="join_page" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" name="first_name" error={errors.first_name}>
          <input {...a11y("first_name", errors)} autoComplete="given-name" className="field" />
        </Field>
        <Field label="Email" name="email" error={errors.email}>
          <input {...a11y("email", errors)} type="email" autoComplete="email" className="field" />
        </Field>
        <Field label="Country" name="country" optional>
          <select {...a11y("country", errors)} className="field" defaultValue="">
            <option value="">Select a country</option>
            {countryNames().map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Instagram handle" name="instagram" optional error={errors.instagram}>
          <input {...a11y("instagram", errors)} placeholder="@yourhandle" className="field" />
        </Field>
      </div>
      <Chips name="destinations" label="Where would you love to go?" options={destinations.map((d) => ({ value: d, label: d }))} />
      <Chips name="travel_months" label="When could you travel?" options={months.map((m) => ({ value: m, label: m }))} />
      <label className="flex items-start gap-3 text-sm text-olive-soft">
        <input type="checkbox" name="marketing_opt_in" defaultChecked className="mt-0.5 h-4 w-4 accent-terracotta" />
        <span>Yes, email me trip announcements and early access. Unsubscribe anytime. By joining you agree to our <a href="/privacy" className="underline">Privacy Policy</a>.</span>
      </label>
      <FormMessage state={state} />
      <SubmitButton pending={pending}>Join the Club — Free</SubmitButton>
    </form>
  );
}
