import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { deleteTrip } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { normalizeTrip } from "@/lib/trips";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ImageManager } from "@/components/admin/ImageManager";
import { TripForm } from "@/components/admin/TripForm";
import { ConfirmSubmit } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function EditTrip({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const { created } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const trip = normalizeTrip(data);

  return (
    <div className="space-y-6">
      <Link href="/admin/trips" className="text-sm text-olive/60 hover:text-olive">← All trips</Link>
      <AdminHeader
        title={trip.title}
        intro={trip.published ? "Published — visible on the website." : "Draft — not visible on the website yet. Tick “Published” and save when ready."}
        actions={trip.published ? <Link href={`/trips/${trip.slug}`} target="_blank" className="inline-flex items-center gap-2 rounded-full border border-olive/15 px-4 py-2 text-sm text-olive hover:bg-white"><ExternalLink className="h-4 w-4" />View live</Link> : undefined}
      />
      {created && <p className="rounded-xl bg-sage-light px-4 py-3 text-sm text-olive">Trip created. Now add photos below, then tick “Published” when it’s ready.</p>}

      <ImageManager tripId={trip.id} cover={trip.cover_image} gallery={trip.gallery} />

      <TripForm trip={trip} />

      <form action={deleteTrip} className="rounded-2xl border border-terracotta/20 p-6">
        <input type="hidden" name="id" value={trip.id} />
        <p className="mb-3 text-sm text-olive-soft">Removing a trip deletes it and its photos permanently. Existing inquiries are kept.</p>
        <ConfirmSubmit message={`Permanently delete “${trip.title}”?`} className="border border-terracotta/30">Remove trip</ConfirmSubmit>
      </form>
    </div>
  );
}
