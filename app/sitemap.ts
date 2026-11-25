import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getTrips } from "@/lib/trips";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/trips", "/flights", "/how-it-works", "/about", "/faq", "/contact", "/join", "/privacy", "/terms", "/booking-agreement", "/cancellation-policy"];
  const trips = await getTrips();
  return [
    ...pages.map((p) => ({ url: `${site.url}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...trips.map((t) => ({ url: `${site.url}/trips/${t.slug}`, priority: 0.8 })),
  ];
}
