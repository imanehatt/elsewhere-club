import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export const steps = [
  { title: "Browse Upcoming Escapes", text: "Every trip is fully curated — fixed destination, dates and itinerary. Just pick the one you love." },
  { title: "Request Your Spot", text: "Send a quick request — it doesn’t guarantee a booking and no payment is required. Add a flight quote if you’d like." },
  { title: "Sign & Secure", text: "Once approved, sign your personalised booking agreement online, then pay your deposit by bank transfer." },
  { title: "Travel & Connect", text: "We confirm your booking in writing once your payment has arrived. Then you arrive, meet your group and enjoy the escape." },
];

export function HowItWorksSteps({ className }: { className?: string }) {
  return (
    <ol className={cn("grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6", className)}>
      {steps.map((s, i) => (
        <Reveal as="li" key={s.title} delay={i * 110} className="relative">
          <div className="flex items-center gap-4">
            <span className="font-serif text-6xl italic text-terracotta/80">{i + 1}</span>
            {i < steps.length - 1 && <span className="hidden h-px flex-1 bg-olive/15 lg:block" />}
          </div>
          <h3 className="mt-4 text-2xl">{s.title}</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-olive-soft">{s.text}</p>
        </Reveal>
      ))}
    </ol>
  );
}
