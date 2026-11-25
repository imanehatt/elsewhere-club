"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { submitJoin } from "@/app/actions";
import { cn } from "@/lib/utils";
import { SpamTraps, useLuxForm } from "./FormKit";

/** Compact first-name + email signup used on the homepage and footer. */
export function NewsletterForm({ source, dark = false }: { source: string; dark?: boolean }) {
  const { state, onSubmit, pending, errors } = useLuxForm(submitJoin);

  if (state.status === "success") {
    return <p role="status" className={cn("rounded-2xl px-5 py-4 text-sm", dark ? "bg-ivory/10 text-ivory" : "bg-white text-olive")}>{state.message}</p>;
  }

  const input = cn(
    "w-full rounded-full border px-5 py-3.5 text-[15px] focus:outline-none focus:ring-4",
    dark ? "border-ivory/20 bg-ivory/5 text-ivory placeholder:text-ivory/40 focus:border-champagne focus:ring-champagne/10" : "border-olive/15 bg-white text-ink placeholder:text-olive/40 focus:border-terracotta focus:ring-terracotta/10",
  );

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-3">
      <SpamTraps />
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="marketing_opt_in" value="on" />
      <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
        <div>
          <label htmlFor={`${source}-first_name`} className="sr-only">First name</label>
          <input id={`${source}-first_name`} name="first_name" autoComplete="given-name" placeholder="First name" className={input} />
        </div>
        <div className="relative">
          <label htmlFor={`${source}-email`} className="sr-only">Email address</label>
          <input id={`${source}-email`} name="email" type="email" autoComplete="email" placeholder="Email address" className={cn(input, "pr-14")} />
          <button type="submit" disabled={pending} aria-label="Join the club" className={cn("absolute right-1.5 top-1.5 flex h-[42px] w-[42px] items-center justify-center rounded-full transition", dark ? "bg-champagne text-olive hover:bg-ivory" : "bg-terracotta text-ivory hover:bg-terracotta-dark")}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {(errors.first_name || errors.email || state.status === "error") && (
        <p role="alert" className={cn("text-xs", dark ? "text-champagne" : "text-terracotta-dark")}>
          {errors.first_name || errors.email || state.message}
        </p>
      )}
      <p className={cn("text-[11px]", dark ? "text-ivory/45" : "text-olive/50")}>
        Free to join. Trip announcements only — unsubscribe anytime. See our <a href="/privacy" className="underline">Privacy Policy</a>.
      </p>
    </form>
  );
}
