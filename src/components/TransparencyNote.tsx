import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** The honest small print, written in plain English. */
export function TransparencyNote({ className }: { className?: string }) {
  return (
    <aside className={cn("rounded-[var(--radius-card)] border border-olive/10 bg-white/60 p-6 sm:p-8", className)}>
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-olive">
        <Info className="h-4 w-4 text-terracotta" /> Good to know
      </p>
      <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-olive-soft md:grid-cols-2">
        <li>• <strong className="text-olive">Flights are not included</strong> in trip prices and are quoted separately.</li>
        <li>• Prices, availability and itineraries are <strong className="text-olive">subject to confirmation</strong>.</li>
        <li>• Each trip needs a <strong className="text-olive">minimum group size</strong> to go ahead.</li>
        <li>• We <strong className="text-olive">strongly advise travel insurance</strong> for every traveler.</li>
        <li>• Requesting a spot <strong className="text-olive">doesn&rsquo;t guarantee a booking</strong> and no payment is required. You&rsquo;ll sign your agreement before paying.</li>
        <li>• You&rsquo;ll see the <strong className="text-olive">full booking agreement and cancellation policy</strong> before you pay anything.</li>
      </ul>
    </aside>
  );
}
