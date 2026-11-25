import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serviceClient } from "../supabase/service";
import { normalizeTrip } from "../trips";
import type { Trip } from "../types";
import type { Booking, BookingAgreementRow, BookingPayment } from "./types";

/** A new secret for a traveler link. Only its SHA-256 hash is stored. */
export function newToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

const NUMERIC = ["price_per_person", "deposit_per_person", "total_amount", "deposit_amount", "balance_amount"] as const;
export function normalizeBooking(row: Record<string, unknown>): Booking {
  const b = { ...row } as Record<string, unknown>;
  for (const k of NUMERIC) b[k] = b[k] == null ? null : Number(b[k]);
  return b as unknown as Booking;
}
export function normalizePayment(row: Record<string, unknown>): BookingPayment {
  return { ...(row as unknown as BookingPayment), expected_amount: Number(row.expected_amount), received_amount: row.received_amount == null ? null : Number(row.received_amount) };
}

export type TokenLookup =
  | { state: "ok"; booking: Booking; tokenHash: string }
  | { state: "expired"; booking: Booking }
  | { state: "invalid" }
  | { state: "unavailable" };

/** Finds the booking for a traveler link and checks it hasn't expired. */
export async function getBookingByToken(token: string): Promise<TokenLookup> {
  const db = serviceClient();
  if (!db) return { state: "unavailable" };
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return { state: "invalid" };
  const tokenHash = hashToken(token);
  const { data, error } = await db.from("bookings").select("*").eq("token_hash", tokenHash).maybeSingle();
  if (error) console.error("[booking] token lookup:", error.message);
  if (!data) return { state: "invalid" };
  const booking = normalizeBooking(data);
  if (!booking.token_expires_at || Date.parse(booking.token_expires_at) < Date.now()) return { state: "expired", booking };
  return { state: "ok", booking, tokenHash };
}

export async function getBookingExtras(db: SupabaseClient, bookingId: string) {
  const [{ data: agreement }, { data: payments }] = await Promise.all([
    db.from("booking_agreements").select("*").eq("booking_id", bookingId).maybeSingle(),
    db.from("booking_payments").select("*").eq("booking_id", bookingId).order("created_at", { ascending: true }),
  ]);
  return {
    agreement: (agreement as BookingAgreementRow | null) ?? null,
    payments: (payments ?? []).map(normalizePayment),
  };
}

/** Loads the trip (published or not) for a booking — used for the itinerary schedules. */
export async function getTripForBooking(db: SupabaseClient, tripId: string | null): Promise<Trip | null> {
  if (!tripId) return null;
  const { data } = await db.from("trips").select("*").eq("id", tripId).maybeSingle();
  return data ? normalizeTrip(data as Trip) : null;
}

/** Appends to the audit history. Never throws — logging must not break a booking step. */
export async function logEvent(db: SupabaseClient, bookingId: string | null, actor: string, action: string, details: Record<string, unknown> = {}) {
  const { error } = await db.from("booking_events").insert({ booking_id: bookingId, actor, action, details });
  if (error) console.error("[audit]", action, error.message);
}

/** Visitor IP + browser, recorded as evidence when an agreement is signed. */
export async function requestFingerprint() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || null;
  return { ip, userAgent: (h.get("user-agent") ?? "").slice(0, 500) || null };
}

/** Suggests the next free reference, e.g. EC-BALI26-001. */
export async function suggestReference(db: SupabaseClient, b: Pick<Booking, "trip_slug" | "trip_start">) {
  const word = (b.trip_slug.split("-")[0] || "TRIP").toUpperCase().slice(0, 6);
  const yy = (b.trip_start ?? new Date().toISOString()).slice(2, 4);
  const prefix = `EC-${word}${yy}-`;
  const { data } = await db.from("bookings").select("reference").like("reference", `${prefix}%`);
  const used = new Set((data ?? []).map((r) => r.reference));
  for (let i = 1; i < 1000; i++) {
    const ref = `${prefix}${String(i).padStart(3, "0")}`;
    if (!used.has(ref)) return ref;
  }
  return `${prefix}${Date.now().toString().slice(-5)}`;
}

/** Absolute URL of a traveler's booking page. */
export function bookingUrl(token: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/booking/${token}`;
}

export function getDb() {
  return serviceClient();
}
