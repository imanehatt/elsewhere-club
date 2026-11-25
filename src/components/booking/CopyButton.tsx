"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value, label, dark }: { value: string; label: string; dark?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {}
      }}
      aria-label={`Copy ${label}`}
      className={dark ? "inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-ivory/25 px-3 text-xs text-ivory transition hover:bg-ivory/10" : "inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-olive/15 px-3 text-xs text-olive transition hover:bg-sand"}
    >
      {done ? <Check className="h-3.5 w-3.5 text-sage" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}
