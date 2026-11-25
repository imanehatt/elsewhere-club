import { cn, statusMeta } from "@/lib/utils";
import type { TripStatus } from "@/lib/types";

export function StatusBadge({ status, className }: { status: TripStatus; className?: string }) {
  const m = statusMeta[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]", m.className, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {m.label}
    </span>
  );
}
