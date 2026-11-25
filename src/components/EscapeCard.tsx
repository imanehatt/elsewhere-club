import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import type { Trip } from "@/lib/types";
import { formatDateRange, formatPrice, isWaitlistStatus, placeLabel, statusMeta } from "@/lib/utils";
import { Photo, type PlaceholderTone } from "./Photo";

const tones: PlaceholderTone[] = ["dusk", "sage", "terracotta", "ocean", "olive"];

/** Photo trip card (matches the design mockup). `feature` shows the full description. */
export function EscapeCard({ trip, index = 0, feature = false, priority }: { trip: Trip; index?: number; feature?: boolean; priority?: boolean }) {
  const ribbon = index === 0 ? "First launch" : isWaitlistStatus(trip.status) ? "Coming soon" : statusMeta[trip.status].label;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_1px_0_rgba(52,59,49,0.07)] transition-all duration-700 ease-[var(--ease-lux)] hover:-translate-y-1.5 hover:shadow-[0_26px_50px_-30px_rgba(52,59,49,0.4)]">
      <div className="relative aspect-[2/1] overflow-hidden">
        <Photo
          src={trip.cover_image}
          alt={trip.title}
          label={`${trip.title} cover photo`}
          tone={tones[index % tones.length]}
          priority={priority}
          sizes="(min-width:768px) 50vw, 100vw"
          className="absolute inset-0 transition-transform duration-[1.6s] ease-[var(--ease-lux)] group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-md bg-ivory px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-olive">{ribbon}</span>
        {trip.inquiry_only && <span className="absolute right-4 top-4 rounded-md bg-olive/80 px-2.5 py-1 text-[11px] font-medium text-ivory backdrop-blur">Inquiry only</span>}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-end justify-between gap-4">
          <h3 className="text-2xl leading-tight">
            <Link href={`/trips/${trip.slug}`} className="after:absolute after:inset-0">{trip.title}</Link>
          </h3>
          <div className="text-right">
            <p className="text-xs text-olive/55">Price</p>
            <p className="font-serif text-2xl leading-none text-olive">{trip.price == null ? "TBC" : formatPrice(trip.price, trip.currency)}</p>
            {trip.price != null && <p className="text-xs text-olive/55">/ person</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-olive-soft">
          <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{trip.duration_days ? `${trip.duration_days} days / ${trip.duration_nights} nights` : "Duration TBA"}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{placeLabel(trip)}</span>
        </div>
        <p className="text-sm leading-relaxed text-olive-soft">{trip.short_description || (feature ? trip.description : trip.tagline)}</p>
        <div className="flex-1" />
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-olive-soft">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{formatDateRange(trip.start_date, trip.end_date)}</span>
            {typeof trip.spots_available === "number" && <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{trip.spots_available} spots left</span>}
          </div>
          <span className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-olive px-4 py-2 text-[13px] font-medium text-ivory transition group-hover:bg-ink" aria-hidden>
            {isWaitlistStatus(trip.status) ? "Join Waitlist" : "See Trip"} <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
