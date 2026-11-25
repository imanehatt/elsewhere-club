"use client";

import { submitContact } from "@/app/actions";
import { a11y, Field, FormMessage, SpamTraps, SubmitButton, SuccessPanel, useLuxForm } from "./FormKit";

export function ContactForm() {
  const { state, onSubmit, pending, errors } = useLuxForm(submitContact);
  if (state.status === "success") return <SuccessPanel title="Message sent" message={state.message} />;
  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-5">
      <SpamTraps />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="name" error={errors.name}>
          <input {...a11y("name", errors)} autoComplete="name" className="field" />
        </Field>
        <Field label="Email" name="email" error={errors.email}>
          <input {...a11y("email", errors)} type="email" autoComplete="email" className="field" />
        </Field>
      </div>
      <Field label="Subject" name="subject" error={errors.subject}>
        <input {...a11y("subject", errors)} className="field" />
      </Field>
      <Field label="Message" name="message" error={errors.message}>
        <textarea {...a11y("message", errors)} rows={6} className="field" />
      </Field>
      <p className="text-xs text-olive/55">We use your details only to reply to you. See our <a href="/privacy" className="underline">Privacy Policy</a>.</p>
      <FormMessage state={state} />
      <SubmitButton pending={pending}>Send Message</SubmitButton>
    </form>
  );
}
