"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";
import { buildAgreement, hasAgreementTemplate } from "@/lib/booking/agreement";
import { approvalEmail, balanceReceiptEmail, confirmationEmail, declinedEmail, emailConfigured, paymentRejectedEmail, sendEmail, type SendResult } from "@/lib/booking/email";
import { agreementPdf, receiptPdf } from "@/lib/booking/pdf";
import { partyFromBooking } from "@/lib/booking/party";
import { bookingUrl, getTripForBooking, logEvent, newToken, normalizeBooking, normalizePayment } from "@/lib/booking/server";
import { DEFAULT_BANK, DEFAULT_ORGANIZER, missingForLive } from "@/lib/booking/settings";
import type { BankSettings, Booking, BookingAgreementRow, OrganizerSettings } from "@/lib/booking/types";

export type BookingAdminState = { error?: string; ok?: string; link?: string };

const s = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const today = () => new Date().toISOString().slice(0, 10);

async function ctx() {
  const { supabase, user } = await requireAdmin();
  // A previously shown one-time link shouldn't linger after the next admin action.
  (await cookies()).delete({ name: "ec_flash", path: "/admin" });
  return { db: supabase, actor: `admin:${user.email ?? user.id}` };
}

async function loadSettings(db: SupabaseClient) {
  const [{ data: o }, { data: b }] = await Promise.all([
    db.from("organizer_settings").select("*").eq("id", 1).maybeSingle(),
    db.from("bank_settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  const org: OrganizerSettings = { ...DEFAULT_ORGANIZER, ...(o ?? {}) };
  if (!Array.isArray(org.cancellation_tiers) || !org.cancellation_tiers.length) org.cancellation_tiers = DEFAULT_ORGANIZER.cancellation_tiers;
  const bank: BankSettings = { ...DEFAULT_BANK, ...(b ?? {}) };
  return { org, bank };
}

async function loadBooking(db: SupabaseClient, id: string): Promise<Booking | null> {
  const { data } = await db.from("bookings").select("*").eq("id", id).maybeSingle();
  return data ? normalizeBooking(data) : null;
}

/** Shows an action's result at the top of the booking page after it refreshes (admin-only, 5 minutes). */
async function flash(id: string, message: string, link?: string) {
  (await cookies()).set("ec_flash", JSON.stringify({ id, message, ...(link ? { link } : {}) }), { httpOnly: true, sameSite: "strict", path: "/admin", maxAge: 300, secure: process.env.NODE_ENV === "production" && Boolean(link?.startsWith("https")) });
}

const refresh = (id?: string) => {
  revalidatePath("/admin/bookings");
  if (id) revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/admin");
};

/** Creates a fresh secret link (the old one stops working). */
async function rotateLink(db: SupabaseClient, b: Booking, org: OrganizerSettings) {
  const { token, hash } = newToken();
  const expires = new Date(Date.now() + (org.link_validity_days || 14) * 86_400_000).toISOString();
  const { error } = await db.from("bookings").update({ token_hash: hash, token_expires_at: expires }).eq("id", b.id);
  if (error) throw new Error(error.message);
  return { token, url: bookingUrl(token), expires };
}

/** Emails a traveler only in live mode (test bookings never email real people). */
async function mailTraveler(db: SupabaseClient, b: Booking, org: OrganizerSettings, template: string, msg: { subject: string; html: string; attachments?: { filename: string; content: Uint8Array }[] }): Promise<SendResult> {
  if (!org.live_mode || b.is_test) return { sent: false, reason: "Test mode — no email is sent to the traveler." };
  const r = await sendEmail({ to: b.email, ...msg, replyTo: org.support_email || org.company_email || undefined });
  await logEvent(db, b.id, "system", r.sent ? "email_sent" : "email_not_sent", { template, ...(r.sent ? {} : { reason: r.reason }) });
  return r;
}

/**
 * Emails the traveler a message containing a fresh link. The link is only replaced when an email
 * can actually be sent; if sending fails, the new link is shown to the admin to pass on.
 */
async function emailWithNewLink(
  db: SupabaseClient,
  b: Booking,
  org: OrganizerSettings,
  template: string,
  build: (url: string, fresh: Booking) => Promise<{ subject: string; html: string; attachments?: { filename: string; content: Uint8Array }[] }>,
): Promise<{ sent: boolean; note: string; link?: string }> {
  if (!org.live_mode || b.is_test) return { sent: false, note: "Test mode — no email sent to the traveler." };
  if (!emailConfigured()) {
    await logEvent(db, b.id, "system", "email_not_sent", { template, reason: "email not set up" });
    return { sent: false, note: "Email isn't set up yet, so the traveler wasn't emailed — let her know personally (her existing link still works)." };
  }
  const { url } = await rotateLink(db, b, org);
  const fresh = (await loadBooking(db, b.id))!;
  const r = await mailTraveler(db, fresh, org, template, await build(url, fresh));
  return r.sent ? { sent: true, note: "The traveler has been emailed." } : { sent: false, note: `The email failed (${r.reason}). Her old link no longer works — send her the new link below.`, link: url };
}

/* ------------------------------------------------------------------ */
/* Approve (and optionally send the agreement link)                    */
/* ------------------------------------------------------------------ */
export async function approveBooking(_: BookingAdminState, form: FormData): Promise<BookingAdminState> {
  const { db, actor } = await ctx();
  const id = s(form.get("id"));
  const b = await loadBooking(db, id);
  if (!b) return { error: "Booking not found." };
  if (b.status !== "inquiry_received") return { error: "This request has already been handled." };
  if (!hasAgreementTemplate(b.trip_slug)) return { error: "There's no booking agreement template for this trip yet." };
  const trip = await getTripForBooking(db, b.trip_id);
  if (!trip) return { error: "The trip for this booking no longer exists." };
  if (trip.price == null) return { error: "Set the trip price first (Admin → Trips)." };
  if (trip.deposit_amount == null) return { error: "Set the deposit for this trip first (Admin → Trips → Deposit per person)." };

  const reference = s(form.get("reference")).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9-]{2,30}$/.test(reference)) return { error: "Use 3–31 capital letters, numbers or dashes for the reference (e.g. EC-BALI26-001)." };
  const depositDeadline = s(form.get("deposit_deadline")) || trip.deposit_due_date || "";
  if (!isDate(depositDeadline)) return { error: "Set the payment deadline for the deposit." };
  if (depositDeadline < today()) return { error: "The deposit deadline can't be in the past." };
  const balanceDeadline = s(form.get("balance_deadline")) || trip.balance_due_date || "";
  if (balanceDeadline && !isDate(balanceDeadline)) return { error: "Check the final balance deadline." };
  if (balanceDeadline && balanceDeadline < depositDeadline) return { error: "The balance deadline should be after the deposit deadline." };

  const { org } = await loadSettings(db);
  const n = b.travelers;
  const { error } = await db
    .from("bookings")
    .update({
      status: "approved",
      reference,
      currency: trip.currency,
      price_per_person: trip.price,
      deposit_per_person: trip.deposit_amount,
      total_amount: trip.price * n,
      deposit_amount: trip.deposit_amount * n,
      balance_amount: (trip.price - trip.deposit_amount) * n,
      deposit_deadline: depositDeadline,
      balance_deadline: balanceDeadline || null,
      approved_at: new Date().toISOString(),
      approved_by: actor,
      is_test: !org.live_mode,
    })
    .eq("id", b.id)
    .eq("status", "inquiry_received");
  if (error) return { error: error.code === "23505" ? `Reference ${reference} is already used — choose another.` : error.message };
  await logEvent(db, b.id, actor, "approved", { reference, deposit_deadline: depositDeadline, balance_deadline: balanceDeadline || null, test: !org.live_mode });
  refresh(b.id);

  if (s(form.get("intent")) === "approve_send") return sendAgreementLink(_, form);
  await flash(b.id, `Approved as ${reference}. Next: send the approval email with the agreement link.`);
  return { ok: `Approved as ${reference}. Next: send the agreement link.` };
}

/* ------------------------------------------------------------------ */
/* Send (or re-send) the secure agreement / booking link               */
/* ------------------------------------------------------------------ */
export async function sendAgreementLink(_: BookingAdminState, form: FormData): Promise<BookingAdminState> {
  const { db, actor } = await ctx();
  const b = await loadBooking(db, s(form.get("id")));
  if (!b) return { error: "Booking not found." };
  if (["inquiry_received", "cancelled"].includes(b.status)) return { error: "Approve the request first." };
  const { org } = await loadSettings(db);
  const live = org.live_mode && !b.is_test;

  if (live && (b.status === "approved" || b.status === "agreement_pending")) {
    const doc = buildAgreement({ party: partyFromBooking(b), org, trip: await getTripForBooking(db, b.trip_id), agreementDate: today() });
    if (doc.missing.length) return { error: `The agreement is missing: ${doc.missing.join(", ")}. Complete Admin → Settings (and the booking deadlines) first.` };
  }

  const { url } = await rotateLink(db, b, org);
  const fresh = (await loadBooking(db, b.id))!;
  const now = new Date().toISOString();
  if (b.status === "approved") await db.from("bookings").update({ status: "agreement_pending", link_sent_at: now }).eq("id", b.id).eq("status", "approved");
  else await db.from("bookings").update({ link_sent_at: now }).eq("id", b.id);
  await logEvent(db, b.id, actor, "link_created", { expires: fresh.token_expires_at });

  const r = await mailTraveler(db, fresh, org, "approval", approvalEmail(fresh, url, org));
  const message = r.sent
    ? `Approval email sent to ${b.email}. The link expires on ${fresh.token_expires_at?.slice(0, 10)}.`
    : `Link created — ${r.reason} Copy it and open it yourself to test, or send it to the traveler personally.`;
  // The secret is shown once on the next page load (admin-only, 5-minute cookie), never stored in plain text.
  await flash(b.id, message, url);
  refresh(b.id);
  return { ok: message, link: url };
}

/* ------------------------------------------------------------------ */
/* Edit deadlines (only before signing — after that the agreement is fixed) */
/* ------------------------------------------------------------------ */
export async function updateDeadlines(_: BookingAdminState, form: FormData): Promise<BookingAdminState> {
  const { db, actor } = await ctx();
  const b = await loadBooking(db, s(form.get("id")));
  if (!b) return { error: "Booking not found." };
  if (!["approved", "agreement_pending"].includes(b.status)) return { error: "Deadlines can only be changed before the agreement is signed." };
  const dep = s(form.get("deposit_deadline"));
  const bal = s(form.get("balance_deadline"));
  if (!isDate(dep)) return { error: "Set the deposit deadline." };
  if (bal && (!isDate(bal) || bal < dep)) return { error: "The balance deadline should be a date after the deposit deadline." };
  await db.from("bookings").update({ deposit_deadline: dep, balance_deadline: bal || null }).eq("id", b.id);
  await logEvent(db, b.id, actor, "deadlines_changed", { deposit_deadline: dep, balance_deadline: bal || null });
  await flash(b.id, "Deadlines updated.");
  refresh(b.id);
  return { ok: "Deadlines updated." };
}

/* ------------------------------------------------------------------ */
/* Decline / cancel                                                    */
/* ------------------------------------------------------------------ */
export async function cancelBooking(_: BookingAdminState, form: FormData): Promise<BookingAdminState> {
  const { db, actor } = await ctx();
  const b = await loadBooking(db, s(form.get("id")));
  if (!b) return { error: "Booking not found." };
  if (b.status === "cancelled") return { error: "Already cancelled." };
  const decline = b.status === "inquiry_received";
  const reason = s(form.get("reason")).slice(0, 1000) || null;
  await db.from("bookings").update({ status: "cancelled", declined: decline, cancel_reason: reason, cancelled_at: new Date().toISOString() }).eq("id", b.id).neq("status", "cancelled");
  await logEvent(db, b.id, actor, decline ? "declined" : "cancelled", { reason });
  let note = "";
  if (decline && form.get("notify") === "on") {
    const { org } = await loadSettings(db);
    const r = org.live_mode ? await sendEmail({ to: b.email, ...declinedEmail(b, org, reason), replyTo: org.support_email || undefined }) : ({ sent: false, reason: "Test mode — no email sent." } as SendResult);
    await logEvent(db, b.id, "system", r.sent ? "email_sent" : "email_not_sent", { template: "declined", ...(r.sent ? {} : { reason: r.reason }) });
    note = r.sent ? " The traveler has been emailed." : ` (${r.reason})`;
  }
  const done = `${decline ? "Request declined" : "Booking cancelled"}.${note}${!decline ? " Handle any refund according to the agreement and record it in the notes." : ""}`;
  await flash(b.id, done);
  refresh(b.id);
  return { ok: done };
}

/* ------------------------------------------------------------------ */
/* Payment verification (Step 5) — only funds in the official account count */
/* ------------------------------------------------------------------ */
export async function verifyPayment(_: BookingAdminState, form: FormData): Promise<BookingAdminState> {
  const { db, actor } = await ctx();
  const b = await loadBooking(db, s(form.get("id")));
  if (!b) return { error: "Booking not found." };
  const kind = s(form.get("kind")) as "deposit" | "balance";
  if (kind !== "deposit" && kind !== "balance") return { error: "Choose deposit or balance." };
  if (form.get("confirm_funds") !== "on") return { error: "Tick the box to confirm the money has arrived in the official account." };
  const amount = Number(s(form.get("received_amount")));
  const receivedOn = s(form.get("received_on"));
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter the amount received." };
  if (!isDate(receivedOn) || receivedOn > today()) return { error: "Enter the date the funds arrived." };
  const allowedStatus = kind === "deposit" ? ["agreement_signed", "awaiting_payment", "payment_under_review"] : ["confirmed"];
  if (!allowedStatus.includes(b.status)) return { error: kind === "deposit" ? "The deposit can be confirmed after the agreement is signed." : "Confirm the deposit before the balance." };

  const { data: rows } = await db.from("booking_payments").select("*").eq("booking_id", b.id).eq("kind", kind);
  const payments = (rows ?? []).map(normalizePayment);
  if (payments.some((p) => p.status === "verified")) return { error: "This payment is already confirmed — nothing was changed." };
  const receipt = `${b.reference}-${kind === "deposit" ? "D" : "B"}`;
  const pending = payments.find((p) => p.status === "under_review");
  const fields = { status: "verified", received_amount: amount, received_on: receivedOn, verified_at: new Date().toISOString(), verified_by: actor, receipt_number: receipt };
  const { error } = pending
    ? await db.from("booking_payments").update(fields).eq("id", pending.id).eq("status", "under_review")
    : await db.from("booking_payments").insert({ booking_id: b.id, kind, expected_amount: (kind === "deposit" ? b.deposit_amount : b.balance_amount) ?? amount, ...fields });
  if (error) return { error: error.code === "23505" ? "This payment is already confirmed — nothing was changed." : error.message };
  const expected = kind === "deposit" ? b.deposit_amount : b.balance_amount;
  await logEvent(db, b.id, actor, "payment_verified", { kind, amount, received_on: receivedOn, receipt, expected, from_proof: Boolean(pending) });

  const { org } = await loadSettings(db);
  const { data: payRow } = await db.from("booking_payments").select("*").eq("booking_id", b.id).eq("kind", kind).eq("status", "verified").single();
  const payment = normalizePayment(payRow);
  let msg = `${kind === "deposit" ? "Deposit" : "Balance"} confirmed (receipt ${receipt}).`;
  if (expected != null && Math.abs(amount - expected) > 0.009) msg += ` Note: the expected amount was ${expected}.`;

  if (kind === "deposit") {
    await db.from("bookings").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", b.id).in("status", allowedStatus);
    await logEvent(db, b.id, actor, "booking_confirmed", {});
    // Send the confirmation exactly once.
    let link: string | undefined;
    const { data: claim } = await db.from("bookings").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", b.id).is("confirmation_sent_at", null).select("id");
    if (claim?.length) {
      const r = await sendConfirmation(db, b.id, org);
      msg += r.sent ? " Confirmation email (with agreement and receipt) sent." : ` ${r.note}`;
      link = r.link;
      if (!r.sent) await db.from("bookings").update({ confirmation_sent_at: null }).eq("id", b.id);
    }
    await flash(b.id, msg, link);
  } else {
    const fresh = (await loadBooking(db, b.id))!;
    const r = await emailWithNewLink(db, fresh, org, "balance_receipt", async (url, bk) => ({
      ...balanceReceiptEmail(bk, url, payment, org),
      attachments: [{ filename: `Receipt-${receipt}.pdf`, content: await receiptPdf({ booking: bk, payment, org }) }],
    }));
    msg += r.sent ? " Receipt emailed." : ` ${r.note}`;
    await flash(b.id, msg, r.link);
  }
  refresh(b.id);
  return { ok: msg };
}

async function sendConfirmation(db: SupabaseClient, id: string, org: OrganizerSettings) {
  const b = (await loadBooking(db, id))!;
  const [{ data: ag }, { data: dep }] = await Promise.all([
    db.from("booking_agreements").select("*").eq("booking_id", id).single(),
    db.from("booking_payments").select("*").eq("booking_id", id).eq("kind", "deposit").eq("status", "verified").single(),
  ]);
  const agreement = ag as BookingAgreementRow;
  const deposit = normalizePayment(dep);
  return emailWithNewLink(db, b, org, "confirmation", async (url, bk) => ({
    ...confirmationEmail(bk, url, deposit, org),
    attachments: [
      { filename: `Booking-Agreement-${bk.reference}.pdf`, content: await agreementPdf(agreement.content, { reference: bk.reference, signature: { name: agreement.signer_name, png: agreement.signature_png, signedAt: agreement.signed_at, ip: agreement.ip, hash: agreement.content_hash } }) },
      { filename: `Receipt-${deposit.receipt_number}.pdf`, content: await receiptPdf({ booking: bk, payment: deposit, org }) },
    ],
  }));
}

export async function resendConfirmation(_: BookingAdminState, form: FormData): Promise<BookingAdminState> {
  const { db, actor } = await ctx();
  const b = await loadBooking(db, s(form.get("id")));
  if (!b || b.status !== "confirmed") return { error: "Only confirmed bookings have a confirmation email." };
  const { org } = await loadSettings(db);
  const r = await sendConfirmation(db, b.id, org);
  if (r.sent) await db.from("bookings").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", b.id);
  await logEvent(db, b.id, actor, "confirmation_resent", { sent: r.sent });
  if (r.sent || r.link) await flash(b.id, r.sent ? "Confirmation email sent again." : r.note, r.link);
  refresh(b.id);
  return r.sent ? { ok: "Confirmation email sent again." } : { error: r.note };
}

export async function rejectPayment(_: BookingAdminState, form: FormData): Promise<BookingAdminState> {
  const { db, actor } = await ctx();
  const b = await loadBooking(db, s(form.get("id")));
  if (!b) return { error: "Booking not found." };
  const paymentId = s(form.get("payment_id"));
  const note = s(form.get("note")).slice(0, 1000) || null;
  const { data, error } = await db.from("booking_payments").update({ status: "rejected", review_note: note, verified_by: actor, verified_at: new Date().toISOString() }).eq("id", paymentId).eq("booking_id", b.id).eq("status", "under_review").select("kind");
  if (error || !data?.length) return { error: "That proof is no longer waiting for review." };
  const kind = data[0].kind as "deposit" | "balance";
  if (kind === "deposit") await db.from("bookings").update({ status: "awaiting_payment" }).eq("id", b.id).eq("status", "payment_under_review");
  await logEvent(db, b.id, actor, "proof_rejected", { kind, note });
  const { org } = await loadSettings(db);
  const r = await emailWithNewLink(db, b, org, "payment_rejected", async (url, bk) => paymentRejectedEmail(bk, url, note, org));
  const done = `Proof marked as not matched. ${r.note}`;
  await flash(b.id, done, r.link);
  refresh(b.id);
  return { ok: done };
}

export async function saveBookingNotes(_: BookingAdminState, form: FormData): Promise<BookingAdminState> {
  const { db } = await ctx();
  const id = s(form.get("id"));
  const { error } = await db.from("bookings").update({ admin_notes: s(form.get("admin_notes")).slice(0, 4000) || null }).eq("id", id);
  if (!error) await flash(id, "Notes saved.");
  refresh(id);
  return error ? { error: error.message } : { ok: "Notes saved." };
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */
export async function saveOrganizerSettings(_: BookingAdminState, form: FormData): Promise<BookingAdminState> {
  const { db, actor } = await ctx();
  const tiers = [0, 1, 2, 3, 4, 5]
    .map((i) => ({ period: s(form.get(`tier_period_${i}`)).slice(0, 200), refund: s(form.get(`tier_refund_${i}`)).slice(0, 200) }))
    .filter((t) => t.period || t.refund);
  const refundDays = s(form.get("refund_days"));
  const validity = Number(s(form.get("link_validity_days")) || 14);
  const fields = {
    company_legal_name: s(form.get("company_legal_name")),
    company_address: s(form.get("company_address")),
    registration_number: s(form.get("registration_number")),
    company_email: s(form.get("company_email")),
    support_email: s(form.get("support_email")),
    whatsapp_number: s(form.get("whatsapp_number")).slice(0, 30),
    website_url: s(form.get("website_url")),
    governing_law: s(form.get("governing_law")),
    refund_days: refundDays ? Number(refundDays) : null,
    cancellation_tiers: tiers.length ? tiers : DEFAULT_ORGANIZER.cancellation_tiers,
    agreement_version: s(form.get("agreement_version")) || "v1.0",
    link_validity_days: validity,
    terms_text: s(form.get("terms_text")),
    privacy_text: s(form.get("privacy_text")),
  };
  if (fields.refund_days != null && !(Number.isInteger(fields.refund_days) && fields.refund_days >= 1 && fields.refund_days <= 365)) return { error: "Refund processing time must be 1–365 days." };
  if (!(Number.isInteger(validity) && validity >= 1 && validity <= 90)) return { error: "Link validity must be 1–90 days." };
  if (fields.whatsapp_number && !/^\+[1-9][0-9\s\-().]{6,20}$/.test(fields.whatsapp_number)) return { error: "Enter the WhatsApp number with its country code, e.g. +212 600 000000." };
  for (const k of ["company_email", "support_email"] as const) if (fields[k] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields[k])) return { error: `Check the ${k === "company_email" ? "company" : "support"} email address.` };
  const { org: before } = await loadSettings(db);
  const { error } = await db.from("organizer_settings").update(fields).eq("id", 1);
  if (error) return { error: error.message };
  const changed = (Object.keys(fields) as (keyof typeof fields)[]).filter((k) => JSON.stringify(fields[k]) !== JSON.stringify(before[k]));
  await logEvent(db, null, actor, "settings_changed", { section: "organizer", fields: changed });
  revalidatePath("/", "layout");
  return { ok: "Settings saved." };
}

export async function saveBankSettings(_: BookingAdminState, form: FormData): Promise<BookingAdminState> {
  const { db, actor } = await ctx();
  const fields = {
    account_holder: s(form.get("account_holder")),
    bank_name: s(form.get("bank_name")),
    iban: s(form.get("iban")).replace(/\s+/g, " "),
    swift_bic: s(form.get("swift_bic")).toUpperCase(),
    extra_instructions: s(form.get("extra_instructions")),
  };
  const { error } = await db.from("bank_settings").update(fields).eq("id", 1);
  if (error) return { error: error.message };
  await logEvent(db, null, actor, "settings_changed", { section: "bank" });
  revalidatePath("/admin/settings");
  return { ok: "Bank details saved." };
}

export async function setLiveMode(_: BookingAdminState, form: FormData): Promise<BookingAdminState> {
  const { db, actor } = await ctx();
  const turnOn = s(form.get("live")) === "on";
  if (turnOn) {
    const { org, bank } = await loadSettings(db);
    const missing = missingForLive(org, bank);
    if (missing.length) return { error: `Complete these first: ${missing.join(", ")}.` };
    if (form.get("approve") !== "on") return { error: "Tick the box to confirm you approve the final configuration." };
    await db.from("organizer_settings").update({ live_mode: true, live_approved_by: actor, live_approved_at: new Date().toISOString() }).eq("id", 1);
  } else {
    await db.from("organizer_settings").update({ live_mode: false }).eq("id", 1);
  }
  await logEvent(db, null, actor, turnOn ? "live_mode_on" : "live_mode_off", {});
  revalidatePath("/", "layout");
  return { ok: turnOn ? "Live mode is ON. New approvals are real bookings and travelers receive emails." : "Live mode is OFF. The booking system is in test mode." };
}

export async function dismissLinkFlash() {
  await requireAdmin();
  (await cookies()).delete({ name: "ec_flash", path: "/admin" });
}
