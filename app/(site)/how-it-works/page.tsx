import type { Metadata } from "next";
import { ButtonLink } from "@/components/Button";
import { HowItWorksSteps } from "@/components/HowItWorksSteps";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { TransparencyNote } from "@/components/TransparencyNote";

export const metadata: Metadata = {
  title: "How It Works",
  description: "How Elsewhere Club group trips work — from choosing your escape to meeting your group. Curated trips, booking inquiries, flights and solo travel explained.",
  alternates: { canonical: "/how-it-works" },
};

const details = [
  { title: "Complete trips, not packages", text: "Each escape has a fixed destination, dates and itinerary. No mixing and matching — just choose your trip." },
  { title: "Requests, not instant bookings", text: "We review every request personally. If it’s approved, you’ll get a secure link to your personalised booking agreement — nothing is charged before you’ve signed it." },
  { title: "Solo? Perfect.", text: "Most travellers come alone. Our trips are designed so you feel part of the group from day one." },
  { title: "Flights, your way", text: "Trip prices exclude flights. Ask for a quote in the booking form or on the Flights page — Economy to First." },
  { title: "Minimum group size", text: "Any minimum group size, and the deadline for cancelling a trip that doesn’t reach it, is shared before you book. See our Cancellation & Refund Policy." },
  { title: "Bank transfer payments", text: "After signing, you pay your deposit by bank transfer and upload your proof of payment. Your booking is confirmed only once the funds arrive in our official account." },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero image="/images/planning-sunset.jpg" eyebrow="How it works" title={<>Simple, <em className="text-champagne">transparent,</em> taken care of.</>} imageLabel="Planning a trip on a laptop at a sunset terrace overlooking the sea" tone="terracotta" />
      <section className="py-20 sm:py-28">
        <div className="container-lux">
          <HowItWorksSteps />
        </div>
      </section>
      <section className="bg-sand py-20 sm:py-28">
        <div className="container-lux">
          <SectionHeading eyebrow="The details" title="What to expect" />
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {details.map((d, i) => (
              <Reveal key={d.title} delay={i * 80} className="rounded-[var(--radius-card)] bg-ivory p-8">
                <h3 className="text-2xl">{d.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-olive-soft">{d.text}</p>
              </Reveal>
            ))}
          </div>
          <TransparencyNote className="mt-14" />
          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/trips" arrow>See Upcoming Escapes</ButtonLink>
            <ButtonLink href="/faq" variant="secondary">Read the FAQ</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
