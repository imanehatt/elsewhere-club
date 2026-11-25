import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { AdminHeader, Empty, fmtDateTime } from "@/components/admin/AdminHeader";
import { BookingBadge, ModeBadge } from "@/components/admin/BookingBadge";
import { ExportLink } from "@/components/admin/RequestControls";
import { BOOKING_STATUSES, STATUS_LABEL, type BookingStatus } from "@/lib/booking/constants";
import { normalizeBooking, normalizePayment } from "@/lib/booking/server";
import { formatPrice, stripEmoji } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Bookings({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: rows }, { data: pays }, { data: org }] = await Promise.all([
    supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(1000),
    supabase.from("booking_payments").select("booking_id, kind, status"),
    supabase.from("organizer_settings").select("live_mode").eq("id", 1).maybeSingle(),
  ]);
  const all = (rows ?? []).map(normalizeBooking);
  const payments = (pays ?? []).map((p) => normalizePayment({ ...p, expected_amount: 0 }));
  const counts = Object.fromEntries(BOOKING_STATUSES.map((s) => [s, all.filter((b) => b.status === s).length])) as Record<BookingStatus, number>;
  const needle = (q ?? "").trim().toLowerCase();
  const list = all.filter((b) => (!status || b.status === status) && (!needle || [b.full_name, b.email, b.reference ?? ""].some((x) => x.toLowerCase().includes(needle))));
  const payState = (id: string, kind: "deposit" | "balance") => {
    const ps = payments.filter((p) => p.booking_id === id && p.kind === kind);
    if (ps.some((p) => p.status === "verified")) return "Received";
    if (ps.some((p) => p.status === "under_review")) return "To verify";
    return "—";
  };

  return (
    <>
      <AdminHeader
        title="Bookings"
        intro="Every Request Your Spot submission. Approve a request to send the traveler their personalised agreement; confirm payments only once the money is in the official account."
        actions={<><ModeBadge live={Boolean(org?.live_mode)} /><ExportLink type="bookings" /></>}
      />
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <a href="?" className={`rounded-full px-3 py-1.5 ${!status ? "bg-olive text-ivory" : "bg-white text-olive ring-1 ring-olive/10"}`}>All ({all.length})</a>
        {BOOKING_STATUSES.map((s) => (
          <a key={s} href={`?status=${s}`} className={`rounded-full px-3 py-1.5 ${status === s ? "bg-olive text-ivory" : "bg-white text-olive ring-1 ring-olive/10"}`}>
            {STATUS_LABEL[s]} ({counts[s]})
          </a>
        ))}
        <form className="ml-auto">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Search name, email or reference" aria-label="Search bookings" className="rounded-full border border-olive/15 bg-white px-4 py-1.5 text-sm" />
        </form>
      </div>
      {list.length ? (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-olive/5">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-olive/10 text-xs uppercase tracking-[0.1em] text-olive/55">
              <tr><th className="px-5 py-3 font-medium">Traveler</th><th className="px-5 py-3 font-medium">Trip</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Deposit</th><th className="px-5 py-3 font-medium">Balance</th><th className="px-5 py-3 font-medium">Received</th></tr>
            </thead>
            <tbody className="divide-y divide-olive/10">
              {list.map((b) => (
                <tr key={b.id} className="hover:bg-sand/40">
                  <td className="px-5 py-4">
                    <Link href={`/admin/bookings/${b.id}`} className="font-medium text-olive underline-offset-2 hover:underline">{b.full_name}</Link>
                    <p className="text-xs text-olive/55">{b.reference ?? "No reference yet"} · {b.travelers} traveler{b.travelers > 1 ? "s" : ""}{b.is_test ? " · TEST" : ""}</p>
                  </td>
                  <td className="px-5 py-4 text-olive-soft">{stripEmoji(b.trip_title)}{b.total_amount != null && <p className="text-xs text-olive/55">{formatPrice(b.total_amount, b.currency ?? "EUR")}</p>}</td>
                  <td className="px-5 py-4"><BookingBadge status={b.status} declined={b.declined} /></td>
                  <td className="px-5 py-4 text-olive-soft">{payState(b.id, "deposit")}</td>
                  <td className="px-5 py-4 text-olive-soft">{payState(b.id, "balance")}</td>
                  <td className="px-5 py-4 text-xs text-olive/55">{fmtDateTime(b.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty>No bookings {status ? `with status “${STATUS_LABEL[status as BookingStatus] ?? status}”` : needle ? "match your search" : "yet"}.</Empty>}
    </>
  );
}
