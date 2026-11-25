"use client";

import { useActionState, useCallback, useState } from "react";
import { Loader2, PenLine } from "lucide-react";
import { signAgreement, type TravelerState } from "@/app/booking-actions";
import { buttonClass } from "../Button";
import { SignaturePad } from "./SignaturePad";

export function SignForm({ token, fullName, today, disabled }: { token: string; fullName: string; today: string; disabled?: string }) {
  const [state, action, pending] = useActionState<TravelerState, FormData>(signAgreement.bind(null, token), {});
  const [agree, setAgree] = useState(false);
  const [signed, setSigned] = useState(false);
  const [name, setName] = useState("");
  const onSig = useCallback((v: boolean) => setSigned(v), []);
  const ready = agree && signed && name.trim().length > 1 && !disabled;

  return (
    <form action={action} className="space-y-6 rounded-[22px] bg-white p-6 ring-1 ring-olive/5 sm:p-10">
      <div>
        <p className="eyebrow mb-2">Electronic signature</p>
        <h2 className="display-md">Sign your agreement</h2>
      </div>

      <label className="flex items-start gap-3 rounded-2xl bg-sand/60 p-4 text-[15px] text-olive">
        <input type="checkbox" name="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)} required className="mt-1 h-5 w-5 shrink-0 accent-terracotta" />
        <span>I confirm that I have reviewed the trip details, payment schedule, and booking conditions, and I agree to this Trip Booking Agreement.</span>
      </label>

      <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
        <div>
          <label htmlFor="signer_name" className="field-label">Type your full legal name</label>
          <input id="signer_name" name="signer_name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder={fullName} className="field" required />
          <p className="mt-1.5 text-xs text-olive/50">Must match the name in the agreement: {fullName}</p>
        </div>
        <div>
          <span className="field-label">Signing date</span>
          <p className="field bg-sand/50 text-olive">{today}</p>
        </div>
      </div>

      <div>
        <span className="field-label">Draw your signature</span>
        <SignaturePad name="signature" onChange={onSig} />
      </div>

      <p className="text-xs leading-relaxed text-olive/60">
        By clicking &ldquo;Sign My Agreement&rdquo; you sign this agreement electronically. We securely store your typed name, your drawn signature, the date and time,
        the agreement version and a fingerprint of the exact text you signed, together with your IP address and browser details, as a record of your signature.
        You can download a PDF copy straight after signing.
      </p>

      {disabled && <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta-dark">{disabled}</p>}
      {state.error && <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta-dark">{state.error}</p>}

      <button type="submit" disabled={!ready || pending} className={buttonClass("primary", "w-full sm:w-auto")}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
        {pending ? "Signing…" : "Sign My Agreement"}
      </button>
    </form>
  );
}
