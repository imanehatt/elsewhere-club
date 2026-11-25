import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Download, FileText, Landmark, MessageCircle, Plane, ShieldCheck, Sparkles } from "lucide-react";
import { AgreementView } from "@/components/booking/AgreementView";
import { BookingSteps } from "@/components/booking/BookingSteps";
import { CopyButton } from "@/components/booking/CopyButton";
import { ProofUpload } from "@/components/booking/ProofUpload";
import { SignForm } from "@/components/booking/SignForm";
import { buildAgreement, goingHeadline } from "@/lib/booking/agreement";
import { getOrganizerSettings, whatsappDigits } from "@/lib/booking/settings";
import { getBookingByToken, getBookingExtras, getDb, getTripForBooking, logEvent } from "@/lib/booking/server";
import { partyFromBooking } from "@/lib/booking/party";
import type { Booking, BookingPayment, OrganizerSettings } from "@/lib/booking/types";
import { formatDate, formatDateRange, formatPrice, stripEmoji } from "@/lib/utils";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your booking", robots: { index: false, follow: false } };

const money = (b: Booking, n: number | null) => formatPrice(n, b.currency ?? "EUR");

function Shell({ step, test, children }: { step: number; test: boolean; children: React.ReactNode }) {
  return (
    <section className="bg-ivory pb-24 pt-32 sm:pt-40">
      <div className="container-lux max-w-4xl">
        {test && (
          <div role="note" className="mb-6 flex gap-3 rounded-2xl border border-terracotta/40 bg-terracotta/10 p-4 text-sm text-terracotta-dark">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p><strong>Test mode — this is not a real booking.</strong> Do not send any money. Live bookings start once The Elsewhere Club approves the final configuration.</p>
          </div>
        )}
        {step >= 0 && <div className="mb-10"><BookingSteps current={step} /></div>}
        {children}
      </div>
    </section>
  );
}

function Message({ title, children, icon: Icon = Clock }: { title: string; children: React.ReactNode; icon?: typeof Clock }) {
  return (
    <div className="mx-auto max-w-xl rounded-[24px] bg-white p-8 text-center ring-1 ring-olive/5 sm:p-12">
      <Icon className="mx-auto h-10 w-10 text-terracotta" strokeWidth={1.25} />
      <h1 className="mt-4 display-md">{title}</h1>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-olive-soft">{children}</div>
    </div>
  );
}

const contactEmail = (org: OrganizerSettings) => org.support_email || org.company_email || site.contactEmail;

function Summary({ b, rows, wide = false }: { b: Booking; rows: [string, string][]; wide?: boolean }) {
  return (
    <div className="rounded-[22px] bg-white p-6 ring-1 ring-olive/5 sm:p-8">
      <p className="eyebrow mb-1">{b.reference}</p>
      <h2 className="font-serif text-2xl text-olive sm:text-3xl">{stripEmoji(b.trip_title)}</h2>
      <p className="mt-1 text-sm text-olive-soft">{b.trip_start ? formatDateRange(b.trip_start, b.trip_end) : "Dates to be confirmed"}</p>
      <dl className={`mt-6 grid gap-x-8 gap-y-3 text-sm ${wide ? "sm:grid-cols-2" : ""}`}>
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-olive/10 pb-2">
            <dt className="text-olive/60">{k}</dt>
            <dd className="text-right font-medium text-olive">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function WhatsAppCard({ b, org, kind }: { b: Booking; org: OrganizerSettings; kind: "deposit" | "balance" }) {
  const digits = whatsappDigits(org.whatsapp_number);
  const amount = money(b, kind === "deposit" ? b.deposit_amount : b.balance_amount);
  const due = kind === "deposit" ? b.deposit_deadline : b.balance_deadline;
  const text = `Hi The Elsewhere Club! I'm ${b.full_name}. I've signed my booking agreement for ${stripEmoji(b.trip_title)} (booking reference ${b.reference}). Could you please send me the bank details for my ${kind === "deposit" ? "first payment (deposit)" : "second payment"} of ${amount}? Thank you!`;
  const href = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null;
  return (
    <div className="rounded-[22px] bg-olive p-6 text-ivory sm:p-8">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-champagne"><MessageCircle className="h-4 w-4" /> Get the bank details</p>
      <h2 className="mt-4 font-serif text-2xl leading-snug text-ivory sm:text-3xl">Message us on WhatsApp</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-ivory/80">
        Send us a message and we&rsquo;ll reply personally with the bank details for your {kind === "deposit" ? "first payment" : "second payment"}. Your message is already written for you.
      </p>
      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between gap-4 border-b border-ivory/10 pb-2"><dt className="text-ivory/60">Amount</dt><dd className="font-serif text-2xl">{amount}</dd></div>
        <div className="flex justify-between gap-4 border-b border-ivory/10 pb-2"><dt className="text-ivory/60">Due by</dt><dd className="font-medium">{due ? formatDate(due) : "To be confirmed"}</dd></div>
        <div className="border-b border-ivory/10 pb-2"><dt className="text-ivory/60">Your payment reference</dt><dd className="mt-1 flex items-center justify-between gap-3 font-medium tracking-wide"><span className="whitespace-nowrap">{b.reference}</span><CopyButton value={b.reference ?? ""} label="payment reference" dark /></dd></div>
      </dl>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#0b3d1f] transition hover:brightness-95">
          <MessageCircle className="h-5 w-5" /> Message us on WhatsApp
        </a>
      ) : (
        <p className="mt-6 rounded-2xl bg-ivory/10 p-4 text-sm text-ivory/80">Our WhatsApp number will appear here shortly. In the meantime, write to us at <a className="underline" href={`mailto:${contactEmail(org)}`}>{contactEmail(org)}</a>.</p>
      )}
      {digits && <p className="mt-3 text-center text-sm text-ivory/60">or add us: <span className="text-ivory">{org.whatsapp_number}</span></p>}
      <p className="mt-5 text-sm text-ivory/70">Please include your reference <strong className="text-ivory">{b.reference}</strong> in the transfer. For your safety, only use bank details sent to you by The Elsewhere Club on WhatsApp.</p>
    </div>
  );
}

function ProofStatus({ p, kind }: { p?: BookingPayment; kind: "deposit" | "balance" }) {
  if (!p) return null;
  if (p.status === "under_review")
    return (
      <div className="flex gap-3 rounded-2xl bg-champagne-light p-4 text-sm text-olive">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
        <p><strong>We&rsquo;re checking your transfer.</strong> We received {p.proof_name ? <em>{p.proof_name}</em> : "your proof"}{p.proof_uploaded_at ? ` on ${formatDate(new Date(p.proof_uploaded_at).toISOString().slice(0, 10))}` : ""}. Uploading proof doesn&rsquo;t confirm your {kind === "deposit" ? "booking" : "payment"} automatically — we&rsquo;ll email you once the funds have arrived in our official account. Uploaded the wrong file? You can replace it below.</p>
      </div>
    );
  if (p.status === "rejected")
    return (
      <div className="flex gap-3 rounded-2xl bg-terracotta/10 p-4 text-sm text-terracotta-dark">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p><strong>We couldn&rsquo;t match your last upload to a payment.</strong> {p.review_note ?? "Please check the details and upload a new proof of payment."}</p>
      </div>
    );
  return null;
}

function Downloads({ token, agreement, receipts }: { token: string; agreement: boolean; receipts: BookingPayment[] }) {
  const items = [
    ...(agreement ? [{ href: `/booking/${token}/pdf`, label: "Signed booking agreement (PDF)" }] : []),
    ...receipts.map((r) => ({ href: `/booking/${token}/receipt/${r.kind}`, label: `${r.kind === "deposit" ? "Deposit" : "Balance"} receipt ${r.receipt_number ?? ""} (PDF)` })),
  ];
  if (!items.length) return null;
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.href}>
          <a href={i.href} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-olive ring-1 ring-olive/5 transition hover:bg-sand">
            <Download className="h-4 w-4 text-terracotta" />{i.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default async function BookingPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ uploaded?: string }> }) {
  const { token } = await params;
  const { uploaded } = await searchParams;
  const look = await getBookingByToken(token);
  const org = await getOrganizerSettings();

  if (look.state === "unavailable")
    return <Shell step={-1} test={false}><Message title="Bookings aren't connected yet">Online booking pages need the database to be connected (see README). Please contact us at {contactEmail(org)}.</Message></Shell>;
  if (look.state === "invalid")
    return <Shell step={-1} test={false}><Message title="This link isn't valid" icon={AlertTriangle}><p>Please check that you opened the full link from your email. If it still doesn&rsquo;t work, write to us at <a className="underline" href={`mailto:${contactEmail(org)}`}>{contactEmail(org)}</a>.</p></Message></Shell>;
  if (look.state === "expired")
    return <Shell step={-1} test={false}><Message title="This link has expired" icon={Clock}><p>For your security, booking links expire after a while. Reply to your last email from us or write to <a className="underline" href={`mailto:${contactEmail(org)}`}>{contactEmail(org)}</a> and we&rsquo;ll send you a new link.</p></Message></Shell>;

  const b = look.booking;
  const db = getDb()!;
  const test = !org.live_mode || b.is_test;
  const first = b.full_name.split(" ")[0];
  const { agreement, payments } = await getBookingExtras(db, b.id);
  const latest = (kind: "deposit" | "balance") => [...payments].reverse().find((p) => p.kind === kind);
  const verified = (kind: "deposit" | "balance") => payments.find((p) => p.kind === kind && p.status === "verified");

  /* ---------------- Cancelled ---------------- */
  if (b.status === "cancelled")
    return (
      <Shell step={-1} test={test}>
        <Message title={b.declined ? "Thank you for your request" : "This booking has been cancelled"} icon={AlertTriangle}>
          <p>{b.declined ? `Unfortunately we weren’t able to offer you a spot on ${stripEmoji(b.trip_title)}.` : `Booking ${b.reference ?? ""} for ${stripEmoji(b.trip_title)} is cancelled.`}</p>
          <p>Questions? Write to <a className="underline" href={`mailto:${contactEmail(org)}`}>{contactEmail(org)}</a>.</p>
        </Message>
      </Shell>
    );

  /* ---------------- Not yet approved ---------------- */
  if (b.status === "inquiry_received")
    return <Shell step={1} test={test}><Message title="We're reviewing your request">We&rsquo;ll email you as soon as it&rsquo;s been reviewed.</Message></Shell>;

  /* ---------------- Step 3: review & sign ---------------- */
  if (b.status === "approved" || b.status === "agreement_pending") {
    if (!b.agreement_viewed_at) {
      await db.from("bookings").update({ agreement_viewed_at: new Date().toISOString() }).eq("id", b.id).is("agreement_viewed_at", null);
      await logEvent(db, b.id, "traveler", "agreement_viewed", {});
    }
    const trip = await getTripForBooking(db, b.trip_id);
    const today = new Date().toISOString().slice(0, 10);
    const doc = buildAgreement({ party: partyFromBooking(b), org, trip, agreementDate: today });
    const blocked = !test && doc.missing.length ? "This agreement is still missing some details, so it can’t be signed yet. Please contact us." : undefined;
    return (
      <Shell step={2} test={test}>
        <div className="mb-8">
          <p className="eyebrow mb-3">Review &amp; sign</p>
          <h1 className="display-lg">Hi {first}, here&rsquo;s your booking agreement.</h1>
          <p className="lead mt-4 max-w-2xl">Please read it carefully — it sets out your booking details, payment schedule and booking conditions. Payment details appear once you&rsquo;ve signed.</p>
        </div>
        <Summary
          b={b}
          rows={[
            ["Traveler", b.full_name],
            ["Travelers", String(b.travelers)],
            ["Total trip price", money(b, b.total_amount)],
            ["First payment (deposit)", money(b, b.deposit_amount)],
            ["Due by", b.deposit_deadline ? formatDate(b.deposit_deadline) : "To be confirmed"],
            ["Second payment", money(b, b.balance_amount)],
            ["Due by ", b.balance_deadline ? formatDate(b.balance_deadline) : "To be confirmed"],
          ]}
        />
        {test && doc.missing.length > 0 && (
          <p className="mt-6 rounded-2xl bg-champagne-light p-4 text-sm text-olive">
            <strong>Test mode:</strong> {doc.missing.length} highlighted detail{doc.missing.length === 1 ? " is" : "s are"} not filled in yet ({doc.missing.join(", ")}). Add them in Admin → Settings before going live.
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl text-olive">Your agreement</h2>
          <a href={`/booking/${token}/pdf`} className="inline-flex items-center gap-2 rounded-full border border-olive/15 bg-white px-4 py-2 text-sm text-olive hover:bg-sand"><FileText className="h-4 w-4" /> Download draft (PDF)</a>
        </div>
        <AgreementView doc={doc} className="mt-4" />
        {trip && (trip.included.length > 0 || trip.excluded.length > 0) && (
          <details className="mt-6 rounded-[22px] bg-white p-6 ring-1 ring-olive/5 sm:p-8">
            <summary className="cursor-pointer font-serif text-xl text-olive">What&rsquo;s included and not included</summary>
            <div className="mt-5 grid gap-6 text-sm text-olive-soft sm:grid-cols-2">
              <div><p className="mb-2 font-medium text-olive">Included</p><ul className="list-disc space-y-1 pl-5 marker:text-terracotta">{trip.included.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><p className="mb-2 font-medium text-olive">Not included</p><ul className="list-disc space-y-1 pl-5 marker:text-terracotta">{trip.excluded.map((x) => <li key={x}>{x}</li>)}</ul>{trip.excluded_note && <p className="mt-3">{trip.excluded_note}</p>}</div>
            </div>
          </details>
        )}
        <div className="mt-10">
          <SignForm token={token} fullName={b.full_name} today={formatDate(today)} disabled={blocked} />
        </div>
      </Shell>
    );
  }

  /* ---------------- Step 4: Secure Your Spot ---------------- */
  if (b.status === "agreement_signed" || b.status === "awaiting_payment" || b.status === "payment_under_review") {
    const dep = latest("deposit");
    return (
      <Shell step={3} test={test}>
        <div className="mb-8">
          <p className="eyebrow mb-3">Agreement signed{agreement ? ` · ${formatDate(new Date(agreement.signed_at).toISOString().slice(0, 10))}` : ""}</p>
          <h1 className="display-lg">Secure Your Spot</h1>
          <p className="lead mt-4 max-w-2xl">Thank you for signing, {first}. To secure your spot, message us on WhatsApp — we&rsquo;ll send you the bank details for your first payment. Once you&rsquo;ve paid, upload your proof of payment here (or send it to us on WhatsApp).</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
          <div className="space-y-6">
            <Summary
              b={b}
              rows={[
                ["Total trip price", money(b, b.total_amount)],
                ["First payment (deposit) due", money(b, b.deposit_amount)],
                ["Due by", b.deposit_deadline ? formatDate(b.deposit_deadline) : "To be confirmed"],
                ["Second payment", money(b, b.balance_amount)],
                ["Due by ", b.balance_deadline ? formatDate(b.balance_deadline) : "To be confirmed"],
              ]}
            />
            <Downloads token={token} agreement={Boolean(agreement)} receipts={[]} />
          </div>
          <div className="space-y-5">
            <>
                <WhatsAppCard b={b} org={org} kind="deposit" />
                {uploaded === "deposit" && dep?.status === "under_review" && <p role="status" className="flex gap-2 rounded-2xl bg-sage-light p-4 text-sm text-olive"><CheckCircle2 className="h-4 w-4 shrink-0" />Thank you — your proof of payment has been uploaded.</p>}
                <ProofStatus p={dep} kind="deposit" />
                <div className="rounded-[22px] bg-sand p-6">
                  <h2 className="font-serif text-xl text-olive">Already paid? Upload your proof</h2>
                  <p className="mb-4 mt-1 text-sm text-olive-soft">Uploading proof does not automatically confirm your booking. We&rsquo;ll confirm once the funds have arrived in our official account.</p>
                  <ProofUpload token={token} kind="deposit" label={dep?.status === "under_review" ? "Replace proof of payment" : "Upload proof of payment"} />
                </div>
            </>
          </div>
        </div>
      </Shell>
    );
  }

  /* ---------------- Step 6: Confirmation ---------------- */
  const depPaid = verified("deposit");
  const balPaid = verified("balance");
  const bal = latest("balance");
  const balanceDue = !balPaid && (b.balance_amount ?? 0) > 0;
  return (
    <Shell step={5} test={test}>
      <div className="relative overflow-hidden rounded-[28px] bg-olive px-6 py-14 text-center text-ivory sm:px-12 sm:py-20">
        <Sparkles className="mx-auto h-9 w-9 text-champagne" strokeWidth={1.25} />
        <h1 className="mt-5 font-serif text-4xl leading-tight text-ivory sm:text-6xl">{goingHeadline(b.trip_slug)}</h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-ivory/80">Welcome to The Elsewhere Club. Your next adventure starts here.</p>
        <p className="mt-8 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full bg-ivory/10 px-6 py-3 text-sm">
          <span>Booking reference <strong className="ml-1 tracking-wider text-champagne">{b.reference}</strong></span>
          <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-champagne" />{b.trip_start ? formatDateRange(b.trip_start, b.trip_end) : "Dates to be confirmed"}</span>
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Summary
            b={b}
            rows={[
              ["Total package price", money(b, b.total_amount)],
              ["Deposit received", depPaid ? money(b, depPaid.received_amount ?? depPaid.expected_amount) : "—"],
              ["Remaining balance", balPaid ? "Paid ✓" : money(b, b.balance_amount)],
              ["Balance due", balPaid ? (balPaid.received_on ? `Received ${formatDate(balPaid.received_on)}` : "Received") : b.balance_deadline ? formatDate(b.balance_deadline) : "To be confirmed"],
            ]}
          />
          <Downloads token={token} agreement={Boolean(agreement)} receipts={payments.filter((p) => p.status === "verified")} />
        </div>
        <div className="rounded-[22px] bg-white p-6 ring-1 ring-olive/5 sm:p-8">
          <h2 className="font-serif text-2xl text-olive">Next steps</h2>
          <ul className="mt-5 space-y-4 text-[15px] text-olive-soft">
            {balanceDue && (
              <li className="flex gap-3"><Landmark className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" strokeWidth={1.5} /><span><strong className="text-olive">Make your second payment</strong> of {money(b, b.balance_amount)}{b.balance_deadline ? ` by ${formatDate(b.balance_deadline)}` : ""} — message us on WhatsApp for the bank details, then upload your proof below.</span></li>
            )}
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" strokeWidth={1.5} /><span><strong className="text-olive">Check your travel documents</strong> — a valid passport and any Indonesian visa or entry authorization you need.</span></li>
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" strokeWidth={1.5} /><span><strong className="text-olive">Arrange travel insurance</strong> — we strongly advise cover for medical treatment, evacuation, cancellation and adventure activities.</span></li>
            <li className="flex gap-3"><Plane className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" strokeWidth={1.5} /><span><strong className="text-olive">Book your flights</strong> — or <Link href="/flights" className="underline underline-offset-2">ask us for a flight quote</Link>.</span></li>
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" strokeWidth={1.5} /><span><strong className="text-olive">Keep an eye on your inbox</strong> — we&rsquo;ll be in touch with travel information before the trip.</span></li>
          </ul>
        </div>
      </div>

      {balanceDue && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <WhatsAppCard b={b} org={org} kind="balance" />
          <div className="space-y-4">
            {uploaded === "balance" && bal?.status === "under_review" && <p role="status" className="flex gap-2 rounded-2xl bg-sage-light p-4 text-sm text-olive"><CheckCircle2 className="h-4 w-4 shrink-0" />Thank you — your proof of payment has been uploaded.</p>}
            <ProofStatus p={bal} kind="balance" />
            <div className="rounded-[22px] bg-sand p-6">
              <h2 className="font-serif text-xl text-olive">Upload second payment proof</h2>
              <p className="mb-4 mt-1 text-sm text-olive-soft">Uploading proof does not automatically mark your balance as paid. We&rsquo;ll confirm once the funds have arrived.</p>
              <ProofUpload token={token} kind="balance" label={bal?.status === "under_review" ? "Replace proof of payment" : "Upload proof of payment"} />
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
