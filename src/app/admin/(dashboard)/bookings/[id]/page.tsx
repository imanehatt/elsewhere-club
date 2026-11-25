import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, FileText } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { fmtDateTime } from "@/components/admin/AdminHeader";
import { ActionForm, LinkFlash } from "@/components/admin/ActionForm";
import { BookingBadge, ModeBadge } from "@/components/admin/BookingBadge";
import { Submit } from "@/components/admin/ui";
import {
  approveBooking,
  cancelBooking,
  rejectPayment,
  resendConfirmation,
  saveBookingNotes,
  sendAgreementLink,
  updateDeadlines,
  verifyPayment,
} from "@/app/admin/booking-actions";
import { hasAgreementTemplate } from "@/lib/booking/agreement";
import { PAYMENT_KIND_LABEL } from "@/lib/booking/constants";
import { normalizeBooking, normalizePayment, suggestReference } from "@/lib/booking/server";
import type { BookingAgreementRow, BookingEvent } from "@/lib/booking/types";
import { normalizeTrip } from "@/lib/trips";
import type { Trip } from "@/lib/types";
import { ageOn } from "@/lib/validation";
import { formatDate, formatPrice, stripEmoji } from "@/lib/utils";

export const dynamic = "force-dynamic";

const EVENT_LABEL: Record<string, string> = {
  request_submitted: "Request submitted",
  duplicate_request: "Submitted the form again (no duplicate created)",
  approved: "Approved",
  link_created: "Secure link created",
  deadlines_changed: "Deadlines changed",
  agreement_viewed: "Traveler opened the agreement",
  agreement_signed: "Agreement signed",
  payment_instructions_shown: "Bank transfer details shown",
  proof_uploaded: "Proof of payment uploaded",
  proof_replaced: "Proof of payment replaced",
  proof_rejected: "Proof not matched",
  payment_verified: "Funds confirmed in official account",
  booking_confirmed: "Booking confirmed",
  confirmation_resent: "Confirmation re-sent",
  email_sent: "Email sent",
  email_not_sent: "Email not sent",
  declined: "Request declined",
  cancelled: "Booking cancelled",
};

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-white p-6 ring-1 ring-olive/5 ${className}`}>
      <h2 className="mb-4 text-xl">{title}</h2>
      {children}
    </section>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-3 border-b border-olive/5 py-2 text-sm last:border-0">
      <dt className="text-olive/55">{k}</dt>
      <dd className="min-w-0 text-olive [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

const input = "field py-2 text-sm";

export default async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const b = normalizeBooking(data);
  const [{ data: ag }, { data: pays }, { data: evs }, { data: org }, { data: tripRow }] = await Promise.all([
    supabase.from("booking_agreements").select("*").eq("booking_id", id).maybeSingle(),
    supabase.from("booking_payments").select("*").eq("booking_id", id).order("created_at"),
    supabase.from("booking_events").select("*").eq("booking_id", id).order("at", { ascending: false }),
    supabase.from("organizer_settings").select("live_mode").eq("id", 1).maybeSingle(),
    b.trip_id ? supabase.from("trips").select("*").eq("id", b.trip_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const agreement = ag as BookingAgreementRow | null;
  const payments = (pays ?? []).map(normalizePayment);
  const events = (evs ?? []) as BookingEvent[];
  const trip = tripRow ? normalizeTrip(tripRow as Trip) : null;
  const cur = b.currency ?? trip?.currency ?? "EUR";
  const money = (n: number | null) => formatPrice(n, cur);
  const live = Boolean(org?.live_mode) && !b.is_test;
  const age = b.trip_start ? ageOn(b.date_of_birth, b.trip_start) : null;
  const suggested = b.status === "inquiry_received" ? await suggestReference(supabase, b) : "";
  const verifiedKinds = new Set(payments.filter((p) => p.status === "verified").map((p) => p.kind));
  const pendingKinds = new Set(payments.filter((p) => p.status === "under_review").map((p) => p.kind));
  const canRecord = (kind: "deposit" | "balance") =>
    !verifiedKinds.has(kind) && !pendingKinds.has(kind) && (kind === "deposit" ? ["agreement_signed", "awaiting_payment", "payment_under_review"].includes(b.status) : b.status === "confirmed");
  const todayIso = new Date().toISOString().slice(0, 10);
  let flash: { id: string; link?: string; message: string } | null = null;
  try {
    const f = JSON.parse((await cookies()).get("ec_flash")?.value ?? "null");
    if (f?.id === b.id) flash = f;
  } catch {}

  return (
    <>
      <Link href="/admin/bookings" className="mb-6 inline-flex items-center gap-2 text-sm text-olive-soft hover:text-olive"><ArrowLeft className="h-4 w-4" /> All bookings</Link>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-terracotta">{stripEmoji(b.trip_title)}</p>
          <h1 className="text-3xl sm:text-4xl">{b.full_name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-olive-soft">
            <BookingBadge status={b.status} declined={b.declined} />
            {b.reference && <span className="font-medium tracking-wide text-olive">{b.reference}</span>}
            <span>· requested {fmtDateTime(b.created_at)}</span>
          </p>
        </div>
        <ModeBadge live={live} />
      </div>

      {flash && <LinkFlash link={flash.link} message={flash.message} />}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <Card title="Traveler">
            <dl>
              <Row k="Full legal name">{b.full_name}</Row>
              <Row k="Email"><a className="underline" href={`mailto:${b.email}`}>{b.email}</a></Row>
              <Row k="Phone"><a className="underline" href={`tel:${b.phone.replace(/[^\d+]/g, "")}`}>{b.phone}</a> · <a className="text-terracotta underline" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${b.phone.replace(/\D/g, "")}`}>WhatsApp</a></Row>
              <Row k="Country of residence">{b.country}</Row>
              <Row k="Nationality">{b.nationality}</Row>
              <Row k="Date of birth">{formatDate(b.date_of_birth)}{age != null && <span className={age < 18 ? "ml-2 font-semibold text-terracotta-dark" : "ml-2 text-olive/55"}>({age} on the first day of the trip)</span>}</Row>
              <Row k="Travelers">{b.travelers}</Row>
              <Row k="Flights">{b.wants_flight_quote ? <Link className="underline" href="/admin/flights">Wants a flight quote →</Link> : "Arranging own flights"}</Row>
              {b.special_requests && <Row k="Special requests"><span className="whitespace-pre-line">{b.special_requests}</span></Row>}
            </dl>
          </Card>

          {b.total_amount != null && (
            <Card title="Price & deadlines">
              <dl>
                <Row k="Price per person">{money(b.price_per_person)}</Row>
                <Row k="Total package price">{money(b.total_amount)}</Row>
                <Row k="Deposit">{money(b.deposit_amount)}</Row>
                <Row k="Remaining balance">{money(b.balance_amount)}</Row>
                <Row k="Deposit deadline">{b.deposit_deadline ? formatDate(b.deposit_deadline) : "—"}</Row>
                <Row k="Balance deadline">{b.balance_deadline ? formatDate(b.balance_deadline) : "To be confirmed"}</Row>
              </dl>
              {(b.status === "approved" || b.status === "agreement_pending") && (
                <ActionForm showOk={false} action={updateDeadlines} className="mt-4 grid gap-3 rounded-xl bg-sand/50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <input type="hidden" name="id" value={b.id} />
                  <label className="text-xs text-olive/60">Deposit deadline<input type="date" name="deposit_deadline" defaultValue={b.deposit_deadline ?? ""} className={input} /></label>
                  <label className="text-xs text-olive/60">Balance deadline<input type="date" name="balance_deadline" defaultValue={b.balance_deadline ?? ""} className={input} /></label>
                  <Submit variant="ghost">Update</Submit>
                </ActionForm>
              )}
            </Card>
          )}

          <Card title="Booking agreement">
            {agreement ? (
              <>
                <dl>
                  <Row k="Signed">{fmtDateTime(agreement.signed_at)}</Row>
                  <Row k="Signed by (typed)">{agreement.signer_name}</Row>
                  <Row k="Agreement version">{agreement.version}</Row>
                  <Row k="IP address">{agreement.ip ?? "—"}</Row>
                  <Row k="Browser"><span className="text-xs">{agreement.user_agent ?? "—"}</span></Row>
                  <Row k="Document fingerprint"><code className="text-[11px]">{agreement.content_hash}</code></Row>
                  <Row k="Signature">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={agreement.signature_png} alt={`Signature of ${agreement.signer_name}`} className="h-20 rounded-lg bg-sand/40 p-1" />
                  </Row>
                </dl>
                <a href={`/admin/bookings/${b.id}/agreement`} className="mt-4 inline-flex items-center gap-2 rounded-full border border-olive/15 px-4 py-2 text-sm text-olive hover:bg-sand"><Download className="h-4 w-4" /> Signed agreement (PDF)</a>
              </>
            ) : (
              <>
                <p className="text-sm text-olive-soft">
                  {b.status === "inquiry_received" ? "Not sent yet — approve the request first." : b.status === "cancelled" ? "Not signed." : `Waiting for the traveler to sign.${b.agreement_viewed_at ? ` They opened it on ${fmtDateTime(b.agreement_viewed_at)}.` : ""}`}
                </p>
                {b.status !== "inquiry_received" && (
                  <a href={`/admin/bookings/${b.id}/agreement`} className="mt-4 inline-flex items-center gap-2 rounded-full border border-olive/15 px-4 py-2 text-sm text-olive hover:bg-sand"><FileText className="h-4 w-4" /> Preview agreement (PDF)</a>
                )}
              </>
            )}
          </Card>

          <Card title="Payments">
            {payments.length ? (
              <ul className="space-y-4">
                {payments.map((p) => (
                  <li key={p.id} className="rounded-xl border border-olive/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-olive">{PAYMENT_KIND_LABEL[p.kind]} · expected {money(p.expected_amount)}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${p.status === "verified" ? "bg-olive text-ivory" : p.status === "rejected" ? "bg-olive/10 text-olive/60" : "bg-terracotta/15 text-terracotta-dark"}`}>
                        {p.status === "verified" ? "Received" : p.status === "rejected" ? "Not matched" : "Proof to verify"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-olive/60">
                      {p.proof_path ? <>Proof “{p.proof_name}” uploaded {p.proof_uploaded_at ? fmtDateTime(p.proof_uploaded_at) : ""} · <a className="text-terracotta underline" href={`/admin/bookings/${b.id}/proof/${p.id}`} target="_blank" rel="noopener noreferrer">View proof <ExternalLink className="inline h-3 w-3" /></a></> : "Recorded manually (no proof uploaded)"}
                    </p>
                    {p.status === "verified" && <p className="mt-1 text-xs text-olive/60">{money(p.received_amount)} received {p.received_on ? formatDate(p.received_on) : ""} · receipt {p.receipt_number} · confirmed by {p.verified_by?.replace("admin:", "")}</p>}
                    {p.status === "rejected" && p.review_note && <p className="mt-1 text-xs text-olive/60">Note: {p.review_note}</p>}
                    {p.status === "under_review" && (
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <ActionForm showOk={false} action={verifyPayment} className="space-y-2 rounded-xl bg-sage-light/50 p-3">
                          <input type="hidden" name="id" value={b.id} /><input type="hidden" name="kind" value={p.kind} />
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-olive">Confirm funds received</p>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="text-xs text-olive/60">Amount<input name="received_amount" type="number" step="0.01" min="0" defaultValue={p.expected_amount} className={input} /></label>
                            <label className="text-xs text-olive/60">Date received<input name="received_on" type="date" max={todayIso} defaultValue={todayIso} className={input} /></label>
                          </div>
                          <label className="flex items-start gap-2 text-xs text-olive"><input type="checkbox" name="confirm_funds" className="mt-0.5 accent-terracotta" />I have checked our bank account and the money has arrived in the official account.</label>
                          <Submit className="w-full">Confirm payment</Submit>
                        </ActionForm>
                        <ActionForm showOk={false} action={rejectPayment} className="space-y-2 rounded-xl bg-sand/60 p-3">
                          <input type="hidden" name="id" value={b.id} /><input type="hidden" name="payment_id" value={p.id} />
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-olive">Can&rsquo;t match it?</p>
                          <textarea name="note" rows={3} placeholder="Message to the traveler, e.g. the amount doesn't match…" className={input} />
                          <Submit variant="ghost" className="w-full">Mark as not matched</Submit>
                        </ActionForm>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-olive-soft">No payments yet.</p>}
            {(canRecord("deposit") || canRecord("balance")) && (
              <details className="mt-4 rounded-xl bg-sand/40 p-4">
                <summary className="cursor-pointer text-sm font-medium text-olive">Record a transfer received without an uploaded proof</summary>
                <ActionForm showOk={false} action={verifyPayment} className="mt-3 grid gap-2 sm:grid-cols-3">
                  <input type="hidden" name="id" value={b.id} />
                  <label className="text-xs text-olive/60">Payment<select name="kind" className={input}>{canRecord("deposit") && <option value="deposit">Deposit</option>}{canRecord("balance") && <option value="balance">Remaining balance</option>}</select></label>
                  <label className="text-xs text-olive/60">Amount<input name="received_amount" type="number" step="0.01" min="0" defaultValue={(canRecord("deposit") ? b.deposit_amount : b.balance_amount) ?? ""} className={input} /></label>
                  <label className="text-xs text-olive/60">Date received<input name="received_on" type="date" max={todayIso} defaultValue={todayIso} className={input} /></label>
                  <label className="flex items-start gap-2 text-xs text-olive sm:col-span-3"><input type="checkbox" name="confirm_funds" className="mt-0.5 accent-terracotta" />I have checked our bank account and the money has arrived in the official account.</label>
                  <Submit className="sm:col-span-3 sm:justify-self-start">Confirm payment</Submit>
                </ActionForm>
              </details>
            )}
          </Card>

          <Card title="Audit history">
            {events.length ? (
              <ol className="space-y-3 border-l border-olive/15 pl-5">
                {events.map((e) => (
                  <li key={e.id} className="relative text-sm">
                    <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-terracotta" />
                    <p className="text-olive"><strong className="font-medium">{EVENT_LABEL[e.action] ?? e.action}</strong> <span className="text-olive/55">· {e.actor.replace("admin:", "")} · {fmtDateTime(e.at)}</span></p>
                    {Object.keys(e.details ?? {}).length > 0 && (
                      <p className="mt-0.5 text-xs text-olive/55 [overflow-wrap:anywhere]">
                        {Object.entries(e.details).filter(([k]) => k !== "user_agent").map(([k, v]) => `${k.replace(/_/g, " ")}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`).join(" · ")}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            ) : <p className="text-sm text-olive-soft">No history yet.</p>}
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          {b.status === "inquiry_received" && (
            <Card title="Approve this request" className="ring-2 ring-terracotta/30">
              {!hasAgreementTemplate(b.trip_slug) ? (
                <p className="text-sm text-terracotta-dark">There&rsquo;s no booking agreement template for this trip yet.</p>
              ) : trip?.price == null || trip?.deposit_amount == null ? (
                <p className="text-sm text-terracotta-dark">Set the price and the deposit for this trip first (<Link className="underline" href={`/admin/trips/${b.trip_id}`}>edit trip</Link>).</p>
              ) : (
                <ActionForm showOk={false} action={approveBooking} className="space-y-3">
                  <input type="hidden" name="id" value={b.id} />
                  <p className="rounded-xl bg-sand/60 p-3 text-sm text-olive">
                    {b.travelers} × {formatPrice(trip.price, trip.currency)} = <strong>{formatPrice(trip.price * b.travelers, trip.currency)}</strong><br />
                    First payment {formatPrice(trip.deposit_amount * b.travelers, trip.currency)} · second payment {formatPrice((trip.price - trip.deposit_amount) * b.travelers, trip.currency)}
                  </p>
                  <label className="block text-xs text-olive/60">Booking reference<input name="reference" defaultValue={suggested} className={input} required /></label>
                  <label className="block text-xs text-olive/60">First payment (deposit) due by<input name="deposit_deadline" type="date" min={todayIso} defaultValue={trip.deposit_due_date && trip.deposit_due_date >= todayIso ? trip.deposit_due_date : ""} className={input} required /></label>
                  <label className="block text-xs text-olive/60">Second payment (balance) due by<input name="balance_deadline" type="date" defaultValue={trip.balance_due_date ?? ""} className={input} /></label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button type="submit" name="intent" value="approve_send" className="rounded-full bg-olive px-5 py-2.5 text-sm font-medium text-ivory hover:bg-ink">Approve &amp; send agreement</button>
                    <button type="submit" name="intent" value="approve" className="rounded-full border border-olive/15 px-5 py-2.5 text-sm text-olive hover:bg-sand">Approve only</button>
                  </div>
                  {!live && <p className="text-xs text-olive/55">Test mode: no email goes to the traveler — you&rsquo;ll get the link to open yourself.</p>}
                </ActionForm>
              )}
            </Card>
          )}

          {b.status !== "inquiry_received" && b.status !== "cancelled" && (
            <Card title="Traveler link">
              <dl className="mb-3">
                <Row k="Last sent">{b.link_sent_at ? fmtDateTime(b.link_sent_at) : "Not sent yet"}</Row>
                <Row k="Expires">{b.token_expires_at ? fmtDateTime(b.token_expires_at) : "—"}</Row>
              </dl>
              <ActionForm showOk={false} action={sendAgreementLink}>
                <input type="hidden" name="id" value={b.id} />
                <Submit className="w-full">{b.status === "approved" ? "Send approval email" : "Send a new link"}</Submit>
                <p className="mt-2 text-xs text-olive/55">Creates a fresh secure link (the old one stops working){live ? " and emails it to the traveler." : ". Test mode: shown here, not emailed."}</p>
              </ActionForm>
            </Card>
          )}

          {b.status === "confirmed" && (
            <Card title="Confirmation">
              <p className="mb-3 text-sm text-olive-soft">{b.confirmation_sent_at ? `Confirmation email sent ${fmtDateTime(b.confirmation_sent_at)}.` : "No confirmation email has been sent."}</p>
              <ActionForm showOk={false} action={resendConfirmation}>
                <input type="hidden" name="id" value={b.id} />
                <Submit variant="ghost" className="w-full">Send confirmation email again</Submit>
              </ActionForm>
            </Card>
          )}

          <Card title="Private notes">
            <ActionForm showOk={false} action={saveBookingNotes} className="space-y-2">
              <input type="hidden" name="id" value={b.id} />
              <textarea name="admin_notes" rows={4} defaultValue={b.admin_notes ?? ""} placeholder="Only visible to admins…" className={input} />
              <Submit variant="ghost">Save notes</Submit>
            </ActionForm>
          </Card>

          {b.status !== "cancelled" ? (
            <Card title={b.status === "inquiry_received" ? "Decline request" : "Cancel booking"}>
              <ActionForm showOk={false} action={cancelBooking} className="space-y-2" confirm={b.status === "inquiry_received" ? "Decline this request?" : "Cancel this booking? This can't be undone."}>
                <input type="hidden" name="id" value={b.id} />
                <textarea name="reason" rows={2} placeholder={b.status === "inquiry_received" ? "Optional message to the traveler" : "Reason (kept in the audit history)"} className={input} />
                {b.status === "inquiry_received" && <label className="flex items-center gap-2 text-xs text-olive"><input type="checkbox" name="notify" defaultChecked className="accent-terracotta" /> Email the traveler{live ? "" : " (live mode only)"}</label>}
                <Submit variant="danger">{b.status === "inquiry_received" ? "Decline request" : "Cancel booking"}</Submit>
              </ActionForm>
            </Card>
          ) : (
            <Card title={b.declined ? "Declined" : "Cancelled"}><p className="text-sm text-olive-soft">{b.cancelled_at ? fmtDateTime(b.cancelled_at) : ""}{b.cancel_reason ? ` — ${b.cancel_reason}` : ""}</p></Card>
          )}
        </aside>
      </div>
    </>
  );
}
