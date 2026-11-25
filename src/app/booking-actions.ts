"use server";

import { redirect } from "next/navigation";
import { notifyAdmin } from "@/lib/notify";
import { agreementPlainText, buildAgreement } from "@/lib/booking/agreement";
import { PROOF_MAX_BYTES, type PaymentKind } from "@/lib/booking/constants";
import { proofReceivedEmail, sendEmail } from "@/lib/booking/email";
import { getOrganizerSettings } from "@/lib/booking/settings";
import { bookingUrl, getBookingByToken, getBookingExtras, getDb, getTripForBooking, logEvent, requestFingerprint, sha256 } from "@/lib/booking/server";
import { partyFromBooking } from "@/lib/booking/party";

export type TravelerState = { error?: string; ok?: string };

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/* ------------------------------------------------------------------ */
/* Step 3 — sign the booking agreement                                 */
/* ------------------------------------------------------------------ */
export async function signAgreement(token: string, _: TravelerState, form: FormData): Promise<TravelerState> {
  const look = await getBookingByToken(token);
  if (look.state === "expired") return { error: "This link has expired. Please contact us for a new one." };
  if (look.state !== "ok") return { error: "This link isn't valid." };
  const db = getDb()!;
  const b = look.booking;
  if (!["approved", "agreement_pending"].includes(b.status)) redirect(`/booking/${token}`);

  if (form.get("agree") !== "on") return { error: "Please confirm that you have read and agree to the booking agreement." };
  const typed = String(form.get("signer_name") ?? "");
  if (norm(typed) !== norm(b.full_name)) return { error: `Please type your full legal name exactly as it appears in the agreement: ${b.full_name}` };
  const signature = String(form.get("signature") ?? "");
  if (!signature.startsWith("data:image/png;base64,") || signature.length < 1200 || signature.length > 390_000)
    return { error: "Please draw your signature in the box." };

  const org = await getOrganizerSettings();
  const test = !org.live_mode || b.is_test;
  const trip = await getTripForBooking(db, b.trip_id);
  const today = new Date().toISOString().slice(0, 10);
  const doc = buildAgreement({ party: partyFromBooking(b), org, trip, agreementDate: today });
  if (!test && doc.missing.length) return { error: "This agreement is missing some details, so it can't be signed yet. We've been notified — please contact us." };

  const hash = sha256(agreementPlainText(doc));
  const { ip, userAgent } = await requestFingerprint();
  const signedAt = new Date().toISOString();
  const { error } = await db.from("booking_agreements").insert({
    booking_id: b.id,
    version: doc.version,
    content_hash: hash,
    content: doc,
    signer_name: typed.trim(),
    signature_png: signature,
    agreed: true,
    signed_at: signedAt,
    ip,
    user_agent: userAgent,
  });
  if (error) {
    if (error.code === "23505") redirect(`/booking/${token}`); // already signed — never sign twice
    console.error("[sign]", error);
    return { error: "We couldn't save your signature. Please try again." };
  }

  const nextStatus = "awaiting_payment";
  await db.from("bookings").update({ status: nextStatus, signed_at: signedAt }).eq("id", b.id).in("status", ["approved", "agreement_pending"]);
  await logEvent(db, b.id, "traveler", "agreement_signed", { version: doc.version, hash, ip, user_agent: userAgent, signer_name: typed.trim(), test });
  await logEvent(db, b.id, "system", "payment_instructions_shown", { via: "whatsapp" });
  await notifyAdmin(`Agreement signed: ${b.reference}`, { Traveler: b.full_name, Trip: b.trip_title, Next: "She will message you on WhatsApp for the bank details." });
  redirect(`/booking/${token}`);
}

/* ------------------------------------------------------------------ */
/* Step 4 — upload proof of payment (deposit or remaining balance)    */
/* ------------------------------------------------------------------ */
function sniff(bytes: Uint8Array): { mime: string; ext: string } | null {
  const h = (n: number) => bytes[n];
  if (h(0) === 0x25 && h(1) === 0x50 && h(2) === 0x44 && h(3) === 0x46) return { mime: "application/pdf", ext: "pdf" };
  if (h(0) === 0xff && h(1) === 0xd8 && h(2) === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (h(0) === 0x89 && h(1) === 0x50 && h(2) === 0x4e && h(3) === 0x47) return { mime: "image/png", ext: "png" };
  const ascii = (a: number, b: number) => String.fromCharCode(...bytes.slice(a, b));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (ascii(4, 8) === "ftyp" && /hei|mif|heic|heix/.test(ascii(8, 12))) return { mime: "image/heic", ext: "heic" };
  return null;
}

export async function uploadProof(token: string, kind: PaymentKind, _: TravelerState, form: FormData): Promise<TravelerState> {
  const look = await getBookingByToken(token);
  if (look.state === "expired") return { error: "This link has expired. Please contact us for a new one." };
  if (look.state !== "ok") return { error: "This link isn't valid." };
  const db = getDb()!;
  const b = look.booking;
  const { payments } = await getBookingExtras(db, b.id);
  const verified = payments.find((p) => p.kind === kind && p.status === "verified");
  if (verified) return { error: "This payment has already been received — there's nothing more to upload." };

  const allowed = kind === "deposit" ? ["agreement_signed", "awaiting_payment", "payment_under_review"].includes(b.status) : b.status === "confirmed";
  if (!allowed) return { error: "Payment proof can't be uploaded at this stage." };
  if (payments.filter((p) => p.kind === kind).length >= 10) return { error: "Too many uploads for this payment. Please email us your proof instead." };

  const file = form.get("proof");
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose your proof of payment (PDF, JPG, PNG, WEBP or HEIC)." };
  if (file.size > PROOF_MAX_BYTES) return { error: "That file is larger than 4 MB. Please upload a smaller screenshot or PDF." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type) return { error: "Please upload a PDF or an image (JPG, PNG, WEBP or HEIC)." };

  const path = `${b.id}/${kind}-${Date.now()}.${type.ext}`;
  const { error: upErr } = await db.storage.from("payment-proofs").upload(path, bytes, { contentType: type.mime, upsert: false });
  if (upErr) {
    console.error("[proof upload]", upErr);
    return { error: "We couldn't upload your file. Please try again." };
  }
  const proofName = file.name.slice(0, 200) || `proof.${type.ext}`;
  const now = new Date().toISOString();
  const pending = payments.find((p) => p.kind === kind && p.status === "under_review");
  const expected = kind === "deposit" ? b.deposit_amount : b.balance_amount;
  const { error: rowErr } = pending
    ? await db.from("booking_payments").update({ proof_path: path, proof_name: proofName, proof_uploaded_at: now }).eq("id", pending.id).eq("status", "under_review")
    : await db.from("booking_payments").insert({ booking_id: b.id, kind, expected_amount: expected ?? 0, proof_path: path, proof_name: proofName, proof_uploaded_at: now });
  if (rowErr) {
    console.error("[proof row]", rowErr);
    return { error: "We couldn't save your upload. Please try again." };
  }
  if (kind === "deposit") await db.from("bookings").update({ status: "payment_under_review" }).eq("id", b.id).in("status", ["agreement_signed", "awaiting_payment", "payment_under_review"]);
  await logEvent(db, b.id, "traveler", pending ? "proof_replaced" : "proof_uploaded", { kind, file: proofName, size: file.size, type: type.mime });

  const org = await getOrganizerSettings();
  if (org.live_mode && !b.is_test) {
    const m = proofReceivedEmail(b, kind, bookingUrl(token), org);
    const r = await sendEmail({ to: b.email, ...m, replyTo: org.support_email || undefined });
    if (r.sent) await logEvent(db, b.id, "system", "email_sent", { template: "proof_received" });
  }
  await notifyAdmin(`Proof of payment uploaded: ${b.reference}`, { Traveler: b.full_name, Payment: kind, Amount: expected, Next: "Check your bank account, then confirm the funds in Admin → Bookings." });
  redirect(`/booking/${token}?uploaded=${kind}`);
}
