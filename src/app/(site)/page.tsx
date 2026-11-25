import Link from "next/link";
import { ArrowRight, Armchair, CalendarDays, Headphones, Home as HomeIcon, Luggage, Plane, Sparkles, Tag, Users, Wine } from "lucide-react";
import { ButtonLink } from "@/components/Button";
import { EscapeCard } from "@/components/EscapeCard";
import { Photo } from "@/components/Photo";
import { Reveal } from "@/components/Reveal";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { getFeaturedTrips } from "@/lib/trips";
import { formatDateRange, perPersonLabel, stripEmoji } from "@/lib/utils";

export const revalidate = 60;

/*
 * PHOTOS: the images in /public/images come from your design mockup so the site
 * looks finished. They were AI-upscaled from the mockup — replace them with your own licensed,
 * high-resolution photos (same file names) before launch.
 */

const strip = [
  { icon: Wine, label: "Group Trips for Women" },
  { icon: Sparkles, label: "Fully Curated Itineraries" },
  { icon: HomeIcon, label: "Luxury Villas & Vetted Partners" },
  { icon: Plane, label: "Flight Booking Assistance" },
  { icon: Users, label: "A Community That Travels Together" },
];

const moments = [
  { img: "/images/villa-dusk.jpg", title: "Luxury Villas", text: "Stylish villas and pool days with the girls." },
  { img: "/images/ubud-terraces.jpg", title: "Ubud Adventures", text: "Waterfalls, rice terraces, the jungle swing and rafting." },
  { img: "/images/surf-selfcare.jpg", title: "Surf & Self-Care", text: "Surfing, Pilates, massage and a perfume workshop." },
  { img: "/images/uluwatu-cliff.jpg", title: "Uluwatu Sunsets", text: "The Kecak Fire Dance and a night at Jimbaran." },
];

const flightFeatures = [
  { icon: Armchair, label: "Economy & Business" },
  { icon: Tag, label: "Premium Economy & First" },
  { icon: Headphones, label: "Personal support" },
  { icon: CalendarDays, label: "Flexible-date searches" },
];

const steps = [
  { icon: CalendarDays, title: "1. Choose Your Trip", text: "Browse upcoming escapes with fixed dates and itineraries." },
  { icon: Plane, title: "2. Add Your Flights", text: "Ask us for a flight quote (optional)." },
  { icon: Luggage, title: "3. We Plan Everything", text: "Stays, activities, transfers, and more." },
  { icon: Users, title: "4. Travel & Connect", text: "Meet your group and make lifelong memories." },
];

export default async function HomePage() {
  const trips = await getFeaturedTrips(4);
  const bali = trips.find((t) => t.slug === "bali-girls-escape") ?? trips[0];

  return (
    <>
      {/* HERO */}
      <section className="relative isolate mt-[68px] flex min-h-[min(82svh,720px)] items-center overflow-hidden text-ivory">
        <Photo src="/images/hero-sunset.jpg" alt="Girls raising a toast in an infinity pool at sunset over the ocean" priority className="absolute inset-0 -z-10 animate-slow-zoom [&_img]:object-[62%_60%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 via-ink/45 to-transparent" />
        <div className="container-lux py-16">
          <div className="max-w-2xl animate-fade-up">
            <h1 className="display-xl italic text-ivory">Go places.<br />Find your people.</h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ivory/90 sm:text-lg">
              Curated luxury group trips for women who love travel, connection, and unforgettable experiences.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/trips" variant="light">Explore Trips <ArrowRight className="h-4 w-4" /></ButtonLink>
              <ButtonLink href="/flights" variant="outline-light">Book Your Flights <Plane className="h-4 w-4" /></ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ICON STRIP */}
      <section className="bg-sand">
        <ul className="container-lux grid grid-cols-2 gap-x-4 gap-y-6 py-7 sm:grid-cols-5">
          {strip.map((s, i) => (
            <li key={s.label} className={`flex flex-col items-center gap-2 text-center text-[13.5px] font-medium leading-snug text-olive ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}>
              <s.icon className="h-7 w-7" strokeWidth={1.3} />
              {s.label}
            </li>
          ))}
        </ul>
      </section>

      {/* PLAN YOUR NEXT ESCAPE */}
      <section className="py-20 sm:py-24">
        <div className="container-lux">
          <Reveal className="text-center">
            <h2 className="display-lg">Plan Your Next Escape</h2>
            <p className="mt-3 text-olive-soft">Choose your trip, request your spot, and let us handle the rest — including your flights.</p>
          </Reveal>
          {trips.length ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {trips.map((t, i) => (
                <Reveal key={t.id} delay={i * 100}><EscapeCard trip={t} index={i} feature={i === 0} priority={i === 0} /></Reveal>
              ))}
            </div>
          ) : (
            <p className="mt-10 text-center text-olive-soft">New escapes are being finalised — join the club to hear first.</p>
          )}
          <p className="mt-8 text-center">
            <Link href="/trips" className="inline-flex items-center gap-1.5 font-medium text-olive underline underline-offset-4">View all trips <ArrowRight className="h-4 w-4" /></Link>
          </p>
        </div>
      </section>

      {/* INSIDE THE BALI TRIP */}
      {bali && (
        <section className="pb-20 sm:pb-24">
          <div className="container-lux">
            <Reveal className="mb-8 text-center">
              <p className="eyebrow mb-3">Inside the {stripEmoji(bali.title)}</p>
              <h2 className="display-md">Luxury villas, waterfalls, self-care &amp; sunsets</h2>
              <p className="mt-2 text-olive-soft">Luxury villas in {bali.stays.map((s) => s.name).join(" · ")} — {formatDateRange(bali.start_date, bali.end_date)}{bali.price != null ? ` · ${perPersonLabel(bali)}` : ""}</p>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {moments.map((m, i) => (
                <Reveal key={m.title} delay={i * 80}>
                  <Link href={`/trips/${bali.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[18px] bg-white">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Photo src={m.img} alt={m.title} sizes="(min-width:1024px) 25vw, 50vw" className="absolute inset-0 transition-transform duration-[1.6s] group-hover:scale-105" />
                    </div>
                    <div className="px-5 pb-6 pt-4 text-center">
                      <h3 className="text-xl">{m.title}</h3>
                      <p className="mt-1.5 text-sm text-olive-soft">{m.text}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-olive/50">Illustrative images. Itinerary provisional until confirmed with suppliers.</p>
          </div>
        </section>
      )}

      {/* FLIGHTS PROMO */}
      <section className="pb-20 sm:pb-24">
        <div className="container-lux">
          <Reveal className="grid overflow-hidden rounded-[22px] bg-sand md:grid-cols-[0.9fr_1.3fr]">
            <div className="relative min-h-[220px] md:min-h-[300px]">
              <Photo src="/images/plane-sunset.jpg" alt="Plane taking off over the sea at sunset" sizes="(min-width:768px) 40vw, 100vw" className="absolute inset-0 [&_img]:object-[50%_47%]" />
            </div>
            <div className="p-7 sm:p-10">
              <span className="inline-block rounded-md bg-champagne px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-olive">New service</span>
              <h2 className="display-md mt-3 italic">Book Your Flights With Us</h2>
              <p className="mt-2 text-olive-soft">Personal flight quotes for your trip — Economy, Premium Economy, Business or First.</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-5 rounded-2xl bg-ivory/80 p-5">
                {flightFeatures.map((f) => (
                  <div key={f.label} className="flex w-24 flex-col items-center gap-1.5 text-center text-xs text-olive">
                    <f.icon className="h-6 w-6" strokeWidth={1.3} />
                    {f.label}
                  </div>
                ))}
                <ButtonLink href="/flights" className="w-full md:ml-auto md:w-auto">Request a Quote <ArrowRight className="h-4 w-4" /></ButtonLink>
              </div>
              <p className="mt-3 text-xs text-olive/55">Flights are quoted separately. All fares are subject to availability and confirmation.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-sand py-20 sm:py-24">
        <div className="container-lux">
          <Reveal className="text-center">
            <h2 className="display-lg">How It Works</h2>
            <p className="mt-3 text-olive-soft">Choose, request, and go — it&apos;s that simple.</p>
          </Reveal>
          <ol className="mt-12 flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-center md:gap-3">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 100} className="flex max-w-[240px] flex-col items-center text-center md:flex-1">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ivory text-terracotta shadow-[0_8px_20px_-14px_rgba(52,59,49,0.5)]">
                  <s.icon className="h-7 w-7" strokeWidth={1.3} />
                </span>
                <h3 className="mt-4 font-sans text-base font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-olive-soft">{s.text}</p>
              </Reveal>
            ))}
          </ol>
          <p className="mt-10 text-center"><ButtonLink href="/how-it-works" variant="ghost">The full details <ArrowRight className="h-4 w-4" /></ButtonLink></p>
        </div>
      </section>

      {/* JOIN THE CLUB */}
      <section className="relative isolate overflow-hidden py-24 sm:py-28">
        <Photo src="/images/girls-jeep-sunset.jpg" alt="Girls cheering in an open jeep on a coastal road at sunset" className="absolute inset-0 -z-10" />
        <div className="absolute inset-0 -z-10 bg-ink/55" />
        <Reveal className="container-lux text-center">
          <h2 className="display-lg text-ivory">Join The Elsewhere Club</h2>
          <p className="mx-auto mt-3 max-w-lg text-ivory/85">Be the first to hear about new trips, exclusive drops, and community events.</p>
          <div className="mx-auto mt-8 max-w-xl text-left">
            <NewsletterForm source="homepage" dark />
          </div>
        </Reveal>
      </section>
    </>
  );
}
