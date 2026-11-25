import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

/** Opens a proof of payment through a 60-second private link (the bucket is never public). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  const admin = await getAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  const { id, paymentId } = await params;
  const { data } = await admin.supabase.from("booking_payments").select("proof_path").eq("id", paymentId).eq("booking_id", id).maybeSingle();
  if (!data?.proof_path) return new NextResponse("Not found", { status: 404 });
  const { data: signed, error } = await admin.supabase.storage.from("payment-proofs").createSignedUrl(data.proof_path, 60);
  if (error || !signed) return new NextResponse("Could not open the file", { status: 500 });
  return NextResponse.redirect(signed.signedUrl, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
