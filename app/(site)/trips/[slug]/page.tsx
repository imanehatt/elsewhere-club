import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Armchair, ArrowLeft, BedDouble, Bus, CalendarDays, Check, Clock, Flower2, Info, MapPin, MessageCircle, Mountain,
  ChefHat, Coffee, Compass, FlaskConical, PartyPopper, Plane, ShieldCheck, Sparkles, Tag, Ticket, Users, UtensilsCrossed, Waves,
} from "lucide-react";
import { Accordion } from "@/components/Accordion";
import { Gallery } from "@/components/Gallery";
import { Photo } from "@/components/Photo";
import { Reveal } from "@/components/Reveal";
import { StatusBadge } from "@/components/StatusBadge";
import { TransparencyNote } from "@/components/TransparencyNote";
import { BookingButton, BookingDialog } from "@/components/trip/BookingDialog";
import { ChapterTimeline } from "@/components/trip/ChapterTimeline";
import { Itinerary } from "@/components/trip/Itinerary";
import { partId, RouteMap } from "@/components/trip/RouteMap";
import { ALWAYS_EXCLUDED, BOOKING_TERMS, TRAVEL_REQUIREMENTS } from "@/lib/demo-trips";
import { getTripBySlug, getTrips } from "@/lib/trips";
import {
  durationLabel, FLIGHT_DISCLAIMER, formatDate, formatDateRange, formatPrice, groupSizeLabel, isWaitlistStatus, perPersonLabel, placeLabel, shortRange, statusMeta, stayDaysLabel, stripEmoji,
} from "@/lib/utils";
import { site } from "@/lib/site";
import { getOrganizerSettings, tiersComplete } from "@/lib/booking/settings";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getTrips()).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const trip = await getTripBySlug((await params).slug);
  if (!trip) return { title: "Trip not found" };
  const description = `${trip.short_description || trip.tagline} ${formatDateRange(trip.start_date, trip.end_date)}.`;
  return {
    title: `${stripEmoji(trip.title)} — ${placeLabel(trip)}`,
    description,
    alternates: { canonical: `/trips/${trip.slug}` },
    openGraph: { title: stripEmoji(trip.title), description, images: trip.cover_image ? [trip.cover_image] : undefined },
  };
}

/** Picks a fitting icon for an inclusion based on its wording. */
function incIcon(text: string) {
  const t = text.toLowerCase();
  if (/perfume/.test(t)) return FlaskConical;
  if (/pajama|party|guest-list|nightclub/.test(t)) return PartyPopper;
  if (/chef/.test(t)) return ChefHat;
  if (/breakfast/.test(t)) return Coffee;
  if (/rafting/.test(t)) return Waves;
  if (/sightseeing/.test(t)) return Compass;
  if (/accommodation|night/.test(t)) return BedDouble;
  if (/airport|flight/.test(t)) return Plane;
  if (/transport|transfer/.test(t)) return Bus;
  if (/dinner|lunch|breakfast|meal/.test(t)) return UtensilsCrossed;
  if (/yoga|pilates|spa|massage/.test(t)) return Flower2;
  if (/surf|beach|melasti|swim/.test(t)) return Waves;
  if (/ticket|entrance|dance|temple/.test(t)) return Ticket;
  if (/terrace|swing|waterfall|hike/.test(t)) return Mountain;
  if (/group|coordinator|host/.test(t)) return Users;
  return Sparkles;
}

function Pending({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="ml-3 inline-block rounded-full bg-champagne-light px-3 py-1 align-middle font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-olive">To be confirmed</span>;
}

function Section({ id, title, pending, note, children }: { id: string; title: string; pending?: boolean; note?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32 border-t border-olive/10 py-12 first:border-t-0 sm:py-14">
      <h2 className="display-md mb-6">{title}<Pending show={!!pending} /></h2>
      {pending && note && <p className="-mt-3 mb-6 text-sm text-olive/60">{note}</p>}
      {children}
    </section>
  );
}

export default async function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const trip = await getTripBySlug((await params).slug);
  if (!trip) notFound();

  const meta = statusMeta[trip.status];
  const dates = formatDateRange(trip.start_date, trip.end_date);
  const gallery = [trip.cover_image, ...trip.gallery].filter((x): x is string => Boolean(x));
  const waitlist = isWaitlistStatus(trip.status);
  const ctaLabel = waitlist ? "Join the Waitlist" : trip.status === "interest" ? "Register Your Interest" : "Request Your Spot";
  const groupText = trip.group_note || groupSizeLabel(trip);
  const excluded = trip.excluded.length ? trip.excluded : ALWAYS_EXCLUDED;
  const name = stripEmoji(trip.title);
  const bookable = trip.status === "open" || trip.status === "few_spots";
  const org = bookable ? await getOrganizerSettings() : null;
  const deposit = trip.deposit_amount;
  const balance = trip.price != null && deposit != null ? trip.price - deposit : null;

  const tabs = [
    { id: "overview", label: "Overview" },
    trip.itinerary.length > 0 && { id: "itinerary", label: "Itinerary" },
    trip.stays.length > 0 && { id: "route", label: "Route" },
    { id: "included", label: "What's Included" },
    bookable && { id: "booking-terms", label: "Booking & Cancellation" },
    trip.accommodation && { id: "stays", label: "Stays" },
    { id: "flights", label: "Flights" },
    trip.faqs.length > 0 && { id: "faqs", label: "FAQs" },
  ].filter((t): t is { id: string; label: string } => Boolean(t));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name,
    description: trip.description,
    ...(trip.start_date ? { startDate: trip.start_date, endDate: trip.end_date } : {}),
    itinerary: { "@type": "ItemList", itemListElement: trip.itinerary.map((d, i) => ({ "@type": "ListItem", position: i + 1, name: stripEmoji(d.title) })) },
    provider: { "@type": "Organization", name: site.name, url: site.url },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <div className="container-lux pt-24 sm:pt-28">
        <Link href="/trips" className="inline-flex min-h-11 items-center gap-2 text-sm text-olive hover:text-terracotta"><ArrowLeft className="h-4 w-4" /> Back to Trips</Link>
        <div className="mt-2"><Gallery images={gallery} title={name} /></div>
      </div>

      <div className="container-lux grid gap-12 pb-16 pt-8 lg:grid-cols-12 lg:pb-24">
        <div className="min-w-0 lg:col-span-8">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={trip.status} />
            {trip.inquiry_only && <span className="rounded-full bg-sand px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-olive">Inquiry only · payments not active yet</span>}
          </div>
          <h1 className="display-lg mt-3">{trip.title}</h1>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14.5px] text-olive-soft">
            <li className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{dates}</li>
            <li className="inline-flex items-center gap-2"><Clock className="h-4 w-4" />{durationLabel(trip)}</li>
            <li className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{placeLabel(trip)}</li>
            <li className="inline-flex items-center gap-2"><Users className="h-4 w-4" />{trip.trip_type}</li>
          </ul>
          {trip.price != null && (
            <p className="mt-4 inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-full bg-olive px-5 py-2 text-ivory">
              <span className="font-serif text-xl">{perPersonLabel(trip)}</span>
              <span className="text-xs text-ivory/75">International flights not included</span>
            </p>
          )}
          {(trip.audience || trip.group_note) && <p className="mt-3 text-sm text-olive/60">{[trip.audience && `For ${trip.audience.toLowerCase()}`, trip.group_note].filter(Boolean).join(" · ")}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <BookingButton className="min-w-[230px]">{ctaLabel}</BookingButton>
            <span className="text-sm text-olive/60">No payment · no obligation</span>
          </div>

          <nav aria-label="Trip sections" className="sticky top-[68px] z-20 mt-8 flex gap-1 overflow-x-auto border-b border-olive/10 bg-ivory/95 backdrop-blur">
            {tabs.map((t) => (
              <a key={t.id} href={`#${t.id}`} className="shrink-0 whitespace-nowrap border-b-2 border-transparent px-3.5 py-3.5 text-sm text-olive-soft transition hover:border-olive hover:text-olive">{t.label}</a>
            ))}
          </nav>

          {trip.inquiry_only && (
            <p className="mt-8 flex gap-3 rounded-2xl bg-champagne-light p-5 text-sm leading-relaxed text-olive">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
              <span><strong>Booking inquiries only.</strong> Payments are not active yet. Submitting the form is a booking inquiry — not a confirmed reservation. We&apos;ll contact you personally about availability and next steps.</span>
            </p>
          )}

          <Section id="overview" title="Overview">
            <div className="space-y-3">
              {trip.description.split(/\n\n+/).map((p, i) => (
                <p key={i} className={i === 0 ? "font-serif text-2xl text-olive" : "max-w-[64ch] text-[17px] leading-relaxed text-olive-soft"}>{p}</p>
              ))}
            </div>
            {trip.price != null && (
              <p className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl bg-champagne-light px-4 py-3.5 text-[15px] text-olive">
                <Tag className="h-4 w-4 text-terracotta" />
                <b className="font-serif text-xl font-medium">{perPersonLabel(trip)}</b> · {dates} · {durationLabel(trip)}
              </p>
            )}
            <ChapterTimeline stays={trip.stays} totalDays={trip.duration_days} />
            {trip.highlights.length > 0 && (
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {trip.highlights.map((h) => (
                  <li key={h} className="flex gap-3 rounded-2xl bg-sand/60 p-4 text-[15px] text-olive"><Check className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />{h}</li>
                ))}
              </ul>
            )}
            {trip.stays.length > 0 && (
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {trip.stays.map((s, i) => (
                  <a key={s.name + i} href={`#${partId(s.name)}`} className="group relative isolate flex aspect-[16/9] items-end overflow-hidden rounded-2xl p-4 text-ivory sm:aspect-[4/3]">
                    <Photo src={s.image || null} alt={s.name} label={s.name} tone="olive" sizes="(min-width:640px) 22vw, 100vw" className="absolute inset-0 -z-20 transition-transform duration-[1.4s] group-hover:scale-105" />
                    <span className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 to-transparent" />
                    <span className="grid gap-0.5">
                      <small className="text-xs opacity-85">Chapter {i + 1}</small>
                      <b className="font-serif text-2xl font-normal">{s.name}</b>
                      <small className="text-xs opacity-85">{shortRange(s.start, s.end)} · {stayDaysLabel(s)}</small>
                    </span>
                  </a>
                ))}
              </div>
            )}
          </Section>

          {trip.itinerary.length > 0 && (
            <Section id="itinerary" title="Day-by-Day Itinerary" pending={!trip.itinerary_confirmed} note="Provisional itinerary — times, venues and activities may change until confirmed with suppliers. Optional extras are clearly marked and paid separately.">
              <Itinerary days={trip.itinerary} stays={trip.stays} tripName={name} />
            </Section>
          )}

          {trip.stays.length > 0 && (
            <Section id="route" title="Your Route">
              <p className="-mt-3 mb-5 text-olive-soft">Tap a stop to jump to that part of the trip.</p>
              <RouteMap stays={trip.stays} start={trip.start_date} end={trip.end_date} />
            </Section>
          )}

          <Section id="included" title="What's Included" pending={trip.included.length > 0 && !trip.inclusions_confirmed} note="Planned package inclusions — provisional until confirmed with suppliers.">
            {trip.included.length ? (
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {trip.included.map((x) => {
                  const Icon = incIcon(x);
                  return (
                    <li key={x} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-[14.5px] text-olive">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand text-terracotta"><Icon className="h-[18px] w-[18px]" strokeWidth={1.5} /></span>
                      {x}
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-olive-soft">To be announced.</p>}
            <h3 className="mb-3.5 mt-9 text-[22px]">Not included</h3>
            <ul className="flex flex-wrap gap-2">
              {excluded.map((x) => <li key={x} className="rounded-full border border-olive/10 bg-white px-3.5 py-1.5 text-sm text-olive-soft">– {x}</li>)}
            </ul>
            {trip.excluded_note && (
              <p className="mt-4 flex gap-3 rounded-2xl bg-champagne-light p-4 text-sm text-olive"><Info className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />{trip.excluded_note}</p>
            )}
          </Section>


          {bookable && org && (
            <Section id="booking-terms" title="Booking, Payment & Cancellation">
              <ol className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Request your spot", "Send your request — it doesn’t guarantee a booking, and no payment is required."],
                  ["We review it", "If your request is approved, we email you a secure link to your personalised booking agreement."],
                  ["Sign your agreement", "Review your booking details, payment schedule and booking conditions, then sign online."],
                  ["Pay by bank transfer", deposit != null ? `First payment (deposit) ${formatPrice(deposit, trip.currency)}${trip.deposit_due_date ? ` by ${formatDate(trip.deposit_due_date)}` : ""}${balance != null ? `, then ${formatPrice(balance, trip.currency)}${trip.balance_due_date ? ` by ${formatDate(trip.balance_due_date)}` : ""}` : ""}. Upload your proof of payment each time.` : "Pay your deposit and upload your proof of payment."],
                  ["Booking confirmed", "Once the funds arrive in our official account, we confirm your booking in writing and send your receipt."],
                ].map(([k, v], i) => (
                  <li key={k} className="flex gap-4 rounded-2xl bg-white p-4">
                    <span className="font-serif text-3xl italic leading-none text-terracotta/80">{i + 1}</span>
                    <span><strong className="block text-[15px] text-olive">{k}</strong><span className="text-sm text-olive-soft">{v}</span></span>
                  </li>
                ))}
              </ol>
              <h3 className="mb-3.5 mt-9 text-[22px]">Cancellation &amp; refund policy</h3>
              {tiersComplete(org.cancellation_tiers) ? (
                <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-olive/5">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-sand text-olive"><tr><th className="px-4 py-3 font-medium">Cancellation period</th><th className="px-4 py-3 font-medium">Applicable refund</th></tr></thead>
                    <tbody className="divide-y divide-olive/10 text-olive-soft">
                      {org.cancellation_tiers.map((t) => <tr key={t.period}><td className="px-4 py-3">{t.period}</td><td className="px-4 py-3">{t.refund}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="flex gap-3 rounded-2xl bg-champagne-light p-4 text-sm text-olive"><Info className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />Any cancellation or change request must be communicated to The Elsewhere Club as soon as possible. Refunds and changes depend on the cancellation conditions communicated at booking and any applicable supplier restrictions, and any non-refundable amounts are clearly disclosed before payment.</p>
              )}
              <p className="mt-4 text-sm text-olive-soft">
                You can cancel by writing to our official email address. Read the full{" "}
                <Link href="/cancellation-policy" className="underline underline-offset-2">Cancellation &amp; Refund Policy</Link> and a sample of the{" "}
                <Link href="/booking-agreement" className="underline underline-offset-2">Booking Agreement</Link>.
              </p>
            </Section>
          )}

          {trip.accommodation && (
            <Section id="stays" title="Stays" pending={!trip.accommodation_confirmed}>
              <p className="lead">{trip.accommodation}</p>
              {trip.stays.length > 0 && (
                <div className="mt-6 grid gap-3.5 sm:grid-cols-3">
                  {trip.stays.map((s, i) => (
                    <div key={s.name + i} className="overflow-hidden rounded-2xl bg-white">
                      <div className="relative aspect-[16/10]"><Photo src={s.image || null} alt={s.name} label={s.name} tone="sage" sizes="25vw" className="absolute inset-0" /></div>
                      <div className="px-4 py-3"><b className="block text-olive">{s.name}</b><small className="text-[13px] text-olive-soft">{shortRange(s.start, s.end)} · {stayDaysLabel(s)}</small></div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          <Section id="flights" title="Add Your Flights">
            <p className="text-olive-soft">Choose &ldquo;Yes, request a flight quote&rdquo; in the booking form and we&apos;ll send you options{trip.arrival_airport ? ` to ${trip.arrival_airport}` : ""}.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { name: "Economy Class", points: ["Researched route options", "Help with timings & connections", "Booking support"] },
                { name: "Business Class", points: ["Premium comfort", "Lounge access (when available)", "Priority support"] },
              ].map((c) => (
                <div key={c.name} className="rounded-2xl border border-olive/10 bg-white p-6">
                  <div className="flex items-center gap-3 text-olive">
                    <Armchair className="h-8 w-8" strokeWidth={1.2} />
                    <div><h3 className="text-xl">{c.name}</h3><p className="text-xs text-olive/55">Price on request</p></div>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-olive-soft">
                    {c.points.map((p) => <li key={p} className="flex items-center gap-2"><Check className="h-4 w-4 text-sage" />{p}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-olive/60">{FLIGHT_DISCLAIMER}</p>
            <div className="mt-6 text-center"><BookingButton flights>Get a Flight Quote for This Trip</BookingButton></div>
          </Section>

          <Section id="policies" title="Policies & requirements">
            <Accordion
              defaultOpen={null}
              items={[
                { title: "Booking & cancellation", content: <p>{BOOKING_TERMS}</p> },
                { title: "Travel requirements & insurance", content: <p>{TRAVEL_REQUIREMENTS}</p> },
                { title: "Minimum group size", content: <p>Each trip needs a minimum number of travellers to go ahead ({groupText}). If it doesn&apos;t, you&apos;ll be offered an alternative or a full refund of anything paid.</p> },
                { title: "Who operates this trip?", content: <p>{site.operator.name ? `This trip is operated by ${site.operator.name}.` : "This trip will be operated with a licensed travel operator, named here and in your booking documents once appointed."}</p> },
              ]}
            />
          </Section>

          {trip.faqs.length > 0 && (
            <Section id="faqs" title="FAQs">
              <Accordion defaultOpen={null} items={trip.faqs.map((f) => ({ title: f.q, content: f.a }))} />
            </Section>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-28 space-y-4">
            <div className="rounded-[18px] bg-white p-7 shadow-[0_30px_60px_-40px_rgba(52,59,49,0.5)] ring-1 ring-olive/5">
              <p className="text-sm text-olive/60">Price</p>
              <p className="font-serif text-olive">
                {trip.price == null ? <span className="text-3xl">To be confirmed</span> : <><span className="text-[44px] leading-none">{formatPrice(trip.price, trip.currency)}</span> <span className="font-sans text-base text-olive-soft">/ person</span></>}
              </p>
              {trip.price != null && <p className="mt-1 text-xs text-olive/60">International flights not included</p>}
              <p className="mt-1 text-sm text-olive-soft">{dates} · {durationLabel(trip)}</p>
              <BookingButton className="mt-5 w-full">{ctaLabel}</BookingButton>
              <ul className="mt-5 space-y-2 text-sm text-olive">
                {[bookable ? "No payment to request your spot" : "No payment required", bookable ? "Sign your agreement before paying" : "Register interest — no obligation", trip.trip_type, "Flight quotes available"].map((x) => (
                  <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4 text-sage" />{x}</li>
                ))}
              </ul>
              {typeof trip.spots_available === "number" && <p className="mt-4 text-sm font-medium text-terracotta">{trip.spots_available} spots left</p>}
            </div>
            <a href={site.whatsapp ? `https://wa.me/${site.whatsapp.replace(/\D/g, "")}` : "/contact"} target={site.whatsapp ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-start gap-3 rounded-[18px] bg-sand p-5 text-olive transition hover:bg-sand-deep">
              <MessageCircle className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.4} />
              <span><strong className="block text-[15px]">Have questions?</strong><span className="text-sm text-olive-soft">{site.whatsapp ? "Chat with us on WhatsApp" : "Send us a message — we reply within two working days"}</span></span>
            </a>
            <div className="rounded-[18px] border border-olive/10 bg-white p-6">
              <h3 className="text-xl">Good to Know</h3>
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  { icon: Users, k: "Group size", v: groupText },
                  ...(trip.audience ? [{ icon: Sparkles, k: "Who it's for", v: trip.audience }] : []),
                  { icon: BedDouble, k: trip.accommodation.toLowerCase().includes("villa") ? "Luxury villas" : "Accommodation", v: trip.stays.length ? trip.stays.map((s) => `${s.name} (${stayDaysLabel(s)})`).join(" · ") + (trip.accommodation_confirmed ? "" : " — properties to be confirmed") : trip.accommodation_confirmed ? "Confirmed — see Stays" : "To be confirmed" },
                  { icon: Plane, k: "Flights", v: "Not included — quote available" },
                  { icon: Tag, k: "Price", v: perPersonLabel(trip) },
                  { icon: ShieldCheck, k: "Payment", v: bookable && deposit != null ? `Bank transfer after you sign — ${formatPrice(deposit, trip.currency)} deposit${balance != null ? `, then ${formatPrice(balance, trip.currency)}` : ""}` : "No payment required at this stage" },
                ].map((g) => (
                  <div key={g.k} className="flex gap-3">
                    <g.icon className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
                    <div className="text-olive-soft"><dt className="inline font-semibold text-olive">{g.k}: </dt><dd className="inline">{g.v}</dd></div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </aside>
      </div>

      <section id="request" className="scroll-mt-20 bg-sand py-20 sm:py-24">
        <Reveal className="container-lux">
          {waitlist ? (
            <div className="text-center">
              <h2 className="display-lg">Be the first to know.</h2>
              <p className="mx-auto mb-7 mt-3 max-w-md text-olive-soft">Join the waitlist and we&apos;ll tell you as soon as details are announced.</p>
              <BookingButton>{ctaLabel}</BookingButton>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl rounded-[24px] bg-ivory px-6 py-10 text-center sm:px-12">
              <p className="eyebrow mb-3">Book your escape</p>
              <h2 className="display-lg uppercase">{name}</h2>
              <p className="mt-3 text-olive-soft">{dates} <span className="mx-1.5 text-sage">·</span> {trip.duration_days} Days / {trip.duration_nights} Nights</p>
              {trip.price != null && <p className="mt-3 font-serif text-4xl text-olive sm:text-5xl">{formatPrice(trip.price, trip.currency)} <span className="font-sans text-base text-olive-soft">per person</span></p>}
              <p className="mx-auto mb-7 mt-3 max-w-md text-sm text-olive-soft">Submitting a request does not guarantee a confirmed booking, and no payment is required at this stage. International flights not included.</p>
              <BookingButton>{ctaLabel}</BookingButton>
            </div>
          )}
        </Reveal>
        <div className="container-lux"><TransparencyNote className="mt-12" /></div>
      </section>

      <BookingDialog
        trip={{
          id: trip.id,
          title: trip.title,
          datesLabel: `${dates} · ${durationLabel(trip)}${trip.price != null ? ` · ${formatPrice(trip.price, trip.currency)} per person` : ""}`,
          destination: trip.arrival_airport || (trip.country ? placeLabel(trip) : ""),
          startDate: trip.start_date,
          endDate: trip.end_date,
        }}
        heading={waitlist ? "Join the Waitlist" : "Request Your Spot"}
        cta={waitlist ? "Join the Waitlist" : meta.cta}
        successTitle={waitlist ? "You’re on the waitlist" : bookable ? "Your request is in" : "Your inquiry is in"}
        mode={bookable ? "booking" : "interest"}
      />
    </>
  );
}
