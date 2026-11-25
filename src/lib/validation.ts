import { z } from "zod";

const trimmed = (max: number) => z.string().trim().max(max);
const required = (label: string, max = 200) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max);
const optional = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

export const email = z.string({ error: "Please enter a valid email address" }).trim().toLowerCase().pipe(z.email("Please enter a valid email address")).pipe(z.string().max(254));

/** International format, e.g. +44 7700 900123 */
export const whatsapp = z
  .string({ error: "Please enter your WhatsApp number" })
  .trim()
  .regex(/^\+[1-9][0-9\s\-().]{6,20}$/, "Include your country code, e.g. +44 7700 900123");

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal(""), z.null()])
  .optional()
  .transform((v) => v === "on" || v === "true");

const dateStr = z.string({ error: "Please choose a date" }).regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date");
const optionalDate = z
  .union([dateStr, z.literal("")])
  .optional()
  .transform((v) => (v ? v : null));

export const cabinClasses = ["economy", "premium_economy", "business", "first"] as const;
export const cabinLabels: Record<(typeof cabinClasses)[number], string> = {
  economy: "Economy",
  premium_economy: "Premium Economy",
  business: "Business",
  first: "First",
};

// Checked inside superRefine so it's reported together with the other conditional errors.
const consent = z.string().optional();
const CONSENT_MSG = "Please accept the Privacy Policy to continue";


const optionalDateStr = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a valid date"), z.literal("")])
  .optional()
  .transform((v) => (v ? v : null));

export const tripInquirySchema = z
  .object({
    trip_id: required("Trip", 100),
    full_name: required("Full name", 120),
    email,
    whatsapp,
    country: required("Country of residence", 80),
    travellers: z.coerce.number({ error: "Please enter a number" }).int().min(1, "At least 1 traveller").max(12, "For groups over 12, please contact us"),
    special_requests: optional(2000),
    flights: z.enum(["yes", "no"], { error: "Please choose an option" }),
    flight_origin: optional(120),
    flight_depart_date: optionalDateStr,
    flight_return_date: optionalDateStr,
    flight_cabin_class: z.union([z.enum(cabinClasses), z.literal("")]).optional().transform((v) => v || null),
    flight_passengers: z.union([z.coerce.number().int().min(1, "At least 1 passenger").max(12), z.literal("")]).optional().transform((v) => (v === "" || v == null ? null : v)),
    flight_airline: optional(80),
    flight_flexible: z.enum(["yes", "no"]).optional(),
    consent,
  })
  .superRefine((d, ctx) => {
    if (d.consent !== "on") ctx.addIssue({ code: "custom", path: ["consent"], message: CONSENT_MSG });
    if (d.flights === "yes") {
      if (!d.flight_origin) ctx.addIssue({ code: "custom", path: ["flight_origin"], message: "Where will you fly from?" });
      if (!d.flight_cabin_class) ctx.addIssue({ code: "custom", path: ["flight_cabin_class"], message: "Please choose a cabin class" });
      if (!d.flight_passengers) ctx.addIssue({ code: "custom", path: ["flight_passengers"], message: "How many passengers?" });
      if (d.flight_depart_date && d.flight_return_date && d.flight_return_date < d.flight_depart_date)
        ctx.addIssue({ code: "custom", path: ["flight_return_date"], message: "Return must be after departure" });
    }
  });

/** Age in whole years on a given date (both YYYY-MM-DD). */
export function ageOn(dob: string, on: string) {
  const [y, m, d] = dob.split("-").map(Number);
  const [Y, M, D] = on.split("-").map(Number);
  return Y - y - (M < m || (M === m && D < d) ? 1 : 0);
}

/** Request Your Spot for a bookable trip (status "open" / "few_spots"). */
export const bookingRequestSchema = z
  .object({
    trip_id: required("Trip", 100),
    full_name: required("Full legal name", 120).pipe(z.string().min(2, "Please enter your full legal name")),
    email,
    phone: z
      .string({ error: "Please enter your phone number" })
      .trim()
      .regex(/^\+[1-9][0-9\s\-().]{6,20}$/, "Include your country code, e.g. +212 600 000000"),
    country: required("Country of residence", 80),
    nationality: required("Nationality", 80),
    date_of_birth: z.string({ error: "Please enter your date of birth" }).regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter your date of birth"),
    travellers: z.coerce.number({ error: "Please enter a number" }).int().min(1, "At least 1 traveler").max(12, "For groups over 12, please contact us"),
    special_requests: optional(2000),
    flights: z.enum(["yes", "no"], { error: "Please choose an option" }),
    flight_origin: optional(120),
    flight_depart_date: optionalDateStr,
    flight_return_date: optionalDateStr,
    flight_cabin_class: z.union([z.enum(cabinClasses), z.literal("")]).optional().transform((v) => v || null),
    flight_passengers: z.union([z.coerce.number().int().min(1, "At least 1 passenger").max(12), z.literal("")]).optional().transform((v) => (v === "" || v == null ? null : v)),
    flight_airline: optional(80),
    flight_flexible: z.enum(["yes", "no"]).optional(),
    consent,
  })
  .superRefine((d, ctx) => {
    if (d.consent !== "on") ctx.addIssue({ code: "custom", path: ["consent"], message: CONSENT_MSG });
    const today = new Date().toISOString().slice(0, 10);
    if (d.date_of_birth > today || d.date_of_birth < "1900-01-01") ctx.addIssue({ code: "custom", path: ["date_of_birth"], message: "Please check your date of birth" });
    if (d.flights === "yes") {
      if (!d.flight_origin) ctx.addIssue({ code: "custom", path: ["flight_origin"], message: "Where will you fly from?" });
      if (!d.flight_cabin_class) ctx.addIssue({ code: "custom", path: ["flight_cabin_class"], message: "Please choose a cabin class" });
      if (!d.flight_passengers) ctx.addIssue({ code: "custom", path: ["flight_passengers"], message: "How many passengers?" });
      if (d.flight_depart_date && d.flight_return_date && d.flight_return_date < d.flight_depart_date)
        ctx.addIssue({ code: "custom", path: ["flight_return_date"], message: "Return must be after departure" });
    }
  });

export const flightQuoteSchema = z
  .object({
    trip_type: z.enum(["round_trip", "one_way"]),
    origin: required("Departure airport/city", 120),
    destination: required("Destination airport/city", 120),
    depart_date: dateStr,
    return_date: optionalDate,
    adults: z.coerce.number().int().min(1, "At least 1 adult").max(9),
    children: z.coerce.number().int().min(0).max(9),
    cabin_class: z.enum(cabinClasses, { error: "Please choose a cabin class" }),
    preferred_airline: optional(80),
    flexible_dates: z.enum(["yes", "no"]),
    full_name: required("Full name", 120),
    email,
    whatsapp,
    special_requests: optional(2000),
    for_group_trip: checkbox,
    trip_id: optional(100),
    consent,
  })
  .superRefine((d, ctx) => {
    if (d.consent !== "on") ctx.addIssue({ code: "custom", path: ["consent"], message: CONSENT_MSG });
    const today = new Date().toISOString().slice(0, 10);
    if (d.depart_date < today) ctx.addIssue({ code: "custom", path: ["depart_date"], message: "Departure date must be in the future" });
    if (d.trip_type === "round_trip") {
      if (!d.return_date) ctx.addIssue({ code: "custom", path: ["return_date"], message: "Please choose a return date" });
      else if (d.return_date < d.depart_date) ctx.addIssue({ code: "custom", path: ["return_date"], message: "Return must be after departure" });
    }
    if (d.for_group_trip && !d.trip_id) ctx.addIssue({ code: "custom", path: ["trip_id"], message: "Please choose your trip" });
  });

const multi = z.array(trimmed(60)).max(20).default([]);

export const joinSchema = z.object({
  first_name: required("First name", 60),
  email,
  country: optional(80),
  destinations: multi,
  trip_styles: multi,
  travel_months: multi,
  instagram: z
    .string()
    .trim()
    .max(31)
    .regex(/^@?[A-Za-z0-9._]*$/, "Letters, numbers, dots and underscores only")
    .optional()
    .transform((v) => (v ? v.replace(/^@/, "") : null)),
  marketing_opt_in: checkbox,
  source: trimmed(40).optional().transform((v) => v || "join_page"),
});

export const contactSchema = z.object({
  name: required("Name", 120),
  email,
  subject: required("Subject", 160),
  message: required("Message", 4000).pipe(z.string().min(10, "Please tell us a little more")),
});

export type FieldErrors = Record<string, string>;

export function flattenErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
