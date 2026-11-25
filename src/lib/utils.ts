import type { Trip, TripStatus } from "./types";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(amount: number | null, currency = "USD") {
  if (amount == null) return "To be confirmed";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const parts = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
};

export function formatDate(iso: string) {
  const { y, m, d } = parts(iso);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "December 7–15, 2026", "Dec 28 – Jan 4, 2027", or "Dates to be announced". */
export function formatDateRange(start: string | null, end: string | null) {
  if (!start) return "Dates to be announced";
  if (!end) return formatDate(start);
  const a = parts(start);
  const b = parts(end);
  if (a.y === b.y && a.m === b.m) return `${MONTHS[a.m - 1]} ${a.d}–${b.d}, ${a.y}`;
  if (a.y === b.y) return `${MONTHS[a.m - 1].slice(0, 3)} ${a.d} – ${MONTHS[b.m - 1].slice(0, 3)} ${b.d}, ${a.y}`;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

/** "€1,499 / person" — the official price wording used everywhere. */
export function perPersonLabel(t: Pick<Trip, "price" | "currency">) {
  return t.price == null ? "Price to be confirmed" : `${formatPrice(t.price, t.currency)} / person`;
}

/** A chapter's length in calendar days, counting arrival and departure days (Dec 7–10 = 4 days). */
export function stayDaysLabel(s: { nights: number }) {
  const d = (s.nights || 0) + 1;
  return `${d} day${d === 1 ? "" : "s"}`;
}

export function durationLabel(t: Pick<Trip, "duration_days" | "duration_nights">) {
  if (!t.duration_days) return "Duration to be announced";
  return `${t.duration_days} days / ${t.duration_nights ?? t.duration_days - 1} nights`;
}

export function nightsBetween(start: string, end: string) {
  return Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000);
}

export function placeLabel(t: Pick<Trip, "destination" | "country">) {
  return t.country ? `${t.destination}, ${t.country}` : t.destination;
}

export const statusMeta: Record<TripStatus, { label: string; cta: string; className: string }> = {
  interest: { label: "Registering Interest", cta: "Register Your Interest", className: "bg-champagne-light text-olive" },
  waitlist: { label: "Waitlist Open", cta: "Join the Waitlist", className: "bg-sage-light text-olive" },
  open: { label: "Requests Open", cta: "Request Your Spot", className: "bg-olive text-ivory" },
  few_spots: { label: "Few Spots Left", cta: "Request Your Spot", className: "bg-terracotta text-ivory" },
  sold_out: { label: "Sold Out", cta: "Join the Waitlist", className: "bg-olive/10 text-olive" },
};

export const isWaitlistStatus = (s: TripStatus) => s === "waitlist" || s === "sold_out";

export function groupSizeLabel(trip: Pick<Trip, "group_size_min" | "group_size_max">) {
  const { group_size_min: min, group_size_max: max } = trip;
  if (min && max) return `${min}–${max} travellers`;
  if (max) return `Up to ${max} travellers`;
  if (min) return `Min. ${min} travellers`;
  return "To be confirmed";
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export const FLIGHT_DISCLAIMER =
  "Flights are not included in the trip price. Our team can provide a personalized flight quotation through an authorized ticketing partner. Prices and availability are subject to confirmation.";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** "Monday, December 7" */
export function dayLabel(iso?: string) {
  if (!iso) return "";
  const { y, m, d } = parts(iso);
  return `${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}, ${MONTHS[m - 1]} ${d}`;
}
/** "December 7–10" */
export function shortRange(start?: string, end?: string) {
  if (!start || !end) return "";
  const a = parts(start);
  const b = parts(end);
  return a.m === b.m ? `${MONTHS[a.m - 1]} ${a.d}–${b.d}` : `${MONTHS[a.m - 1].slice(0, 3)} ${a.d} – ${MONTHS[b.m - 1].slice(0, 3)} ${b.d}`;
}
export const stripEmoji = (s: string) => s.replace(/\s*\p{Extended_Pictographic}(\u200d\p{Extended_Pictographic}|\ufe0f)*/gu, "").trim();
