import { NextResponse } from "next/server";
import { buildAgreement } from "@/lib/booking/agreement";
import { agreementPdf } from "@/lib/booking/pdf";
import { getOrganizerSettings } from "@/lib/booking/settings";
import { getBookingByToken, getBookingExtras, getDb, getTripForBooking } from "@/lib/booking/server";
import { partyFromBooking } from "@/lib/booking/party";

export const dynamic = "force-dynamic";

/** Signed agreement (exact snapshot that was signed) or, before signing, a draft copy. */
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const look = await getBookingByToken((await params).token);
  if (look.state !== "ok") return new NextResponse("This link is not valid or has expired.", { status: 404 });
  const b = look.booking;
  if (b.status === "inquiry_received" || (b.status === "cancelled" && !b.signed_at)) return new NextResponse("Not available.", { status: 404 });
  const db = getDb()!;
  const org = await getOrganizerSettings();
  const { agreement } = await getBookingExtras(db, b.id);
  const test = !org.live_mode || b.is_test;
  const bytes = agreement
    ? await agreementPdf(agreement.content, {
        reference: b.reference,
        test,
        signature: { name: agreement.signer_name, png: agreement.signature_png, signedAt: agreement.signed_at, ip: agreement.ip, hash: agreement.content_hash },
      })
    : await agreementPdf(buildAgreement({ party: partyFromBooking(b), org, trip: await getTripForBooking(db, b.trip_id), agreementDate: new Date().toISOString().slice(0, 10) }), { reference: b.reference, test });
  const name = `Elsewhere-Club-Agreement-${b.reference ?? "draft"}${agreement ? "-signed" : "-draft"}.pdf`;
  return new NextResponse(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
