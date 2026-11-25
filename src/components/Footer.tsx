import Link from "next/link";
import { footerNav, legalNav, mainNav, site } from "@/lib/site";
import { getOrganizerSettings } from "@/lib/booking/settings";
import { Logo } from "./Logo";
import { NewsletterForm } from "./forms/NewsletterForm";

export async function Footer() {
  const org = await getOrganizerSettings();
  return (
    <footer className="bg-olive text-ivory">
      <div className="container-lux grid gap-14 py-20 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo light />
          <p className="mt-6 max-w-sm font-serif text-2xl leading-snug text-ivory/90">{site.tagline}</p>
          <div className="mt-8 max-w-md">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-champagne">First access to new trips</p>
            <NewsletterForm source="footer" dark />
          </div>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-6">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-champagne">Explore</p>
            <ul className="space-y-2.5 text-sm text-ivory/75">
              {mainNav.map((l) => (
                <li key={l.href}><Link className="transition hover:text-ivory" href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-champagne">The Club</p>
            <ul className="space-y-2.5 text-sm text-ivory/75">
              {footerNav.map((l) => (
                <li key={l.href}><Link className="transition hover:text-ivory" href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-champagne">Legal</p>
            <ul className="space-y-2.5 text-sm text-ivory/75">
              {legalNav.map((l) => (
                <li key={l.href}><Link className="transition hover:text-ivory" href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
        </nav>
        <div className="lg:col-span-2">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-champagne">Say hello</p>
          <ul className="space-y-2.5 text-sm text-ivory/75">
            <li><a className="hover:text-ivory [overflow-wrap:anywhere]" href={`mailto:${org.company_email || site.contactEmail}`}>{org.company_email || site.contactEmail}</a></li>
            {site.instagram && <li><a className="hover:text-ivory" href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noopener noreferrer">Instagram @{site.instagram}</a></li>}
            {site.tiktok && <li><a className="hover:text-ivory" href={`https://tiktok.com/@${site.tiktok}`} target="_blank" rel="noopener noreferrer">TikTok @{site.tiktok}</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-lux space-y-3 py-8 text-[12px] leading-relaxed text-ivory/50">
          <p>
            Trip prices are per person and exclude flights. Flights are quoted separately; all fares are subject to availability and confirmation.
            Requesting a spot does not guarantee a confirmed booking. A booking is confirmed only once the booking agreement is signed, the required payment has cleared and we have confirmed it in writing.
          </p>
          {org.company_legal_name && (
            <p>
              The Elsewhere Club is a trading name of {org.company_legal_name}
              {org.registration_number ? ` (registration / travel license no. ${org.registration_number})` : ""}
              {org.company_address ? `, ${org.company_address}` : ""}.
            </p>
          )}
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
