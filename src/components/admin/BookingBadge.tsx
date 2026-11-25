import { STATUS_CLASS, STATUS_LABEL, type BookingStatus } from "@/lib/booking/constants";
import { cn } from "@/lib/utils";

export function BookingBadge({ status, declined, className }: { status: BookingStatus; declined?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]", STATUS_CLASS[status], className)}>
      {status === "cancelled" && declined ? "Declined" : STATUS_LABEL[status]}
    </span>
  );
}

export function ModeBadge({ live }: { live: boolean }) {
  return live ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-olive px-3 py-1 text-xs font-medium text-ivory"><span className="h-2 w-2 rounded-full bg-sage" />Live</span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta/15 px-3 py-1 text-xs font-medium text-terracotta-dark"><span className="h-2 w-2 rounded-full bg-terracotta" />Test mode</span>
  );
}
