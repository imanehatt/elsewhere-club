import type { Metadata } from "next";
import { EscapeCard } from "@/components/EscapeCard";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { TransparencyNote } from "@/components/TransparencyNote";
import { getTrips } from "@/lib/trips";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Upcoming Trips",
  description: "Complete, curated group trips with fixed destinations, dates and itineraries. Choose your escape and request your spot.",
  alternates: { canonical: "/trips" },
};

export default async function TripsPage() {
  const trips = await getTrips();
  return (
    <>
      <PageHero
        eyebrow="Upcoming trips"
        title={<>Upcoming <em className="text-champagne">escapes.</em></>}
        intro="Complete, curated group trips with fixed destinations, dates and itineraries. Choose the one you want and request your spot."
        image="/images/camera-sunset.jpg"
        imageLabel="Camera, coconut and sunglasses on a café table at golden hour"
        tone="ocean"
      />
      <section className="py-14 sm:py-20">
        <div className="container-lux">
          {trips.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {trips.map((t, i) => (
                <Reveal key={t.id}><EscapeCard trip={t} index={i} feature={i === 0} priority={i === 0} /></Reveal>
              ))}
            </div>
          ) : (
            <p className="text-olive-soft">New escapes are on their way — join the club to hear first.</p>
          )}
          <TransparencyNote className="mt-16" />
        </div>
      </section>
    </>
  );
}
