"use server";

import { randomUUID } from "node:crypto";
import { getTrips } from "@/lib/trips";
import { isLikelySpam } from "@/lib/spam";
import { notifyAdmin } from "@/lib/notify";
import { publicClient } from "@/lib/supabase/public";
import { formatDateRange, isWaitlistStatus, placeLabel, statusMeta } from "@/lib/utils";
import { NOT_CONNECTED_MESSAGE, type FormState } from "@/lib/form-state";
import { serviceClient } from "@/lib/supabase/service";
import { logEvent } from "@/lib/booking/server";
import {
  ageOn,
  bookingRequestSchema,
  cabinLabels,
  contactSchema,
  flattenErrors,
  flightQuoteSchema,
  joinSchema,
  tripInquirySchema,
} from "@/lib/validation";

const GENERIC_ERROR = "Something went wrong on our side. Please try again, or email us directly.";
const SPAM_RESPONSE: FormState = { status: "success", message: "Thank you — we've received your request." };

function entries(form: FormData) {
  return Object.fromEntries(Array.from(form.keys()).map((k) => [k, form.get(k) ?? undefined]));
}

/* ------------------------------------------------------------------ */
/* Trip booking inquiry (NOT a confirmed reservation)                  */
/* ------------------------------------------------------------------ */
export async function submitTripInquiry(prev: FormState, form: FormData): Promise<FormState> {
  // Bookable trips go through the full booking flow (approval → agreement → bank transfer).
  const tripId = String(form.get("trip_id") ?? "");
  const target = (await getTrips()).find((t) => t.id === tripId);
  if (target && (target.status === "open" || target.status === "few_spots")) return submitBookingRequest(prev, form);

  const parsed = tripInquirySchema.safeParse(entries(form));
  if (!parsed.success) return { status: "error", message: "Please check the highlighted fields.", errors: flattenErrors(parsed.error) };
  const d = parsed.data;
  // Spam check runs after validation so real people always see helpful errors.
  if (isLikelySpam(form)) return SPAM_RESPONSE;

  const trip = (await getTrips()).find((t) => t.id === d.trip_id);
  if (!trip) return { status: "error", message: "That trip is no longer available." };
  const inquiryType = statusMeta[trip.status].cta;
  const tripDates = formatDateRange(trip.start_date, trip.end_date);
  const wantsFlights = d.flights === "yes";

  const db = publicClient();
  if (!db) return { status: "success", message: NOT_CONNECTED_MESSAGE };

  const inquiryId = randomUUID();
  const { error } = await db.from("trip_inquiries").insert({
    id: inquiryId,
    trip_id: trip.id,
    trip_title: trip.title,
    trip_dates: tripDates,
    inquiry_type: inquiryType,
    full_name: d.full_name,
    email: d.email,
    whatsapp: d.whatsapp,
    country: d.country,
    travellers: d.travellers,
    special_requests: d.special_requests,
    wants_flight_quote: wantsFlights,
  });
  if (error) {
    console.error("[inquiry]", error);
    return { status: "error", message: GENERIC_ERROR };
  }

  if (wantsFlights) {
    const { error: flightErr } = await db.from("flight_quote_requests").insert({
      source: "trip_inquiry",
      trip_inquiry_id: inquiryId,
      trip_id: trip.id,
      trip_type: "round_trip",
      origin: d.flight_origin,
      // Destination always comes from the trip itself, never from the browser.
      destination: trip.arrival_airport || placeLabel(trip),
      depart_date: d.flight_depart_date ?? trip.start_date,
      return_date: d.flight_return_date ?? trip.end_date,
      adults: d.flight_passengers ?? d.travellers,
      children: 0,
      cabin_class: d.flight_cabin_class,
      preferred_airline: d.flight_airline,
      flexible_dates: d.flight_flexible === "yes",
      full_name: d.full_name,
      email: d.email,
      whatsapp: d.whatsapp,
    });
    if (flightErr) console.error("[inquiry→flight]", flightErr);
  }

  await notifyAdmin(`${inquiryType}: ${trip.title}`, {
    Name: d.full_name,
    Email: d.email,
    WhatsApp: d.whatsapp,
    Country: d.country,
    Travellers: d.travellers,
    Dates: tripDates,
    "Flight quote": wantsFlights
      ? `Yes — from ${d.flight_origin}, ${d.flight_cabin_class ? cabinLabels[d.flight_cabin_class] : ""}, ${d.flight_passengers} pax, ${d.flight_depart_date ?? "trip dates"} → ${d.flight_return_date ?? ""}`
      : "No — own flights",
    Requests: d.special_requests,
  });

  const first = d.full_name.split(" ")[0];
  return {
    status: "success",
    message: isWaitlistStatus(trip.status)
      ? `Thank you, ${first}! You’re on the waitlist for ${trip.title}. We’ll be in touch as soon as details are announced.`
      : `Thank you, ${first}! Your inquiry for ${trip.title} is in. This is a booking inquiry, not a confirmed reservation — we’ll contact you by email or WhatsApp with availability, pricing and next steps${wantsFlights ? ", plus your flight options" : ""}.`,
  };
}

/* ------------------------------------------------------------------ */
/* Request Your Spot — creates a booking request for admin approval    */
/* ------------------------------------------------------------------ */
async function submitBookingRequest(_: FormState, form: FormData): Promise<FormState> {
  const parsed = bookingRequestSchema.safeParse(entries(form));
  if (!parsed.success) return { status: "error", message: "Please check the highlighted fields.", errors: flattenErrors(parsed.error) };
  const d = parsed.data;
  const trip = (await getTrips()).find((t) => t.id === d.trip_id);
  if (!trip) return { status: "error", message: "That trip is no longer available." };
  const ageDate = trip.start_date ?? new Date().toISOString().slice(0, 10);
  if (ageOn(d.date_of_birth, ageDate) < 18)
    return { status: "error", message: "Please check the highlighted fields.", errors: { date_of_birth: "This trip is for travelers aged 18+ on the first day of the trip." } };
  // Spam check runs after validation so real people always see helpful errors.
  if (isLikelySpam(form)) return SPAM_RESPONSE;

  const first = d.full_name.split(" ")[0];
  const success: FormState = {
    status: "success",
    message: `Thank you, ${first}! Your request for ${trip.title} is in. Submitting a request does not guarantee a confirmed booking, and no payment is required yet. We’ll review it and email you — if it’s approved, you’ll receive a secure link to your personalised booking agreement.`,
  };

  const db = serviceClient();
  if (!db) return { status: "success", message: NOT_CONNECTED_MESSAGE };

  // One active request per email per trip: a repeat submission is noted, not duplicated.
  const { data: existing } = await db
    .from("bookings")
    .select("id")
    .eq("trip_id", trip.id)
    .eq("email", d.email)
    .neq("status", "cancelled")
    .limit(1)
    .maybeSingle();
  if (existing) {
    await logEvent(db, existing.id, "traveler", "duplicate_request", { note: "Same email submitted the form again — no new request created." });
    return success;
  }

  const wantsFlights = d.flights === "yes";
  const { data: created, error } = await db
    .from("bookings")
    .insert({
      trip_id: trip.id,
      trip_slug: trip.slug,
      trip_title: trip.title,
      trip_start: trip.start_date,
      trip_end: trip.end_date,
      full_name: d.full_name,
      email: d.email,
      phone: d.phone,
      country: d.country,
      nationality: d.nationality,
      date_of_birth: d.date_of_birth,
      travelers: d.travellers,
      special_requests: d.special_requests,
      wants_flight_quote: wantsFlights,
    })
    .select("id")
    .single();
  if (error || !created) {
    console.error("[booking request]", error);
    return { status: "error", message: GENERIC_ERROR };
  }
  await logEvent(db, created.id, "traveler", "request_submitted", { travelers: d.travellers, flights: wantsFlights });

  if (wantsFlights) {
    const { error: flightErr } = await db.from("flight_quote_requests").insert({
      source: "trip_inquiry",
      booking_id: created.id,
      trip_id: trip.id,
      trip_type: "round_trip",
      origin: d.flight_origin,
      destination: trip.arrival_airport || placeLabel(trip),
      depart_date: d.flight_depart_date ?? trip.start_date,
      return_date: d.flight_return_date ?? trip.end_date,
      adults: d.flight_passengers ?? d.travellers,
      children: 0,
      cabin_class: d.flight_cabin_class,
      preferred_airline: d.flight_airline,
      flexible_dates: d.flight_flexible === "yes",
      full_name: d.full_name,
      email: d.email,
      whatsapp: d.phone,
    });
    if (flightErr) console.error("[booking→flight]", flightErr);
  }

  await notifyAdmin(`New booking request: ${trip.title}`, {
    Name: d.full_name,
    Email: d.email,
    Phone: d.phone,
    Country: d.country,
    Nationality: d.nationality,
    Travelers: d.travellers,
    "Flight quote": wantsFlights ? `Yes — from ${d.flight_origin}` : "No — own flights",
    Requests: d.special_requests,
    Next: "Review and approve it in Admin → Bookings.",
  });

  return success;
}

/* ------------------------------------------------------------------ */
/* Stand-alone flight quote request                                    */
/* ------------------------------------------------------------------ */
export async function submitFlightQuote(_: FormState, form: FormData): Promise<FormState> {
  const parsed = flightQuoteSchema.safeParse(entries(form));
  if (!parsed.success) return { status: "error", message: "Please check the highlighted fields.", errors: flattenErrors(parsed.error) };
  const d = parsed.data;
  // Spam check runs after validation so real people always see helpful errors.
  if (isLikelySpam(form)) return SPAM_RESPONSE;

  let tripId: string | null = null;
  if (d.for_group_trip && d.trip_id) {
    const trip = (await getTrips()).find((t) => t.id === d.trip_id);
    tripId = trip?.id ?? null;
  }

  const db = publicClient();
  if (!db) return { status: "success", message: NOT_CONNECTED_MESSAGE };

  const { error } = await db.from("flight_quote_requests").insert({
    source: "flights_page",
    trip_id: tripId,
    trip_type: d.trip_type,
    origin: d.origin,
    destination: d.destination,
    depart_date: d.depart_date,
    return_date: d.trip_type === "round_trip" ? d.return_date : null,
    adults: d.adults,
    children: d.children,
    cabin_class: d.cabin_class,
    preferred_airline: d.preferred_airline,
    flexible_dates: d.flexible_dates === "yes",
    full_name: d.full_name,
    email: d.email,
    whatsapp: d.whatsapp,
    special_requests: d.special_requests,
  });
  if (error) {
    console.error("[flight]", error);
    return { status: "error", message: GENERIC_ERROR };
  }

  await notifyAdmin(`New flight quote request: ${d.origin} → ${d.destination}`, {
    Name: d.full_name,
    Email: d.email,
    WhatsApp: d.whatsapp,
    Trip: d.trip_type === "round_trip" ? "Round trip" : "One way",
    Dates: `${d.depart_date}${d.return_date ? " → " + d.return_date : ""}`,
    Passengers: `${d.adults} adult(s), ${d.children} child(ren)`,
    Cabin: cabinLabels[d.cabin_class],
    Airline: d.preferred_airline,
    Flexible: d.flexible_dates,
    Requests: d.special_requests,
  });

  return {
    status: "success",
    message: `Thank you, ${d.full_name.split(" ")[0]}! We'll research options and send you a personalised quote. Fares and availability are only confirmed at the time of ticketing.`,
  };
}

/* ------------------------------------------------------------------ */
/* Join the Club / newsletter                                          */
/* ------------------------------------------------------------------ */
export async function submitJoin(_: FormState, form: FormData): Promise<FormState> {
  const raw = {
    ...entries(form),
    destinations: form.getAll("destinations").map(String),
    trip_styles: form.getAll("trip_styles").map(String),
    travel_months: form.getAll("travel_months").map(String),
  };
  const parsed = joinSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", message: "Please check the highlighted fields.", errors: flattenErrors(parsed.error) };
  const d = parsed.data;
  // Spam check runs after validation so real people always see helpful errors.
  if (isLikelySpam(form)) return SPAM_RESPONSE;

  const db = publicClient();
  if (!db) return { status: "success", message: NOT_CONNECTED_MESSAGE };

  const { error } = await db.from("waitlist_subscribers").insert({ ...d });
  if (error && error.code !== "23505") {
    console.error("[join]", error);
    return { status: "error", message: GENERIC_ERROR };
  }
  if (!error) await notifyAdmin("New club member", { Name: d.first_name, Email: d.email, Country: d.country, Source: d.source });

  return {
    status: "success",
    message: error ? "You're already on the list — we'll be in touch soon." : `Welcome to the club, ${d.first_name}. Watch your inbox for first access to new trips.`,
  };
}

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */
export async function submitContact(_: FormState, form: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse(entries(form));
  if (!parsed.success) return { status: "error", message: "Please check the highlighted fields.", errors: flattenErrors(parsed.error) };
  const d = parsed.data;
  // Spam check runs after validation so real people always see helpful errors.
  if (isLikelySpam(form)) return SPAM_RESPONSE;

  const db = publicClient();
  if (!db) return { status: "success", message: NOT_CONNECTED_MESSAGE };

  const { error } = await db.from("contact_messages").insert(d);
  if (error) {
    console.error("[contact]", error);
    return { status: "error", message: GENERIC_ERROR };
  }
  await notifyAdmin(`Contact form: ${d.subject}`, { Name: d.name, Email: d.email, Message: d.message });
  return { status: "success", message: "Thank you — we've got your message and will reply within two working days." };
}
