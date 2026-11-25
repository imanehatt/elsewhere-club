import type { Metadata } from "next";
import { ButtonLink } from "@/components/Button";
import { PageHero } from "@/components/PageHero";
import { Photo } from "@/components/Photo";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About Us",
  description: "The Elsewhere Club is a travel club for people who'd rather not wait for their friends' calendars to line up. Complete, curated group trips, starting with Bali.",
  alternates: { canonical: "/about" },
};

const values = [
  { title: "Curated, not crowded", text: "Small groups, considered itineraries, and beautiful places to come home to each night." },
  { title: "Honest by design", text: "Clear prices, no invented discounts, and plain-English policies. What you see is what you get." },
  { title: "Belonging, anywhere", text: "Small groups designed so the group feels like your people from day one." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero image="/images/girls-terrace-sunset.jpg" eyebrow="About us" title={<>A travel club for the <em className="text-champagne">curious and the connected.</em></>} imageLabel="Four friends watching the sunset from a seaside terrace" tone="dusk" />
      <section className="py-20 sm:py-28">
        <div className="container-lux grid items-start gap-14 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow mb-4">Our story</p>
            <h2 className="display-lg">Why We Started The Club</h2>
            <div className="lead mt-6 space-y-5">
              <p>It started with two Moroccan best friends and a shared dream: to see the world, meet incredible girls, and collect stories worth telling.</p>
              <p>We’ve always believed that the best part of traveling isn’t just the places you visit. It’s the people you meet along the way, the unexpected adventures, the late-night conversations, and the friendships that somehow feel like you’ve known each other forever.</p>
              <p>We dreamed of traveling with girls from all over the world. Different countries, different cultures, different stories — but the same curiosity and love for adventure.</p>
              <p>And we kept thinking: <em className="font-serif text-[1.08em] text-terracotta">What if we created a space where girls could experience all of that together?</em></p>
              <p>A place where you don’t need to wait for your friends to be free. Where showing up alone doesn’t mean feeling alone. Where strangers become travel buddies, and travel buddies become lifelong friends.</p>
              <p>That’s how The Elsewhere Club was born.</p>
              <p>Not just another travel agency. A community built by two best friends who believe that the world is too beautiful to explore alone — and that some of the best friendships begin somewhere unexpected.</p>
              <p><strong className="font-medium text-olive">Come solo. Leave with stories, memories, and girls you’ll want to travel with again.</strong></p>
            </div>
            <p className="mt-8 font-serif text-xl italic text-olive">With love,<br />The two besties behind The Elsewhere Club 🤍</p>
          </Reveal>
          <Reveal delay={150} className="lg:sticky lg:top-28">
            <Photo src="/images/our-story.jpg" alt="Woman watching the sunset over the sea from a terrace café" className="aspect-[4/5] overflow-hidden rounded-[var(--radius-card)]" sizes="(min-width:1024px) 50vw, 100vw" />
          </Reveal>
        </div>
      </section>
      <section className="bg-olive py-20 text-ivory sm:py-28">
        <div className="container-lux grid gap-10 md:grid-cols-3">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 100}>
              <span className="font-serif text-5xl italic text-champagne">0{i + 1}</span>
              <h3 className="mt-4 text-2xl text-ivory">{v.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ivory/75">{v.text}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="py-20 text-center sm:py-28">
        <div className="container-lux">
          <h2 className="display-lg mx-auto max-w-2xl">Ready to find your people?</h2>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/trips" arrow>Explore Trips</ButtonLink>
            <ButtonLink href="/join" variant="secondary">Join the Club</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
