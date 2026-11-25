import { Home, MapPin, Plane } from "lucide-react";
import type { ItineraryDay, Stay } from "@/lib/types";
import { dayLabel, shortRange, stayDaysLabel } from "@/lib/utils";
import { Photo } from "../Photo";
import { Reveal } from "../Reveal";
import { partId } from "./RouteMap";

function DayCard({ day, n, open, tripName }: { day: ItineraryDay; n: number; open?: boolean; tripName: string }) {
  return (
    <details id={`day-${n}`} open={open} className="group/day mb-3.5 scroll-mt-32 overflow-hidden rounded-[18px] bg-white shadow-[0_1px_0_rgba(52,59,49,0.07)]">
      <summary className="grid cursor-pointer list-none sm:grid-cols-[1fr_1.35fr] [&::-webkit-details-marker]:hidden">
        <div className="relative aspect-[16/9] overflow-hidden sm:aspect-auto sm:min-h-[220px]">
          <Photo src={day.image || null} alt={day.title} label={day.title} tone="sage" sizes="(min-width:640px) 30vw, 100vw" className="absolute inset-0" />
          <span className="absolute left-3 top-3 rounded-full bg-ivory px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-olive">Day {n}</span>
        </div>
        <div className="flex flex-col gap-1.5 p-5 sm:p-6">
          <p className="flex flex-wrap items-center gap-x-2 text-[13px] font-medium text-terracotta">
            {dayLabel(day.date)}
            {day.location && <span className="inline-flex items-center gap-1 text-olive-soft"><MapPin className="h-3.5 w-3.5" />{day.location}</span>}
          </p>
          <h3 className="text-[22px] leading-snug sm:text-[26px]">{day.title} {day.emoji}</h3>
          {(day.summary || day.description) && <p className="text-[14.5px] text-olive-soft">{day.summary || day.description}</p>}
          <span className="mt-auto inline-flex items-center gap-2 pt-3 text-[13.5px] font-medium text-olive">
            <span className="group-open/day:hidden">View day plan</span>
            <span className="hidden group-open/day:inline">Hide day plan</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-olive/20 transition group-open/day:rotate-45 group-open/day:bg-olive group-open/day:text-ivory">+</span>
          </span>
        </div>
      </summary>
      <div className="border-t border-olive/10 px-5 pb-5 sm:px-6">
        {day.timeline?.length ? (
          <ol className="relative mt-4 before:absolute before:bottom-2 before:left-[6px] before:top-2 before:w-px before:bg-olive/15 sm:before:left-[118px]">
            {day.timeline.map((b, i) => (
              <li key={i} className="relative grid gap-0.5 py-2 pl-6 sm:grid-cols-[110px_1fr] sm:gap-[22px] sm:pl-0">
                <span className={`absolute left-[2px] top-[15px] h-[9px] w-[9px] rounded-full shadow-[0_0_0_4px_#fff] sm:left-[114px] ${b.optional || b.extra_cost ? "border-2 border-sage bg-white" : "bg-terracotta"}`} />
                <span className="pt-1.5 text-[13px] font-semibold text-olive sm:text-right">{b.time}</span>
                <div>
                  <h4 className="mt-1 font-sans text-[15.5px] font-semibold text-olive">
                    {b.title}
                    {b.extra_cost ? (
                      <em className="ml-2 rounded-full bg-terracotta/15 px-2 py-0.5 align-[2px] text-[10.5px] font-semibold uppercase not-italic tracking-[0.06em] text-terracotta-dark">Optional — Extra Cost</em>
                    ) : b.optional ? (
                      <em className="ml-2 rounded-full bg-sage-light px-2 py-0.5 align-[2px] text-[10.5px] font-semibold uppercase not-italic tracking-[0.06em] text-olive">Optional</em>
                    ) : null}
                  </h4>
                  {b.items.length > 0 && <ul className="mt-1 grid list-disc gap-0.5 pl-[18px] text-[14.5px] text-olive-soft">{b.items.map((x, j) => <li key={j}>{x}</li>)}</ul>}
                </div>
              </li>
            ))}
          </ol>
        ) : null}
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-sand px-3.5 py-3 text-sm text-olive">
          {day.overnight ? <><Home className="h-4 w-4" /> Overnight: <b>{day.overnight}</b></> : <><Plane className="h-4 w-4" /> End of {tripName}</>}
        </p>
      </div>
    </details>
  );
}

/** Day-by-day itinerary, grouped into parts by stay when stays are set. */
export function Itinerary({ days, stays, tripName }: { days: ItineraryDay[]; stays: Stay[]; tripName: string }) {
  if (!stays.length) return <>{days.map((d, i) => <DayCard key={i} day={d} n={i + 1} open={i === 0} tripName={tripName} />)}</>;
  const used = new Set<number>();
  return (
    <>
      {stays.map((s, si) => {
        const last = si === stays.length - 1;
        const list = days.map((d, i) => [d, i] as const).filter(([d, i]) => !used.has(i) && d.date && d.date >= s.start && (d.date < s.end || last));
        list.forEach(([, i]) => used.add(i));
        return (
          <div key={s.name + si} id={partId(s.name)} className="mt-8 scroll-mt-32 first:mt-1">
            <Reveal className="relative isolate mb-4 flex min-h-[150px] items-end overflow-hidden rounded-[20px] px-6 py-7 text-ivory">
              <Photo src={s.image || null} alt={s.name} label={s.name} tone="olive" className="absolute inset-0 -z-20" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 to-ink/30" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-champagne">Chapter {si + 1}</p>
                <h3 className="text-4xl text-ivory sm:text-[42px]">{s.name}</h3>
                <p className="mt-1 text-[14.5px] text-ivory/85">{shortRange(s.start, s.end)} · {stayDaysLabel(s)}{s.summary ? ` — ${s.summary}` : ""}</p>
              </div>
            </Reveal>
            {list.map(([d, i]) => <DayCard key={i} day={d} n={i + 1} open={i === 0} tripName={tripName} />)}
          </div>
        );
      })}
      {days.map((d, i) => (!used.has(i) ? <DayCard key={i} day={d} n={i + 1} tripName={tripName} /> : null))}
    </>
  );
}
