import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin";
import { buildAgreement } from "@/lib/booking/agreement";
import { agreementPdf } from "@/lib/booking/pdf";
import { partyFromBooking } from "@/lib/booking/party";
import { getTripForBooking, normalizeBooking } from "@/lib/booking/server";
import { DEFAULT_ORGANIZER } from "@/lib/booking/settings";
import type { BookingAgreementRow, OrganizerSettings } from "@/lib/booking/types";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  const db = admin.supabase;
  const { id } = await params;
  const { data } = await db.from("bookings").select("*").eq("id", id).maybeSingle();
  if (!data) return new NextResponse("Not found", { status: 404 });
  const b = normalizeBooking(data);
  const [{ data: ag }, { data: o }] = await Promise.all([
    db.from("booking_agreements").select("*").eq("booking_id", id).maybeSingle(),
    db.from("organizer_settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  const org: OrganizerSettings = { ...DEFAULT_ORGANIZER, ...(o ?? {}) };
  const a = ag as BookingAgreementRow | null;
  const test = !org.live_mode || b.is_test;
  const bytes = a
    ? await agreementPdf(a.content, { reference: b.reference, test, signature: { name: a.signer_name, png: a.signature_png, signedAt: a.signed_at, ip: a.ip, hash: a.content_hash } })
    : await agreementPdf(buildAgreement({ party: partyFromBooking(b), org, trip: await getTripForBooking(db, b.trip_id), agreementDate: new Date().toISOString().slice(0, 10) }), { reference: b.reference, test });
  return new NextResponse(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="Agreement-${b.reference ?? b.id}.pdf"`, "Cache-Control": "no-store" },
  });
}
