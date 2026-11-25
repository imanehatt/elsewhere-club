/**
 * Trip status controls the badge and the main button label:
 *  interest   → "Register Your Interest" (inquiry only, nothing bookable yet)
 *  waitlist   → "Join the Waitlist"
 *  open       → "Request Your Spot"
 *  few_spots  → "Request Your Spot" (+ "Few spots left")
 *  sold_out   → "Join the Waitlist"
 */
export type TripStatus = "interest" | "waitlist" | "open" | "few_spots" | "sold_out";

export interface TimelineBlock {
  time: string; // e.g. "9:00 AM" or "Evening"
  title: string;
  items: string[];
  optional?: boolean;
  /** Optional extra that guests pay for separately — shown as "Optional — Extra Cost" */
  extra_cost?: boolean;
}

/** One day of a trip. Older trips may only have title + description. */
export interface ItineraryDay {
  title: string;
  date?: string; // YYYY-MM-DD
  location?: string; // e.g. "Ubud → Uluwatu"
  emoji?: string;
  image?: string; // URL or /images/... path
  summary?: string;
  timeline?: TimelineBlock[];
  overnight?: string;
  description?: string; // legacy simple text
}

/** A part of the trip spent in one area (drives itinerary grouping + route map). */
export interface Stay {
  name: string;
  start: string; // check-in date
  end: string; // check-out date
  nights: number;
  summary?: string;
  image?: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

/** A complete, curated group trip with one fixed destination, dates, price and itinerary. */
export interface Trip {
  id: string;
  slug: string;
  title: string;
  destination: string; // e.g. "Bali" or "Coming Soon"
  country: string; // may be empty while TBA
  arrival_airport: string; // pre-fills flight requests, e.g. "Denpasar, Bali (DPS)"
  trip_type: string; // e.g. "Curated group travel"
  start_date: string | null; // YYYY-MM-DD, null = "Dates to be announced"
  end_date: string | null;
  duration_days: number | null;
  duration_nights: number | null;
  price: number | null; // null = "To be confirmed"
  /** Deposit per person, due after the booking agreement is signed. null = not set. */
  deposit_amount: number | null;
  /** Date the first payment (deposit) is due (YYYY-MM-DD). Pre-fills each approval. */
  deposit_due_date: string | null;
  /** Date the remaining balance is due (YYYY-MM-DD). null = to be confirmed. */
  balance_due_date: string | null;
  currency: string;
  status: TripStatus;
  /** true = form registers interest only; not bookable until terms are confirmed */
  inquiry_only: boolean;
  group_size_min: number | null;
  group_size_max: number | null;
  /** null = not verified → never shown publicly */
  spots_available: number | null;
  tagline: string;
  short_description: string; // shown on trip cards
  description: string;
  audience: string; // e.g. "Girls aged 18+"
  group_note: string; // e.g. "Approximately 8–10 travelers (subject to confirmation)"
  stays: Stay[];
  highlights: string[];
  itinerary: ItineraryDay[];
  itinerary_confirmed: boolean;
  accommodation: string;
  accommodation_confirmed: boolean;
  included: string[];
  inclusions_confirmed: boolean;
  excluded: string[];
  excluded_note: string;
  faqs: FaqItem[];
  cover_image: string | null;
  gallery: string[];
  published: boolean;
  featured: boolean;
  sort_order: number;
}
