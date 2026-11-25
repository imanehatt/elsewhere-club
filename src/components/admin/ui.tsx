"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminState } from "@/app/admin/actions";

export function Submit({ children, className, variant = "primary" }: { children: React.ReactNode; className?: string; variant?: "primary" | "ghost" | "danger" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-60",
        variant === "primary" && "bg-olive text-ivory hover:bg-ink",
        variant === "ghost" && "border border-olive/15 text-olive hover:bg-sand",
        variant === "danger" && "text-terracotta-dark hover:bg-terracotta/10",
        className,
      )}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Notice({ state }: { state: AdminState }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta-dark">{state.error}</p>;
  if (state.ok) return <p role="status" className="rounded-xl bg-sage-light px-4 py-3 text-sm text-olive">{state.ok}</p>;
  return null;
}

/** Asks "are you sure?" before submitting destructive forms. */
export function ConfirmSubmit({ message, children, className }: { message: string; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={cn("rounded-full px-4 py-2 text-sm text-terracotta-dark transition hover:bg-terracotta/10", className)}
    >
      {children}
    </button>
  );
}

/** A <select> that saves as soon as it changes. */
export function AutoSubmitSelect({ name, defaultValue, options, label }: { name: string; defaultValue: string; options: { value: string; label: string }[]; label: string }) {
  return (
    <select
      name={name}
      aria-label={label}
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="rounded-full border border-olive/15 bg-white px-3 py-1.5 text-xs font-medium text-olive"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
