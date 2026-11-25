import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, PlainLegalText } from "@/components/LegalPage";
import { getOrganizerSettings } from "@/lib/booking/settings";
import { DEFAULT_CONTACT_EMAIL } from "@/lib/booking/agreement";

export const metadata: Metadata = { title: "Terms & Conditions", description: "Terms for using The Elsewhere Club website and requesting a spot on our trips.", alternates: { canonical: "/terms" } };
export const revalidate = 60;

const ph = (v: string, p: string) => v || p;

export default async function TermsPage() {
  const org = await getOrganizerSettings();
  if (org.terms_text) return <LegalPage title="Terms & Conditions" draft={false}><PlainLegalText text={org.terms_text} /></LegalPage>;
  return (
    <LegalPage title="Terms & Conditions" updated="[DATE]">
      <h2>1. About these terms</h2>
      <p>These terms apply to your use of The Elsewhere Club website. Each trip booking is governed by the <Link href="/booking-agreement">Travel Booking Agreement</Link> you review and sign for that trip.</p>
      <h2>2. Who we are</h2>
      <p>The Elsewhere Club is a trading name of {ph(org.company_legal_name, "[REGISTERED COMPANY NAME]")}, {ph(org.company_address, "[ADDRESS]")}, registration / travel license number {ph(org.registration_number, "[NUMBER]")}. Email: {ph(org.company_email, "[EMAIL]")}.</p>
      <h2>3. Requests are not bookings</h2>
      <p>Submitting a request does not guarantee a confirmed booking, and no payment is required to submit one. If your request is approved, you review and sign the Trip Booking Agreement. Your booking is confirmed once the required deposit has been received and The Elsewhere Club has sent you a written confirmation. Any outstanding balance must be paid by the stated deadline.</p>
      <h2>4. Prices and payments</h2>
      <ul>
        <li>Trip prices are per person. International flights are not included and are quoted separately.</li>
        <li>The payment schedule (first payment / deposit and second payment, with their due dates) is set out in your personalised booking agreement before you pay.</li>
        <li>Payments are made by bank transfer, using the bank details The Elsewhere Club sends you on WhatsApp after you sign. Uploading a proof of payment does not confirm a booking or payment automatically — we confirm once the funds have arrived in our official account, and we provide a receipt for each payment received.</li>
      </ul>
      <h2>5. Cancellations</h2>
      <p>See our <Link href="/cancellation-policy">Cancellation &amp; Refund Policy</Link>. The full schedule for your trip is set out in your booking agreement before you sign or pay.</p>
      <h2>6. Flight quotations</h2>
      <p>Flight quotes are provided for information only. Fares and availability are not guaranteed until tickets are issued.</p>
      <h2>7. Travel documents and insurance</h2>
      <p>You are responsible for holding valid travel documents, including a valid passport and any required visa or entry authorization. We strongly advise suitable travel insurance.</p>
      <h2>8. Governing law</h2>
      <p>{ph(org.governing_law, "[APPLICABLE JURISDICTION]")}, subject to mandatory consumer protections that may apply.</p>
      <h2>9. Contact</h2>
      <p>{org.support_email || org.company_email || DEFAULT_CONTACT_EMAIL}</p>
    </LegalPage>
  );
}
