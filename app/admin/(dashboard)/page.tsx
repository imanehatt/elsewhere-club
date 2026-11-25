import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { AdminHeader, fmtDateTime } from "@/components/admin/AdminHeader";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const count = async (table: string, filter?: [string, string]) => {
    let q = supabase.from(table).select("id", { count: "exact", head: true });
    if (filter) q = q.eq(filter[0], filter[1]);
    return (await q).count ?? 0;
  };
  const [toReview, toVerify, trips, newInq, newFlights, members, unhandled] = await Promise.all([
    count("bookings", ["status", "inquiry_received"]),
    count("booking_payments", ["status", "under_review"]),
    count("trips"),
    count("trip_inquiries", ["status", "new"]),
    count("flight_quote_requests", ["status", "new"]),
    count("waitlist_subscribers"),
    count("contact_messages", ["handled", "false"]),
  ]);
  const { data: recent } = await supabase.from("bookings").select("id, full_name, trip_title, created_at, status").order("created_at", { ascending: false }).limit(5);
  const { data: recentFlights } = await supabase.from("flight_quote_requests").select("id, full_name, origin, destination, cabin_class, created_at").order("created_at", { ascending: false }).limit(5);

  const stats = [
    { label: "Booking requests to review", value: toReview, href: "/admin/bookings?status=inquiry_received" },
    { label: "Payments to verify", value: toVerify, href: "/admin/bookings?status=payment_under_review" },
    { label: "Interest & waitlist", value: newInq, href: "/admin/inquiries" },
    { label: "New flight quotes", value: newFlights, href: "/admin/flights" },
    { label: "Waitlist & members", value: members, href: "/admin/subscribers" },
    { label: "Unread messages", value: unhandled, href: "/admin/messages" },
    { label: "Trips", value: trips, href: "/admin/trips" },
  ];

  return (
    <>
      <AdminHeader title="Welcome back" intro="Here's what's happening at The Elsewhere Club." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group rounded-2xl bg-white p-5 ring-1 ring-olive/5 transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs uppercase tracking-[0.14em] text-olive/55">{s.label}</p>
            <p className="mt-2 font-serif text-4xl text-olive">{s.value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {[
          { title: "Latest booking requests", href: "/admin/bookings", rows: (recent ?? []).map((r) => ({ id: r.id, a: r.full_name, b: r.trip_title, c: r.created_at })) },
          { title: "Latest flight requests", href: "/admin/flights", rows: (recentFlights ?? []).map((r) => ({ id: r.id, a: r.full_name, b: `${r.origin} → ${r.destination}`, c: r.created_at })) },
        ].map((block) => (
          <section key={block.title} className="rounded-2xl bg-white p-6 ring-1 ring-olive/5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl">{block.title}</h2>
              <Link href={block.href} className="flex items-center gap-1 text-xs text-terracotta">View all <ArrowUpRight className="h-3 w-3" /></Link>
            </div>
            {block.rows.length ? (
              <ul className="divide-y divide-olive/10 text-sm">
                {block.rows.map((r) => (
                  <li key={r.id} className="flex justify-between gap-3 py-3">
                    <span><strong className="font-medium text-olive">{r.a}</strong> <span className="text-olive-soft">· {r.b}</span></span>
                    <span className="shrink-0 text-xs text-olive/50">{fmtDateTime(r.c)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-olive/50">Nothing yet.</p>}
          </section>
        ))}
      </div>
    </>
  );
}
