import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/forms/ContactForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with The Elsewhere Club about group trips, flights or partnerships.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero image="/images/beach.jpg" eyebrow="Contact" title={<>Let&apos;s <em className="text-champagne">talk travel.</em></>} imageLabel="Beachfront café table" tone="sand" />
      <section className="py-20 sm:py-28">
        <div className="container-lux grid gap-14 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-4">
            <p className="lead">Questions about a trip, a flight quote, or working together? Drop us a message and we&apos;ll reply within two working days.</p>
            <div className="space-y-4 text-[15px]">
              <a href={`mailto:${site.contactEmail}`} className="flex items-center gap-3 text-olive hover:text-terracotta"><Mail className="h-5 w-5 text-terracotta" strokeWidth={1.4} />{site.contactEmail}</a>
              {site.whatsapp && (
                <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-olive hover:text-terracotta">
                  <MessageCircle className="h-5 w-5 text-terracotta" strokeWidth={1.4} />WhatsApp {site.whatsapp}
                </a>
              )}
            </div>
          </div>
          <div className="rounded-[var(--radius-card)] bg-sand p-6 sm:p-10 lg:col-span-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
