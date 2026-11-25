import "server-only";
import { formatDate, formatDateRange, formatPrice, stripEmoji } from "../utils";
import type { Booking, BookingPayment, OrganizerSettings } from "./types";
import { goingHeadline } from "./agreement";

export type SendResult = { sent: true } | { sent: false; reason: string };

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.NOTIFICATION_FROM_EMAIL);

/** Sends an email through Resend. Returns why it wasn't sent instead of throwing. */
export async function sendEmail(msg: { to: string; subject: string; html: string; replyTo?: string; attachments?: { filename: string; content: Uint8Array }[] }): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  if (!key || !from) return { sent: false, reason: "Email isn't set up yet (RESEND_API_KEY / NOTIFICATION_FROM_EMAIL)." };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
        ...(msg.attachments?.length ? { attachments: msg.attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString("base64") })) } : {}),
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[email] Resend error", res.status, text);
      return { sent: false, reason: `The email service returned an error (${res.status}).` };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] failed", e);
    return { sent: false, reason: "The email service couldn't be reached." };
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const money = (b: Booking, n: number | null) => formatPrice(n, b.currency ?? "EUR");

function layout(title: string, body: string, org: OrganizerSettings) {
  const contact = org.support_email || org.company_email;
  return `<!doctype html><html><body style="margin:0;background:#f8f7f2;padding:32px 12px;font-family:Helvetica,Arial,sans-serif;color:#23271f">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:18px;padding:36px 32px" cellspacing="0" cellpadding="0"><tr><td>
<p style="margin:0 0 4px;font-family:Georgia,serif;font-size:13px;letter-spacing:3px;color:#343b31">THE ELSEWHERE CLUB</p>
<p style="margin:0 0 28px;font-family:Georgia,serif;font-style:italic;font-size:13px;color:#b65f42">Go Places. Find Your People.</p>
<h1 style="margin:0 0 18px;font-family:Georgia,serif;font-weight:normal;font-size:28px;line-height:1.2;color:#343b31">${title}</h1>
<div style="font-size:15px;line-height:1.65;color:#4a5246">${body}</div>
<p style="margin:32px 0 0;font-size:12px;color:#8a8f84">${contact ? `Questions? Reply to this email or write to ${esc(contact)}.` : "Questions? Simply reply to this email."}</p>
</td></tr></table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:26px 0"><a href="${esc(href)}" style="display:inline-block;background:#343b31;color:#f8f7f2;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:14px;letter-spacing:1px;text-transform:uppercase">${esc(label)}</a></p>`;

const rows = (pairs: [string, string][]) =>
  `<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin:18px 0;border-collapse:collapse;font-size:14px">${pairs
    .map(([k, v]) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#8a8f84">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#343b31">${esc(v)}</td></tr>`)
    .join("")}</table>`;

const first = (b: Booking) => esc(b.full_name.split(" ")[0]);
const trip = (b: Booking) => `${esc(stripEmoji(b.trip_title))}${b.trip_start ? ` (${formatDateRange(b.trip_start, b.trip_end)})` : ""}`;

export function approvalEmail(b: Booking, url: string, org: OrganizerSettings) {
  return {
    subject: `Your spot on ${stripEmoji(b.trip_title)} — please review your booking agreement`,
    html: layout(
      "Your request has been approved",
      `<p>Hi ${first(b)},</p><p>Great news — your request for <strong>${trip(b)}</strong> has been approved.</p>
<p>The next step is to review and sign your personalised Trip Booking Agreement. It sets out your booking details, payment schedule and booking conditions.</p>
${rows([["Booking reference", b.reference ?? ""], ["Total trip price", money(b, b.total_amount)], ["First payment (deposit)", money(b, b.deposit_amount)], ["Due by", b.deposit_deadline ? formatDate(b.deposit_deadline) : "To be confirmed"], ["Second payment", money(b, b.balance_amount)], ["Due by ", b.balance_deadline ? formatDate(b.balance_deadline) : "To be confirmed"]])}
${button(url, "Review my agreement")}
<p style="font-size:13px;color:#8a8f84">This secure link is personal to you and expires on ${b.token_expires_at ? formatDate(new Date(b.token_expires_at).toISOString().slice(0, 10)) : "a set date"}. Please don't forward it. Your spot is confirmed only after you sign the agreement, your payment has cleared and we send you written confirmation.</p>`,
      org,
    ),
  };
}

export function declinedEmail(b: Booking, org: OrganizerSettings, message: string | null) {
  return {
    subject: `About your request for ${stripEmoji(b.trip_title)}`,
    html: layout(
      "Thank you for your request",
      `<p>Hi ${first(b)},</p><p>Thank you so much for your interest in <strong>${trip(b)}</strong>. Unfortunately we're not able to offer you a spot on this trip.</p>${message ? `<p>${esc(message)}</p>` : ""}<p>No payment has been taken. We'd love to travel with you on a future escape.</p>`,
      org,
    ),
  };
}

export function proofReceivedEmail(b: Booking, kind: BookingPayment["kind"], url: string, org: OrganizerSettings) {
  return {
    subject: `We've received your proof of payment — ${b.reference}`,
    html: layout(
      "Thank you — we're checking your transfer",
      `<p>Hi ${first(b)},</p><p>We've received your proof of payment for the <strong>${kind === "deposit" ? "deposit" : "remaining balance"}</strong> of booking <strong>${esc(b.reference ?? "")}</strong>.</p>
<p>Uploading proof doesn't confirm your booking automatically. Once the funds have arrived in our official account, we'll email you your ${kind === "deposit" ? "booking confirmation and receipt" : "receipt"}.</p>${button(url, "View my booking")}`,
      org,
    ),
  };
}

export function paymentRejectedEmail(b: Booking, url: string, note: string | null, org: OrganizerSettings) {
  return {
    subject: `Action needed: your payment for ${b.reference}`,
    html: layout(
      "We couldn't match your payment yet",
      `<p>Hi ${first(b)},</p><p>We couldn't confirm the payment for booking <strong>${esc(b.reference ?? "")}</strong> from the proof you uploaded.</p>${note ? `<p style="background:#f4ebdd;border-radius:12px;padding:14px 16px">${esc(note)}</p>` : ""}<p>Please check the details and upload a new proof of payment, or reply to this email if you have questions.</p>${button(url, "Open my booking")}`,
      org,
    ),
  };
}

export function confirmationEmail(b: Booking, url: string, deposit: BookingPayment, org: OrganizerSettings) {
  return {
    subject: `${goingHeadline(b.trip_slug)} Booking ${b.reference} confirmed`,
    html: layout(
      goingHeadline(b.trip_slug),
      `<p>Hi ${first(b)},</p><p><strong>Welcome to The Elsewhere Club. Your next adventure starts here.</strong></p>
<p>We've received your deposit and your booking for <strong>${trip(b)}</strong> is confirmed.</p>
${rows([
  ["Booking reference", b.reference ?? ""],
  ["Deposit received", money(b, deposit.received_amount ?? deposit.expected_amount)],
  ["Receipt number", deposit.receipt_number ?? ""],
  ["Second payment", money(b, b.balance_amount)],
  ["Second payment due by", b.balance_deadline ? formatDate(b.balance_deadline) : "To be confirmed"],
])}
<p>Your signed booking agreement and your receipt are attached to this email. You can also download them any time from your booking page.</p>${button(url, "View my booking")}`,
      org,
    ),
  };
}

export function balanceReceiptEmail(b: Booking, url: string, p: BookingPayment, org: OrganizerSettings) {
  return {
    subject: `Payment received — ${b.reference} is fully paid`,
    html: layout(
      "Your balance is paid",
      `<p>Hi ${first(b)},</p><p>We've received your remaining balance for <strong>${trip(b)}</strong>. Thank you!</p>${rows([["Booking reference", b.reference ?? ""], ["Amount received", money(b, p.received_amount ?? p.expected_amount)], ["Receipt number", p.receipt_number ?? ""]])}<p>Your receipt is attached.</p>${button(url, "View my booking")}`,
      org,
    ),
  };
}
