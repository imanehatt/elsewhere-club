"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdmin, requireAdmin } from "@/lib/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { serverClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export type AdminState = { error?: string; ok?: string };

function refreshPublic(slug?: string) {
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/trips/${slug}`);
}

/* ---------------------------- Auth ---------------------------- */

export async function login(_: AdminState, form: FormData): Promise<AdminState> {
  if (!isSupabaseConfigured) return { error: "Supabase isn't connected yet — see README Step 2." };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  const supabase = await serverClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Incorrect email or password." };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { error: "This account doesn't have admin access. Add it to admin_users (README Step 3)." };
  }
  redirect("/admin");
}

export async function logout() {
  const supabase = await serverClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* ---------------------------- Trips ---------------------------- */

const lines = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

const pairs = (v: FormDataEntryValue | null) =>
  lines(v).map((l) => {
    const [a, ...rest] = l.split("|");
    return [a.trim(), rest.join("|").trim()] as const;
  });

const num = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : Number(s);
};

const dateOrNull = z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]);

const tripSchema = z
  .object({
    title: z.string().trim().min(2, "Title is required").max(120),
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "URL slug can only contain lowercase letters, numbers and dashes"),
    destination: z.string().trim().min(1, "Destination is required (use “Coming Soon” if not decided)").max(80),
    country: z.string().trim().max(80),
    arrival_airport: z.string().trim().max(120),
    trip_type: z.string().trim().max(60),
    start_date: dateOrNull,
    end_date: dateOrNull,
    duration_days: z.number().int().min(1).max(60).nullable(),
    duration_nights: z.number().int().min(0).max(60).nullable(),
    price: z.number().min(0).nullable(),
    deposit_amount: z.number().min(0).nullable(),
    balance_due_date: dateOrNull,
    deposit_due_date: dateOrNull,
    currency: z.string().length(3),
    status: z.enum(["interest", "waitlist", "open", "few_spots", "sold_out"]),
    inquiry_only: z.boolean(),
    group_size_min: z.number().int().positive().nullable(),
    group_size_max: z.number().int().positive().nullable(),
    spots_available: z.number().int().min(0).nullable(),
    tagline: z.string().max(200),
    description: z.string().max(6000),
    highlights: z.array(z.string().max(200)).max(20),
    itinerary: z
      .array(
        z.object({
          title: z.string().trim().min(1, "Every day needs a title").max(160),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
          location: z.string().max(120).optional(),
          emoji: z.string().max(16).optional(),
          image: z.string().max(500).optional(),
          summary: z.string().max(400).optional(),
          overnight: z.string().max(120).optional(),
          description: z.string().max(2000).optional(),
          timeline: z
            .array(z.object({ time: z.string().max(40), title: z.string().max(160), items: z.array(z.string().max(500)).max(20), optional: z.boolean().optional(), extra_cost: z.boolean().optional() }))
            .max(20)
            .optional(),
        }),
      )
      .max(40),
    stays: z
      .array(z.object({ name: z.string().trim().min(1).max(60), start: z.string(), end: z.string(), nights: z.number().int().min(0).max(60), summary: z.string().max(200).optional(), image: z.string().max(500).optional() }))
      .max(10),
    audience: z.string().max(120),
    group_note: z.string().max(160),
    short_description: z.string().max(300),
    excluded: z.array(z.string().max(200)).max(40),
    excluded_note: z.string().max(500),
    itinerary_confirmed: z.boolean(),
    accommodation: z.string().max(3000),
    accommodation_confirmed: z.boolean(),
    included: z.array(z.string().max(200)).max(40),
    inclusions_confirmed: z.boolean(),
    faqs: z.array(z.object({ q: z.string().min(1), a: z.string() })).max(30),
    published: z.boolean(),
    featured: z.boolean(),
    sort_order: z.number().int(),
  })
  .refine((d) => !d.start_date || !d.end_date || d.end_date >= d.start_date, { message: "End date must be on or after the start date", path: ["end_date"] });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseJson = (v: FormDataEntryValue | null, fallback: any[]): any[] => {
  try {
    const parsed = JSON.parse(String(v ?? ""));
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const dateField = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s || null;
};

export async function saveTrip(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await getAdmin();
  if (!admin) return { error: "Your session has expired. Please sign in again." };

  const id = String(form.get("id") ?? "") || null;
  const title = String(form.get("title") ?? "");
  const start_date = dateField(form.get("start_date"));
  const end_date = dateField(form.get("end_date"));
  // Duration is calculated from the dates when both are set; otherwise use what was typed.
  let duration_nights = num(form.get("duration_nights"));
  let duration_days = num(form.get("duration_days"));
  if (start_date && end_date && end_date >= start_date) {
    duration_nights = Math.round((Date.parse(end_date) - Date.parse(start_date)) / 86_400_000);
    duration_days = duration_nights + 1;
  }

  const parsed = tripSchema.safeParse({
    title,
    slug: slugify(String(form.get("slug") || title)),
    destination: String(form.get("destination") ?? ""),
    country: String(form.get("country") ?? ""),
    arrival_airport: String(form.get("arrival_airport") ?? ""),
    trip_type: String(form.get("trip_type") || "Curated group travel"),
    start_date,
    end_date,
    duration_days,
    duration_nights,
    price: num(form.get("price")),
    deposit_amount: num(form.get("deposit_amount")),
    balance_due_date: String(form.get("balance_due_date") ?? "") || null,
    deposit_due_date: String(form.get("deposit_due_date") ?? "") || null,
    currency: String(form.get("currency") || "USD").toUpperCase(),
    status: String(form.get("status") ?? ""),
    inquiry_only: form.get("inquiry_only") === "on",
    group_size_min: num(form.get("group_size_min")),
    group_size_max: num(form.get("group_size_max")),
    spots_available: num(form.get("spots_available")),
    tagline: String(form.get("tagline") ?? "").trim(),
    description: String(form.get("description") ?? "").trim(),
    highlights: lines(form.get("highlights")),
    itinerary: parseJson(form.get("itinerary_json"), []).map((d: Record<string, unknown>) => ({
      ...d,
      timeline: Array.isArray(d.timeline)
        ? d.timeline.map((b: { items?: string[] }) => ({ ...b, items: (b.items ?? []).map((x) => String(x).trim()).filter(Boolean) }))
        : undefined,
    })),
    stays: parseJson(form.get("stays_json"), []),
    audience: String(form.get("audience") ?? "").trim(),
    group_note: String(form.get("group_note") ?? "").trim(),
    short_description: String(form.get("short_description") ?? "").trim(),
    excluded: lines(form.get("excluded")),
    excluded_note: String(form.get("excluded_note") ?? "").trim(),
    itinerary_confirmed: form.get("itinerary_confirmed") === "on",
    accommodation: String(form.get("accommodation") ?? "").trim(),
    accommodation_confirmed: form.get("accommodation_confirmed") === "on",
    included: lines(form.get("included")),
    inclusions_confirmed: form.get("inclusions_confirmed") === "on",
    faqs: pairs(form.get("faqs")).map(([q, a]) => ({ q, a })),
    published: form.get("published") === "on",
    featured: form.get("featured") === "on",
    sort_order: num(form.get("sort_order")) ?? 100,
  });
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { error: `${String(i.path[0] ?? "")}: ${i.message}` };
  }

  const { supabase } = admin;
  const result = id
    ? await supabase.from("trips").update(parsed.data).eq("id", id).select("id, slug").single()
    : await supabase.from("trips").insert(parsed.data).select("id, slug").single();

  if (result.error) {
    if (result.error.code === "23505") return { error: "Another trip already uses that URL slug." };
    return { error: result.error.message };
  }
  refreshPublic(result.data.slug);
  if (!id) redirect(`/admin/trips/${result.data.id}?created=1`);
  return { ok: "Saved. Changes are live on the website within a minute." };
}

export async function deleteTrip(form: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(form.get("id"));
  const { data: files } = await supabase.storage.from("trip-images").list(id);
  if (files?.length) await supabase.storage.from("trip-images").remove(files.map((f) => `${id}/${f.name}`));
  await supabase.from("trips").delete().eq("id", id);
  refreshPublic();
  redirect("/admin/trips");
}

/* ---------------------------- Images ---------------------------- */

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function uploadTripImages(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await getAdmin();
  if (!admin) return { error: "Please sign in again." };
  const { supabase } = admin;
  const tripId = String(form.get("trip_id"));
  const files = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Choose at least one image." };

  const { data: trip, error } = await supabase.from("trips").select("slug, gallery, cover_image").eq("id", tripId).single();
  if (error || !trip) return { error: "Trip not found." };

  const urls: string[] = [];
  for (const file of files) {
    if (!ALLOWED.includes(file.type)) return { error: `${file.name}: please upload JPG, PNG, WebP or AVIF.` };
    if (file.size > 8 * 1024 * 1024) return { error: `${file.name} is larger than 8MB. Please resize it first.` };
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${tripId}/${randomUUID()}.${ext}`;
    const up = await supabase.storage.from("trip-images").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    if (up.error) return { error: `Upload failed: ${up.error.message}` };
    urls.push(supabase.storage.from("trip-images").getPublicUrl(path).data.publicUrl);
  }

  const existing = (trip.gallery as string[]) ?? [];
  // First upload becomes the cover photo if the trip doesn't have one yet.
  const cover_image = trip.cover_image ?? urls[0];
  const gallery = trip.cover_image ? [...existing, ...urls] : [...existing, ...urls.slice(1)];
  await supabase.from("trips").update({ gallery, cover_image }).eq("id", tripId);
  refreshPublic(trip.slug);
  revalidatePath(`/admin/trips/${tripId}`);
  return { ok: `${urls.length} image${urls.length > 1 ? "s" : ""} uploaded.` };
}

export async function manageImage(form: FormData) {
  const { supabase } = await requireAdmin();
  const tripId = String(form.get("trip_id"));
  const url = String(form.get("url"));
  const op = String(form.get("op"));
  const { data: trip } = await supabase.from("trips").select("slug, gallery, cover_image").eq("id", tripId).single();
  if (!trip) return;
  let gallery = ((trip.gallery as string[]) ?? []).filter((u) => u !== url);
  let cover = trip.cover_image as string | null;

  if (op === "cover") {
    if (cover && cover !== url) gallery = [cover, ...gallery];
    cover = url;
  } else if (op === "remove") {
    if (cover === url) cover = gallery.shift() ?? null;
    const marker = "/trip-images/";
    const idx = url.indexOf(marker);
    if (idx > -1) await supabase.storage.from("trip-images").remove([decodeURIComponent(url.slice(idx + marker.length))]);
  }
  await supabase.from("trips").update({ gallery, cover_image: cover }).eq("id", tripId);
  refreshPublic(trip.slug);
  revalidatePath(`/admin/trips/${tripId}`);
}

/* ---------------------------- Requests ---------------------------- */

const tables = {
  inquiries: { table: "trip_inquiries", statuses: ["new", "contacted", "offer_sent", "confirmed", "declined", "cancelled"] },
  flights: { table: "flight_quote_requests", statuses: ["new", "researching", "quoted", "booked", "closed"] },
} as const;

export async function updateRequest(form: FormData) {
  const { supabase } = await requireAdmin();
  const kind = String(form.get("kind")) as keyof typeof tables;
  const cfg = tables[kind];
  if (!cfg) return;
  const status = String(form.get("status"));
  const update: Record<string, string> = {};
  if ((cfg.statuses as readonly string[]).includes(status)) update.status = status;
  if (form.has("admin_notes")) update.admin_notes = String(form.get("admin_notes")).slice(0, 4000);
  await supabase.from(cfg.table).update(update).eq("id", String(form.get("id")));
  revalidatePath(`/admin/${kind}`);
  revalidatePath("/admin");
}

export async function deleteSubscriber(form: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("waitlist_subscribers").delete().eq("id", String(form.get("id")));
  revalidatePath("/admin/subscribers");
}

export async function toggleMessage(form: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("contact_messages").update({ handled: form.get("handled") === "true" }).eq("id", String(form.get("id")));
  revalidatePath("/admin/messages");
}
