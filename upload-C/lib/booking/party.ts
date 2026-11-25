import type { Trip } from "../types";
import type { AgreementParty } from "./agreement";
import type { Booking } from "./types";

/** Agreement details for a real booking (price snapshot taken at approval). */
export function partyFromBooking(b: Booking): AgreementParty {
  return {
    reference: b.reference,
    full_name: b.full_name,
    date_of_birth: b.date_of_birth,
    nationality: b.nationality,
    country: b.country,
    email: b.email,
    phone: b.phone,
    travelers: b.travelers,
    currency: b.currency ?? "EUR",
    price_per_person: b.price_per_person,
    deposit_per_person: b.deposit_per_person,
    deposit_deadline: b.deposit_deadline,
    balance_deadline: b.balance_deadline,
    trip_title: b.trip_title,
    trip_start: b.trip_start,
    trip_end: b.trip_end,
  };
}

/** A blank sample agreement for a trip (public "Booking Agreement" page). */
export function sampleParty(trip: Trip): AgreementParty {
  return {
    reference: null,
    full_name: null,
    date_of_birth: null,
    nationality: null,
    country: null,
    email: null,
    phone: null,
    travelers: 1,
    currency: trip.currency,
    price_per_person: trip.price,
    deposit_per_person: trip.deposit_amount,
    deposit_deadline: null,
    balance_deadline: trip.balance_due_date,
    trip_title: trip.title,
    trip_start: trip.start_date,
    trip_end: trip.end_date,
  };
}
