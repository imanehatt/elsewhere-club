import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { AdminHeader, Empty } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateRange, formatPrice } from "@/lib/utils";
import type { TripStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminTrips() {
  const { supabase } = await requireAdmin();
  const { data: trips } = await supabase
    .from("trips")
    .select("id, title, slug, destination, country, start_date, end_date, price, currency, status, inquiry_only, published, featured")
    .order("sort_order");

  return (
    <>
      <AdminHeader
        title="Trips"
        intro="Add, edit, publish or remove trips. Unpublished trips are hidden from the website."
        actions={<Link href="/admin/trips/new" className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2.5 text-sm font-medium text-ivory hover:bg-terracotta-dark"><Plus className="h-4 w-4" />Add trip</Link>}
      />
      {trips?.length ? (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-olive/5">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-olive/10 text-xs uppercase tracking-[0.12em] text-olive/55">
              <tr><th className="p-4">Trip</th><th className="p-4">Dates</th><th className="p-4">Price</th><th className="p-4">Status</th><th className="p-4">Visibility</th></tr>
            </thead>
            <tbody className="divide-y divide-olive/10">
              {trips.map((t) => (
                <tr key={t.id} className="hover:bg-sand/40">
                  <td className="p-4">
                    <Link href={`/admin/trips/${t.id}`} className="font-medium text-olive underline-offset-2 hover:underline">{t.title}</Link>
                    <p className="text-xs text-olive/50">{t.country ? `${t.destination}, ${t.country}` : t.destination} · /trips/{t.slug}</p>
                  </td>
                  <td className="p-4">{formatDateRange(t.start_date, t.end_date)}</td>
                  <td className="p-4">{formatPrice(t.price == null ? null : Number(t.price), t.currency)}</td>
                  <td className="p-4"><StatusBadge status={t.status as TripStatus} />{t.inquiry_only && <p className="mt-1 text-xs text-olive/50">Inquiry only</p>}</td>
                  <td className="p-4 text-xs">
                    {t.published ? <span className="text-olive">● Published</span> : <span className="text-olive/40">○ Draft</span>}
                    {t.featured && <span className="ml-2 text-terracotta">★ Featured</span>}
                    
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No trips yet. Click “Add trip” to create your first one, or run supabase/seed.sql to load the starter trips.</Empty>
      )}
    </>
  );
}
