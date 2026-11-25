"use client";

import { useActionState, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { uploadProof, type TravelerState } from "@/app/booking-actions";
import { PROOF_ACCEPT, PROOF_MAX_BYTES, type PaymentKind } from "@/lib/booking/constants";
import { buttonClass } from "../Button";

export function ProofUpload({ token, kind, label = "Upload proof of payment" }: { token: string; kind: PaymentKind; label?: string }) {
  const [state, action, pending] = useActionState<TravelerState, FormData>(uploadProof.bind(null, token, kind), {});
  const [file, setFile] = useState<File | null>(null);
  const tooBig = file ? file.size > PROOF_MAX_BYTES : false;

  return (
    <form action={action} className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-olive/30 bg-white px-5 py-7 text-center transition hover:border-olive/60">
        <FileUp className="h-7 w-7 text-terracotta" strokeWidth={1.4} />
        <span className="text-[15px] font-medium text-olive">{file ? file.name : "Choose a screenshot or PDF of your transfer"}</span>
        <span className="text-xs text-olive/55">PDF, JPG, PNG, WEBP or HEIC · max 4 MB</span>
        <input type="file" name="proof" accept={PROOF_ACCEPT} className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      {tooBig && <p role="alert" className="text-sm text-terracotta-dark">That file is larger than 4 MB — please choose a smaller one.</p>}
      {state.error && <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta-dark">{state.error}</p>}
      <button type="submit" disabled={!file || tooBig || pending} className={buttonClass("primary", "w-full")}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Uploading…" : label}
      </button>
    </form>
  );
}
