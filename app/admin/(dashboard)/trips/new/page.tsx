import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TripForm } from "@/components/admin/TripForm";

export const dynamic = "force-dynamic";

export default async function NewTrip() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/trips" className="text-sm text-olive/60 hover:text-olive">← All trips</Link>
      <AdminHeader title="Add a trip" intro="Save the trip first — then you can upload photos." />
      <TripForm />
    </>
  );
}
