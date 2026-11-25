import type { Metadata } from "next";
import Link from "next/link";
import { AgreementView } from "@/components/booking/AgreementView";
import { LegalPage } from "@/components/LegalPage";
import { buildAgreement, type AgreementDoc } from "@/lib/booking/agreement";
import { sampleParty } from "@/lib/booking/party";
import { getOrganizerSettings } from "@/lib/booking/settings";
import { getTripBySlug } from "@/lib/trips";

export const metadata: Metadata = { title: "Cancellation & Refund Policy", description: "How cancellations and refunds work for trips with The Elsewhere Club.", alternates: { canonical: "/cancellation-policy" } };
export const revalidate = 60;

export default async function CancellationPolicyPage() {
  const [org, trip] = await Promise.all([getOrganizerSettings(), getTripBySlug("bali-girls-escape")]);
  let doc: AgreementDoc | null = null;
  if (trip) {
    const full = buildAgreement({ party: sampleParty(trip), org, trip: null, agreementDate: null });
    // Sections 4 (Changes and Cancellations) and 5 (Trip Information) of the booking agreement.
    const start = full.blocks.findIndex((b) => b.t === "h2" && b.text.startsWith("4."));
    const end = full.blocks.findIndex((b) => b.t === "h2" && b.text.startsWith("6."));
    doc = { ...full, title: "Cancellation & Refund Policy", subtitle: "Sections 4–5 of the Trip Booking Agreement", header: [], blocks: full.blocks.slice(start, end), schedules: [], missing: [] };
  }
  return (
    <LegalPage
      title="Cancellation & Refund Policy"
      draft={false}
      document={doc ? <div className="-mx-2 sm:-mx-6"><AgreementView doc={doc} /></div> : <p className="text-olive-soft">Published with our next trip.</p>}
      intro={<p>These are the cancellation terms from our <Link href="/booking-agreement">Trip Booking Agreement</Link>. They&rsquo;re also set out in full in your personalised agreement before you sign or pay.</p>}
    />
  );
}
