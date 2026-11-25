import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { JoinForm } from "@/components/forms/JoinForm";

export const metadata: Metadata = {
  title: "Join the Club",
  description: "Join The Elsewhere Club for free. Get first access to new escapes, dates and members-only trip announcements.",
  alternates: { canonical: "/join" },
};

export default function JoinPage() {
  return (
    <>
      <PageHero
        eyebrow="Join the club — free"
        title={<>The best trips start with <em className="text-champagne">the right people.</em></>}
        intro="No account, no fee, no spam. Just first access to the trips you actually want."
        imageLabel="Friends jumping into a villa pool"
        tone="terracotta"
      />
      <section className="py-20 sm:py-28">
        <div className="container-lux grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="display-md">Members get</h2>
            <ul className="mt-6 space-y-4 text-[15px] text-olive-soft">
              {["First to hear about new destinations and dates", "Early access before trips are announced publicly", "Occasional travel inspiration — never spam"].map((x) => (
                <li key={x} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" />{x}</li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-olive/60">You never need an account to browse trips or request a quote.</p>
          </div>
          <div className="rounded-[var(--radius-card)] bg-sand p-6 sm:p-10 lg:col-span-8">
            <JoinForm />
          </div>
        </div>
      </section>
    </>
  );
}
