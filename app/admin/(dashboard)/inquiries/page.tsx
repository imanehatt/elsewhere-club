import { requireAdmin } from "@/lib/admin";
import { AdminHeader, Empty, fmtDateTime } from "@/components/admin/AdminHeader";
import { ExportLink, RequestControls } from "@/components/admin/RequestControls";

export const dynamic = "force-dynamic";
const STATUSES = ["new", "contacted", "offer_sent", "confirmed", "declined", "cancelled"];

export default async function Inquiries({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const { supabase } = await requireAdmin();
  let q = supabase.from("trip_inquiries").select("*").order("created_at", { ascending: false }).limit(500);
  if (status && STATUSES.includes(status)) q = q.eq("status", status);
  const { data: rows } = await q;

  return (
    <>
      <AdminHeader title="Booking inquiries" intro="Requests to book, interest registrations and waitlist sign-ups for trips. None are confirmed reservations — reply to each customer personally." actions={<ExportLink type="inquiries" />} />
      <nav className="mb-6 flex flex-wrap gap-2 text-xs">
        {["", ...STATUSES].map((s) => (
          <a key={s} href={s ? `?status=${s}` : "?"} className={`rounded-full px-3 py-1.5 ${status === s || (!status && !s) ? "bg-olive text-ivory" : "bg-white text-olive ring-1 ring-olive/10"}`}>{s ? s.replace("_", " ") : "All"}</a>
        ))}
      </nav>
      {rows?.length ? (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="grid gap-5 rounded-2xl bg-white p-6 ring-1 ring-olive/5 lg:grid-cols-[1fr_280px]">
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h2 className="text-xl">{r.full_name}</h2>
                  <span className="text-sm text-terracotta">{r.trip_title}{r.trip_dates ? ` · ${r.trip_dates}` : ""}</span>
                  <span className="rounded-full bg-sand px-2.5 py-0.5 text-[11px] text-olive">{r.inquiry_type}</span>
                  <span className="text-xs text-olive/50">{fmtDateTime(r.created_at)}</span>
                </div>
                <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                  <div><dt className="inline text-olive/50">Email: </dt><dd className="inline"><a href={`mailto:${r.email}`} className="underline">{r.email}</a></dd></div>
                  <div><dt className="inline text-olive/50">WhatsApp: </dt><dd className="inline"><a href={`https://wa.me/${String(r.whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="underline">{r.whatsapp}</a></dd></div>
                  <div><dt className="inline text-olive/50">Country: </dt><dd className="inline">{r.country}</dd></div>
                  <div><dt className="inline text-olive/50">Travellers: </dt><dd className="inline">{r.travellers}</dd></div>
                  <div><dt className="inline text-olive/50">Flights: </dt><dd className="inline">{r.wants_flight_quote ? "Wants a quote (see Flight quotes)" : "Arranging own flights"}</dd></div>
                </dl>
                {r.special_requests && <p className="mt-3 rounded-xl bg-sand/50 p-3 text-sm text-olive-soft">{r.special_requests}</p>}
              </div>
              <RequestControls kind="inquiries" id={r.id} status={r.status} notes={r.admin_notes} statuses={STATUSES} />
            </li>
          ))}
        </ul>
      ) : <Empty>No inquiries {status ? `with status “${status}”` : "yet"}.</Empty>}
    </>
  );
}
