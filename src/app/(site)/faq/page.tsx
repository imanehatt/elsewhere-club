import type { Metadata } from "next";
import { Accordion } from "@/components/Accordion";
import { ButtonLink } from "@/components/Button";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about Elsewhere Club group trips — solo travel, booking, flights, insurance, payments and cancellations.",
  alternates: { canonical: "/faq" },
};

const groups: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "The trips",
    items: [
      { q: "How do your trips work?", a: "Each escape is a complete, curated group trip with a fixed destination, dates and itinerary. Browse upcoming trips, choose the one you want and request your spot." },
      { q: "Who are the trips for?", a: "Our trips are for women aged 18 and over who love to travel and meet new people — there's no upper age limit." },
      { q: "Can I come on my own?", a: "Yes — most people do. Our trips are built so solo travellers feel part of the group from the very first evening." },
      { q: "How big are the groups?", a: "Small. The exact minimum and maximum group size is shown on each trip page once confirmed." },
      { q: "Is the trip guaranteed to run?", a: "Each trip may need a minimum number of travelers. Any minimum group size, and the deadline for cancelling a trip that doesn't reach it, will be shared before you book. If we ever have to cancel, you'll be told promptly and offered refunds, alternative arrangements or other remedies as required by law — see our Cancellation & Refund Policy." },
    ],
  },
  {
    title: "Prices & booking",
    items: [
      { q: "What does the price include?", a: "Each trip page lists exactly what's included and excluded. Prices are per person and exclude flights. Where a price is still being finalised, it's shown as \"To be confirmed\"." },
      { q: "Are flights included?", a: "No. Flights are not included in the trip price and are quoted separately. All fares are subject to availability and confirmation." },
      { q: "Is my place confirmed when I submit the form?", a: "No. Submitting a request doesn't guarantee a booking, and no payment is required. If we approve it, you'll get a secure link to review and sign your personalised booking agreement. Your booking is confirmed only once you've signed, your payment has cleared and we've sent written confirmation." },
      { q: "Can I pay online?", a: "Payments are made by bank transfer. After you sign your booking agreement, you message us on WhatsApp from your booking page and we send you our bank details personally. You can then upload your proof of payment on your booking page. Uploading proof doesn't confirm your booking automatically — we confirm once the funds have arrived in our official account. We will never ask you to pay into any other account." },
      { q: "What's your cancellation policy?", a: "Our Cancellation & Refund Policy is on its own page (linked in the footer), and the full schedule for your trip is set out in your personalised booking agreement before you sign or pay." },
    ],
  },
  {
    title: "Flights",
    items: [
      { q: "Can I use the flight service without booking a trip?", a: "Absolutely. Our flight quote service is open to everyone." },
      { q: "Which cabin classes can I request?", a: "Economy, Premium Economy, Business and First." },
      { q: "Are your flight prices guaranteed?", a: "No airline fare is guaranteed until the ticket is issued. We'll always tell you how long a quote is likely to be valid." },
    ],
  },
  {
    title: "Before you travel",
    items: [
      { q: "Do I need travel insurance?", a: "We strongly advise suitable travel insurance covering emergency medical treatment, hospitalisation, emergency evacuation, trip cancellation or interruption, baggage loss and adventure activities." },
      { q: "Do I need a visa for Bali?", a: "Many nationalities can get a visa on arrival or e-visa for Indonesia, but rules change. Always check the official Indonesian immigration website for your nationality before you travel." },
      { q: "Do I need vaccinations?", a: "Please speak to a travel health professional at least six weeks before departure." },
    ],
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((g) => g.items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } }))),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero image="/images/faq-flatlay.jpg" eyebrow="FAQ" title={<>Questions, <em className="text-champagne">answered.</em></>} imageLabel="Passport, notebook, sunglasses and coffee in golden light" tone="sage" />
      <section className="py-20 sm:py-28">
        <div className="container-lux grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="lead">Can&apos;t find what you&apos;re looking for? We&apos;re always happy to help.</p>
            <ButtonLink href="/contact" variant="secondary" className="mt-6">Contact Us</ButtonLink>
          </div>
          <div className="space-y-14 lg:col-span-8">
            {groups.map((g) => (
              <div key={g.title}>
                <h2 className="mb-4 text-3xl">{g.title}</h2>
                <Accordion defaultOpen={null} items={g.items.map((i) => ({ title: i.q, content: i.a }))} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
