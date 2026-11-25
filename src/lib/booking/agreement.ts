/**
 * THE ELSEWHERE CLUB — Trip Booking Agreement.
 *
 * The wording below is the agreement text supplied by The Elsewhere Club.
 * The blanks are filled from the booking (guest, trip, price, payment
 * amounts and due dates). Anything still missing is shown as a highlighted
 * blank and listed in `doc.missing`, and live mode won't allow an agreement
 * with missing details to be sent.
 *
 * To change the contract wording, edit this file and raise the
 * "Agreement version" in Admin → Settings so signed copies stay traceable.
 */
import { formatDate, formatDateRange, formatPrice, stripEmoji } from "../utils";
import type { Trip } from "../types";
import type { OrganizerSettings } from "./types";

export const TEMPLATE_REVISION = "2026-11-23";

/** Contact email printed in section 7 (Admin → Settings → Company email overrides it). */
export const DEFAULT_CONTACT_EMAIL = "imanehattani0@gmail.com";
const BLANK = "______________________";


export type Seg = { text: string; missing?: boolean };
export type Block =
  | { t: "h2"; text: string }
  | { t: "h3"; text: string }
  | { t: "p"; segs: Seg[]; strong?: boolean }
  | { t: "kv"; label: string; segs: Seg[] }
  | { t: "ul" | "ol"; items: Seg[][] }
  | { t: "table"; head: [string, string]; rows: [Seg[], Seg[]][] }
  | { t: "hr" };

export interface AgreementDoc {
  version: string;
  title: string;
  subtitle: string;
  tagline: string;
  header: { label: string; segs: Seg[] }[];
  blocks: Block[];
  schedules: { title: string; intro: string; blocks: Block[] }[];
  footer: Seg[][];
  missing: string[];
}

/** Booking details used to personalise the agreement (null fields stay as placeholders). */
export interface AgreementParty {
  reference: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  travelers: number;
  currency: string;
  price_per_person: number | null;
  deposit_per_person: number | null;
  deposit_deadline: string | null;
  balance_deadline: string | null;
  trip_title: string;
  trip_start: string | null;
  trip_end: string | null;
}

/** Trips that have an agreement template. */
export const AGREEMENT_TEMPLATES = ["bali-girls-escape"] as const;
export const hasAgreementTemplate = (slug: string) => (AGREEMENT_TEMPLATES as readonly string[]).includes(slug);

/** "You're going to Bali! 🌴" */
const DESTINATIONS: Record<string, string> = { "bali-girls-escape": "Bali" };
export const goingHeadline = (slug: string) => (DESTINATIONS[slug] ? `You’re going to ${DESTINATIONS[slug]}! 🌴` : "You’re going! 🌴");

export function buildAgreement({
  party,
  org,
  agreementDate,
}: {
  party: AgreementParty;
  org: OrganizerSettings;
  /** Kept for compatibility — the trip itinerary is shared separately before departure (section 5). */
  trip?: Pick<Trip, "itinerary" | "included" | "excluded" | "excluded_note"> | null;
  /** YYYY-MM-DD; null leaves it out */
  agreementDate: string | null;
}): AgreementDoc {
  const missing = new Set<string>();
  const v = (value: string | number | null | undefined, label: string): Seg => {
    const s = value == null ? "" : String(value).trim();
    if (!s) {
      missing.add(label);
      return { text: BLANK, missing: true };
    }
    return { text: s };
  };
  const t = (text: string): Seg => ({ text });
  const p = (...segs: (Seg | string)[]): Block => ({ t: "p", segs: segs.map((s) => (typeof s === "string" ? t(s) : s)) });
  const kv = (label: string, ...segs: (Seg | string)[]): Block => ({ t: "kv", label, segs: segs.map((s) => (typeof s === "string" ? t(s) : s)) });

  const money = (n: number | null) => (n == null ? null : formatPrice(n, party.currency));
  const date = (iso: string | null) => (iso ? formatDate(iso) : null);
  const title = stripEmoji(party.trip_title);
  const dates = party.trip_start ? formatDateRange(party.trip_start, party.trip_end) : null;

  const n = Math.max(1, party.travelers || 1);
  const price = party.price_per_person;
  const first = party.deposit_per_person;
  const second = price != null && first != null ? price - first : null;
  const total = price != null ? price * n : null;
  const pct = (part: number | null) => (part != null && price ? Math.round((part / price) * 100) : null);
  const firstPct = pct(first);
  const secondPct = pct(second);
  const contact = org.company_email || DEFAULT_CONTACT_EMAIL;
  const tiers = org.cancellation_tiers.filter((x) => x.period.trim() && x.refund.trim());

  const blocks: Block[] = [
    p("Welcome to The Elsewhere Club! We\u2019re excited to have you joining us for an unforgettable experience."),
    p("This agreement explains the booking details, payment schedule, and important conditions of your trip."),

    { t: "h2", text: "1. Booking Information" },
    kv("Guest Full Name", v(party.full_name, "Guest full name")),
    kv("Email", v(party.email, "Guest email")),
    kv("Trip Name", title),
    kv("Trip Dates", v(dates, "Trip dates")),
    kv("Total Trip Price", v(money(total), "Trip price"), n > 1 && price != null ? ` (${money(price)} per person \u00d7 ${n} guests)` : ""),

    { t: "h2", text: "2. Payment Schedule" },
    p("To confirm your place on the trip, payments must be completed according to the following schedule:"),
    { t: "h3", text: `First Payment \u2014 ${firstPct ?? "[ ]"}% Deposit` },
    kv("Amount", v(money(first != null ? first * n : null), "First payment amount")),
    p("Due by ", v(date(party.deposit_deadline), "First payment due date"), "."),
    p("This payment secures your reservation."),
    { t: "h3", text: `Second Payment \u2014 Remaining ${secondPct ?? "[ ]"}%` },
    kv("Amount", v(money(second != null ? second * n : null), "Second payment amount")),
    p("Due by ", v(date(party.balance_deadline), "Second payment due date"), "."),
    p("The full trip balance must be paid by this date."),
    p("Payments are made using the payment details provided directly by The Elsewhere Club."),

    { t: "h2", text: "3. Booking Confirmation" },
    p("Your booking is confirmed once the required deposit has been received and The Elsewhere Club has sent you a written confirmation."),
    p("Any outstanding balance must be paid by the stated deadline."),

    { t: "h2", text: "4. Changes and Cancellations" },
    p("Any cancellation or change request must be communicated to The Elsewhere Club as soon as possible."),
    p("Refunds and changes depend on the cancellation conditions communicated at booking and any applicable supplier restrictions."),
    p("Any applicable non-refundable amounts must be clearly disclosed before payment."),
    ...(tiers.length
      ? ([p("Cancellation conditions communicated at booking:"), { t: "table", head: ["Cancellation Period", "Applicable Refund"], rows: tiers.map((x) => [[t(x.period)], [t(x.refund)]]) }] as Block[])
      : []),

    { t: "h2", text: "5. Trip Information" },
    p("The Elsewhere Club will share the confirmed itinerary, accommodation details, meeting points, and other important information before departure."),
    p("Some activities or schedules may change because of weather, availability, or circumstances outside the organizer\u2019s control. Guests will be informed of significant changes."),

    { t: "h2", text: "6. Guest Responsibilities" },
    p("Guests are responsible for having valid travel documents, meeting applicable entry requirements, and following reasonable safety instructions during the trip."),

    { t: "h2", text: "7. Contact" },
    p("The Elsewhere Club"),
    kv("Email", contact),

    { t: "h2", text: "8. Booking Acceptance" },
    p("By signing below, I confirm that I have reviewed the trip details, payment schedule, and booking conditions."),
  ];

  return {
    version: `${org.agreement_version || "v1.0"} (${TEMPLATE_REVISION})`,
    title: "Trip Booking Agreement",
    subtitle: `${title}${dates ? ` | ${dates}` : ""}`,
    tagline: "Go Places. Find Your People.",
    header: [
      ...(party.reference ? [{ label: "Booking Reference", segs: [t(party.reference)] }] : []),
      ...(agreementDate ? [{ label: "Date", segs: [t(formatDate(agreementDate))] }] : []),
    ],
    blocks,
    schedules: [],
    footer: [],
    missing: [...missing],
  };
}

const segText = (segs: Seg[]) => segs.map((s) => s.text).join("");

/** Plain-text version — used for the tamper-evident hash and for emails. */
export function agreementPlainText(doc: AgreementDoc): string {
  const out: string[] = ["THE ELSEWHERE CLUB", doc.title.toUpperCase(), doc.subtitle, doc.tagline, `Version ${doc.version}`];
  for (const h of doc.header) out.push(`${h.label}: ${segText(h.segs)}`);
  const walk = (blocks: Block[]) => {
    for (const b of blocks) {
      if (b.t === "h2" || b.t === "h3") out.push("", b.text);
      else if (b.t === "p") out.push(segText(b.segs));
      else if (b.t === "kv") out.push(`${b.label}: ${segText(b.segs)}`);
      else if (b.t === "ul") b.items.forEach((i) => out.push(`- ${segText(i)}`));
      else if (b.t === "ol") b.items.forEach((i, n) => out.push(`${n + 1}. ${segText(i)}`));
      else if (b.t === "table") {
        out.push(b.head.join(" | "));
        b.rows.forEach((r) => out.push(`${segText(r[0])} | ${segText(r[1])}`));
      } else if (b.t === "hr") out.push("---");
    }
  };
  walk(doc.blocks);
  for (const s of doc.schedules) {
    out.push("", s.title, s.intro);
    walk(s.blocks);
  }
  out.push("", ...doc.footer.map(segText));
  return out.join("\n");
}
