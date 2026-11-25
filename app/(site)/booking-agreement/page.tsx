import type { Metadata } from "next";
import Link from "next/link";
import { AgreementView } from "@/components/booking/AgreementView";
import { LegalPage } from "@/components/LegalPage";
import { buildAgreement } from "@/lib/booking/agreement";
import { sampleParty } from "@/lib/booking/party";
import { getOrganizerSettings } from "@/lib/booking/settings";
import { getTripBySlug } from "@/lib/trips";

export const metadata: Metadata = { title: "Booking Agreement", description: "The Travel Booking Agreement travelers review and sign before paying for a trip with The Elsewhere Club.", alternates: { canonical: "/booking-agreement" } };
export const revalidate = 60;

export default async function BookingAgreementPage() {
  const [org, trip] = await Promise.all([getOrganizerSettings(), getTripBySlug("bali-girls-escape")]);
  const doc = trip ? buildAgreement({ party: sampleParty(trip), org, trip, agreementDate: null }) : null;
  return (
    <LegalPage
      title="Booking Agreement"
      draft={false}
      document={doc ? <div className="-mx-2 sm:-mx-6"><AgreementView doc={doc} /></div> : <p className="text-olive-soft">Published with our next trip.</p>}
      intro={<p>This is the agreement you&rsquo;ll be asked to review and sign before any payment. Your personalised copy includes your details, your booking reference and your payment deadlines. The blanks are filled in for each booking.</p>}
    >
      
      <p className="mt-8 text-sm">See also: <Link href="/cancellation-policy">Cancellation &amp; Refund Policy</Link> · <Link href="/terms">Terms &amp; Conditions</Link></p>
    </LegalPage>
  );
}
