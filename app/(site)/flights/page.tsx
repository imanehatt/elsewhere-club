import type { Metadata } from "next";
import { Check, Clock, Globe2, MessageCircle, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Photo } from "@/components/Photo";
import { Reveal } from "@/components/Reveal";
import { FlightQuoteForm } from "@/components/forms/FlightQuoteForm";
import { getTrips } from "@/lib/trips";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Flights — Travel Your Way",
  description: "Request a personalised Economy, Premium Economy, Business or First Class flight quote — for an Elsewhere Club trip or any journey. No group trip needed.",
  alternates: { canonical: "/flights" },
};

const classes = [
  { name: "Economy Class", line: "Travel smart, discover more.", text: "Great-value routes and sensible connections, so more of your budget goes on the trip itself.", img: "/images/wing.jpg" },
  { name: "Business Class", line: "Elevate your journey.", text: "Lie-flat seats, lounge access and arriving ready for your first sunset. We'll compare options for you.", img: "/images/seat.jpg" },
];

const reasons = [
  "Personal, researched quotes — no automated pricing",
  "Economy, Premium Economy, Business & First Class",
  "Support with the best routes & timings",
  "Flexible-date searches on request",
  "One team for your whole trip",
];

export default async function FlightsPage({ searchParams }: { searchParams: Promise<{ trip?: string }> }) {
  const { trip: tripSlug } = await searchParams;
  const trips = await getTrips();
  const defaultTrip = trips.find((t) => t.slug === tripSlug);

  return (
    <>
      <PageHero
        eyebrow="Flights — travel your way"
        title="Flights"
        intro="Request flights with us for your trip — or any journey. Economy, Premium Economy, Business or First Class."
        image="/images/wing-sky.jpg"
        imageLabel="Plane wing above the clouds at sunset"
        tone="dusk"
      />

      <section className="py-20 sm:py-24">
        <Reveal className="container-lux grid items-center gap-10 md:grid-cols-[1fr_1.3fr]">
          <div className="relative aspect-[5/3] overflow-hidden rounded-[18px]">
            <Photo src="/images/seat.jpg" alt="Business class seat by the window" sizes="(min-width:768px) 40vw, 100vw" className="absolute inset-0" />
          </div>
          <div>
            <h2 className="display-md">Why Book Your Flights With Us?</h2>
            <ul className="mt-5 space-y-3 text-[15.5px] text-olive">
              {reasons.map((r) => (
                <li key={r} className="flex items-start gap-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-olive text-ivory"><Check className="h-3 w-3" /></span>{r}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-olive/60">Open to everyone — no group trip needed. No live prices or guaranteed discounts.</p>
          </div>
        </Reveal>
        <div className="container-lux mt-10 grid gap-6 md:grid-cols-2">
          {classes.map((c, i) => (
            <Reveal key={c.name} delay={i * 120} className="group relative overflow-hidden rounded-[var(--radius-card)]">
              <Photo src={c.img} alt={c.name} sizes="50vw" className="aspect-[4/3] transition-transform duration-[1.6s] group-hover:scale-105 sm:aspect-[16/9]" />
              <div className="absolute inset-0 bg-gradient-to-t from-olive/90 via-olive/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8 text-ivory sm:p-10">
                <p className="text-[11px] uppercase tracking-[0.22em] text-champagne">{c.name}</p>
                <h2 className="mt-2 text-3xl text-ivory sm:text-4xl">{c.line}</h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-ivory/80">{c.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="container-lux mt-5 text-sm text-olive/60">Premium Economy and First Class quotes are available too.</p>
      </section>

      <section id="quote" className="scroll-mt-20 bg-sand py-20 sm:py-28">
        <div className="container-lux grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-4">Request a personalised quote</p>
            <h2 className="display-lg">Tell us where you&apos;re flying.</h2>
            <p className="lead mt-5">No booking fees to ask, no obligation. We&apos;ll come back to you with options by email or WhatsApp.</p>
            <ul className="mt-10 space-y-5 text-sm text-olive-soft">
              <li className="flex gap-3"><Globe2 className="h-5 w-5 shrink-0 text-terracotta" strokeWidth={1.4} />Open to everyone — not just Elsewhere Club travellers.</li>
              <li className="flex gap-3"><MessageCircle className="h-5 w-5 shrink-0 text-terracotta" strokeWidth={1.4} />A real person reviews every request.</li>
              <li className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-terracotta" strokeWidth={1.4} />Fares change quickly — the sooner you ask, the more options there usually are.</li>
            </ul>
          </div>
          <div className="rounded-[var(--radius-card)] bg-ivory p-6 sm:p-10 lg:col-span-8">
            <FlightQuoteForm trips={trips.map((t) => ({ id: t.id, title: t.title }))} defaultTripId={defaultTrip?.id} />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-lux">
          <div className="rounded-[var(--radius-card)] border border-olive/10 bg-white/60 p-8 sm:p-10">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-olive"><ShieldCheck className="h-4 w-4 text-terracotta" />How our flight service works</p>
            <ul className="mt-5 grid gap-3 text-sm leading-relaxed text-olive-soft md:grid-cols-2">
              <li>• We don&apos;t show live ticket prices — every quote is researched for you personally.</li>
              <li>• Availability and fares are only confirmed at the moment of ticketing and can change until then.</li>
              <li>• We can&apos;t promise discounts, but we&apos;ll always look for competitive options.</li>
              <li>• Flights are not included in our trip prices and are quoted separately.</li>
              <li className="md:col-span-2">
                • {site.ticketingPartner
                  ? `Tickets are issued through our authorised ticketing partner, ${site.ticketingPartner}.`
                  : "Tickets will be issued through an authorised ticketing partner once appointed. Until then, we provide quotations only."}
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
