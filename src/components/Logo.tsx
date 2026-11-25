import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="The Elsewhere Club — home" className={cn("inline-flex items-start gap-0.5", light ? "text-ivory" : "text-olive", className)}>
      <span className="font-serif text-[14px] font-semibold uppercase leading-[1.02] tracking-[0.06em]">
        The<br />Elsewhere<br />Club
      </span>
      <svg viewBox="0 0 40 40" className="-mt-1.5 h-7 w-7" aria-hidden>
        <path d="M20 38c1-9 1-17-1-25M19 13c-5-4-11-3-14 1M19 13c-2-6-8-9-13-8M19 13c3-6 9-8 14-6M19 13c5-2 11 0 13 5M19 13c0-5 3-9 7-11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </Link>
  );
}
