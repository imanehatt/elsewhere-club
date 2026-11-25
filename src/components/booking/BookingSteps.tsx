import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Request", "Approved", "Sign agreement", "Secure your spot", "Confirmed"];

/** Progress tracker shown at the top of every traveler booking page. */
export function BookingSteps({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] sm:gap-2.5" aria-label="Booking progress">
      {STEPS.map((s, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={s} className="flex shrink-0 items-center gap-1.5 sm:gap-2" aria-current={now ? "step" : undefined}>
            <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[11px]", done ? "bg-olive text-ivory" : now ? "bg-terracotta text-ivory" : "bg-olive/10 text-olive/50")}>
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={cn(now ? "text-olive" : done ? "text-olive/70" : "text-olive/40", now ? "inline" : "hidden sm:inline")}>{s}</span>
            {i < STEPS.length - 1 && <span className="h-px w-3 bg-olive/15 sm:w-5" />}
          </li>
        );
      })}
    </ol>
  );
}
