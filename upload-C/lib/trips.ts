import "server-only";
import { cache } from "react";
import { demoTrips } from "./demo-trips";
import { publicClient } from "./supabase/public";
import type { Trip } from "./types";

export function normalizeTrip(row: Trip): Trip {
  return {
    ...row,
    price: row.price == null ? null : Number(row.price),
    deposit_amount: row.deposit_amount == null ? null : Number(row.deposit_amount),
    balance_due_date: row.balance_due_date ?? null,
    deposit_due_date: row.deposit_due_date ?? null,
    highlights: row.highlights ?? [],
    itinerary: row.itinerary ?? [],
    included: row.included ?? [],
    faqs: row.faqs ?? [],
    stays: row.stays ?? [],
    excluded: row.excluded ?? [],
    excluded_note: row.excluded_note ?? "",
    audience: row.audience ?? "",
    group_note: row.group_note ?? "",
    short_description: row.short_description ?? "",
    gallery: row.gallery ?? [],
    country: row.country ?? "",
    arrival_airport: row.arrival_airport ?? "",
  };
}

/** All published trips. Falls back to the starter trips until Supabase is connected. */
export const getTrips = cache(async (): Promise<Trip[]> => {
  const db = publicClient();
  if (!db) return demoTrips;
  const { data, error } = await db.from("trips").select("*").eq("published", true).order("sort_order", { ascending: true });
  if (error) {
    console.error("[trips] failed to load trips:", error.message);
    return [];
  }
  return (data as Trip[]).map(normalizeTrip);
});

export const getTripBySlug = cache(async (slug: string): Promise<Trip | null> => {
  const trips = await getTrips();
  return trips.find((t) => t.slug === slug) ?? null;
});

export async function getFeaturedTrips(limit = 4) {
  const trips = await getTrips();
  const featured = trips.filter((t) => t.featured);
  return (featured.length ? featured : trips).slice(0, limit);
}
