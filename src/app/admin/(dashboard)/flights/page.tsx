import { requireAdmin } from "@/lib/admin";
import { cabinLabels } from "@/lib/validation";
import { AdminHeader, Empty, fmtDateTime } from "@/components/admin/AdminHeader";
import { ExportLink, RequestControls } from "@/components/admin/RequestControls";

export const dynamic = "force-dynamic";
const STATUSES = ["new", "researching", "quoted", "booked", "closed"];

export default async function Flights({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const { supabase } = await requireAdmin();
  let q = supabase.from("flight_quote_requests").select("*, trips(title)").order("created_at", { ascending: false }).limit(500);
  if (status && STATUSES.includes(status)) q = q.eq("status", status);
  const { data: rows } = await q;

  return (
    <>
      <AdminHeader title="Flight quote requests" intro="Every flight request — from the Flights page and from trip inquiries. Never quote fares as guaranteed until ticketed." actions={<ExportLink type="flights" />} />
      <nav className="mb-6 flex flex-wrap gap-2 text-xs">
        {["", ...STATUSES].map((s) => (
          <a key={s} href={s ? `?status=${s}` : "?"} className={`rounded-full px-3 py-1.5 ${status === s || (!status && !s) ? "bg-olive text-ivory" : "bg-white text-olive ring-1 ring-olive/10"}`}>{s || "All"}</a>
        ))}
      </nav>
      {rows?.length ? (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="grid gap-5 rounded-2xl bg-white p-6 ring-1 ring-olive/5 lg:grid-cols-[1fr_280px]">
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h2 className="text-xl">{r.origin} → {r.destination}</h2>
                  <span className="text-xs text-olive/50">{fmtDateTime(r.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-terracotta">
                  {cabinLabels[r.cabin_class as keyof typeof cabinLabels]} · {r.trip_type === "round_trip" ? "Round trip" : "One way"}
                  {r.trips?.title && ` · for ${r.trips.title}`} {r.source === "trip_inquiry" && "(from trip inquiry)"}
                </p>
                <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                  <div><dt className="inline text-olive/50">Name: </dt><dd className="inline">{r.full_name}</dd></div>
                  <div><dt className="inline text-olive/50">Email: </dt><dd className="inline"><a className="underline" href={`mailto:${r.email}`}>{r.email}</a></dd></div>
                  <div><dt className="inline text-olive/50">WhatsApp: </dt><dd className="inline"><a className="underline" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${String(r.whatsapp).replace(/\D/g, "")}`}>{r.whatsapp}</a></dd></div>
                  <div><dt className="inline text-olive/50">Dates: </dt><dd className="inline">{r.depart_date ?? "To match trip dates"}{r.return_date ? ` → ${r.return_date}` : ""}{r.flexible_dates ? " (flexible)" : ""}</dd></div>
                  <div><dt className="inline text-olive/50">Passengers: </dt><dd className="inline">{r.adults} adult(s){r.children ? `, ${r.children} child(ren)` : ""}</dd></div>
                  {r.preferred_airline && <div><dt className="inline text-olive/50">Airline: </dt><dd className="inline">{r.preferred_airline}</dd></div>}
                </dl>
                {r.special_requests && <p className="mt-3 rounded-xl bg-sand/50 p-3 text-sm text-olive-soft">{r.special_requests}</p>}
              </div>
              <RequestControls kind="flights" id={r.id} status={r.status} notes={r.admin_notes} statuses={STATUSES} />
            </li>
          ))}
        </ul>
      ) : <Empty>No flight requests {status ? `with status “${status}”` : "yet"}.</Empty>}
    </>
  );
}
