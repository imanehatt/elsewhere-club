import type { Stay } from "@/lib/types";
import { stayDaysLabel } from "@/lib/utils";
import { partId } from "./RouteMap";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const short = (iso?: string) => {
  if (!iso) return "";
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
};
const colors = ["bg-sage", "bg-terracotta", "bg-olive"];

/** Visual timeline of the trip's chapters, sized by number of days. */
export function ChapterTimeline({ stays, totalDays }: { stays: Stay[]; totalDays?: number | null }) {
  if (!stays.length) return null;
  return (
    <div className="mt-6" aria-label="Trip timeline">
      <div className="flex gap-1 overflow-hidden rounded-2xl">
        {stays.map((s, i) => (
          <a key={s.name + i} href={`#${partId(s.name)}`} style={{ flex: (s.nights || 0) + 1 }} className={`${colors[i % 3]} grid min-h-16 gap-0.5 px-3 py-3 text-ivory transition hover:brightness-110`}>
            <small className="text-[10px] uppercase tracking-[0.16em] opacity-80">Chapter {i + 1}</small>
            <b className="font-serif text-lg font-normal leading-tight sm:text-xl">{s.name}</b>
            <small className="text-xs opacity-85">{stayDaysLabel(s)}</small>
          </a>
        ))}
      </div>
      <div className="mt-1.5 flex text-[11.5px] text-olive-soft">
        <span className="mr-auto">{short(stays[0].start)}</span>
        {stays.map((s, i) => <span key={i} style={{ flex: (s.nights || 0) + 1 }} className="text-right">{short(s.end)}</span>)}
      </div>
      <p className="mt-1 text-xs text-olive/60">{totalDays ? `${totalDays} days · ` : ""}{stays.map((s, i) => `Chapter ${i + 1} ${s.name}`).join(" → ")}</p>
    </div>
  );
}
