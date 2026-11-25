/**
 * Central business settings. Edit these values — they appear across the site.
 * Anything marked REVIEW must be checked/filled before launch.
 */
export const site = {
  name: "The Elsewhere Club",
  shortName: "Elsewhere Club",
  tagline: "Go Places. Find Your People.",
  description:
    "Complete, curated group trips with fixed destinations, dates and itineraries. Browse upcoming escapes, choose your trip and request your spot — come solo, leave with friends.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",

  // REVIEW: replace with your real contact details before launch.
  contactEmail: "hello@yourdomain.com",
  whatsapp: null as string | null, // e.g. "+44 7700 900123"
  instagram: null as string | null, // e.g. "elsewhereclub"
  tiktok: null as string | null,

  // REVIEW: the licensed travel operator that legally sells/operates trips.
  // Leave name as null until appointed — the site will say "to be appointed".
  operator: {
    name: null as string | null,
    licence: null as string | null, // e.g. licence / registration number
    country: null as string | null,
  },
  // REVIEW: authorised ticketing partner for flights (e.g. an IATA-accredited agent).
  ticketingPartner: null as string | null,

  currency: "USD",
} as const;

export const mainNav = [
  { href: "/", label: "Home" },
  { href: "/trips", label: "Upcoming Trips" },
  { href: "/flights", label: "Flights" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About Us" },
  { href: "/faq", label: "FAQ" },
];

export const footerNav = [
  { href: "/contact", label: "Contact" },
  { href: "/join", label: "Join the Club" },
];

export const legalNav = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/booking-agreement", label: "Booking Agreement" },
  { href: "/cancellation-policy", label: "Cancellation & Refund Policy" },
  { href: "/privacy", label: "Privacy Policy" },
];
