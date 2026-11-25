import { NextResponse } from "next/server";
import { receiptPdf } from "@/lib/booking/pdf";
import { getOrganizerSettings } from "@/lib/booking/settings";
import { getBookingByToken, getBookingExtras, getDb } from "@/lib/booking/server";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ token: string; kind: string }> }) {
  const { token, kind } = await params;
  if (kind !== "deposit" && kind !== "balance") return new NextResponse("Not found", { status: 404 });
  const look = await getBookingByToken(token);
  if (look.state !== "ok") return new NextResponse("This link is not valid or has expired.", { status: 404 });
  const { payments } = await getBookingExtras(getDb()!, look.booking.id);
  const payment = payments.find((p) => p.kind === kind && p.status === "verified");
  if (!payment) return new NextResponse("No receipt yet.", { status: 404 });
  const org = await getOrganizerSettings();
  const bytes = await receiptPdf({ booking: look.booking, payment, org, test: !org.live_mode || look.booking.is_test });
  return new NextResponse(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="Elsewhere-Club-Receipt-${payment.receipt_number}.pdf"`, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
