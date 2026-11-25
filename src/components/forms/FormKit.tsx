"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { initialFormState, type FormState } from "@/lib/form-state";
import { cn } from "@/lib/utils";
import { buttonClass } from "../Button";

type Action = (state: FormState, form: FormData) => Promise<FormState>;

/** Wraps a server action; submits without resetting the form so values survive validation errors. */
export function useLuxForm(action: Action) {
  const [state, dispatch, pending] = useActionState(action, initialFormState);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  };
  useEffect(() => {
    if (state.status === "error" && state.errors) {
      const first = Object.keys(state.errors)[0];
      const el = document.querySelector<HTMLElement>(`[name="${first}"]`);
      el?.focus({ preventScroll: false });
    }
  }, [state]);
  return { state, onSubmit, pending, errors: state.errors ?? {} };
}

/** Hidden spam traps — keep inside every public form. */
export function SpamTraps() {
  const [started, setStarted] = useState("");
  useEffect(() => setStarted(String(Date.now())), []);
  return (
    <>
      <input type="hidden" name="_started" value={started} readOnly />
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
    </>
  );
}

export function Field({
  label,
  name,
  error,
  hint,
  optional,
  className,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="field-label">
        {label} {optional && <span className="normal-case tracking-normal text-olive/40">(optional)</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-olive/50">{hint}</p>}
      {error && (
        <p id={`${name}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Props to spread on inputs so they're linked to their error message for screen readers. */
export const a11y = (name: string, errors: Record<string, string>) => ({
  id: name,
  name,
  "aria-invalid": errors[name] ? true : undefined,
  "aria-describedby": errors[name] ? `${name}-error` : undefined,
});

export function SubmitButton({ pending, children, className }: { pending: boolean; children: React.ReactNode; className?: string }) {
  return (
    <button type="submit" disabled={pending} className={buttonClass("primary", cn("w-full sm:w-auto", className))}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Sending…" : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.status !== "error" || !state.message) return null;
  return (
    <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta-dark">
      {state.message}
    </p>
  );
}

export function SuccessPanel({ title = "Request received", message, dark }: { title?: string; message?: string; dark?: boolean }) {
  return (
    <div role="status" className={cn("rounded-[var(--radius-card)] p-8 text-center sm:p-12", dark ? "bg-ivory/10 text-ivory" : "bg-sand")}>
      <CheckCircle2 className={cn("mx-auto h-10 w-10", dark ? "text-champagne" : "text-terracotta")} strokeWidth={1.25} />
      <h3 className={cn("mt-4 text-2xl sm:text-3xl", dark && "text-ivory")}>{title}</h3>
      {message && <p className={cn("mx-auto mt-3 max-w-md text-[15px] leading-relaxed", dark ? "text-ivory/80" : "text-olive-soft")}>{message}</p>}
    </div>
  );
}

export function Consent({ error }: { error?: string }) {
  return (
    <div>
      <label className="flex items-start gap-3 text-sm text-olive-soft">
        <input type="checkbox" name="consent" className="mt-0.5 h-4 w-4 shrink-0 accent-terracotta" aria-invalid={error ? true : undefined} aria-describedby={error ? "consent-error" : undefined} />
        <span>
          I agree to The Elsewhere Club storing my details to respond to this request, as described in the{" "}
          <a href="/privacy" target="_blank" className="underline underline-offset-2">Privacy Policy</a>.
        </span>
      </label>
      {error && <p id="consent-error" className="field-error" role="alert">{error}</p>}
    </div>
  );
}
