import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin";

const exports: Record<string, { table: string; columns: string[] }> = {
  bookings: { table: "bookings", columns: ["created_at", "reference", "status", "declined", "is_test", "trip_title", "full_name", "email", "phone", "country", "nationality", "date_of_birth", "travelers", "currency", "total_amount", "deposit_amount", "balance_amount", "deposit_deadline", "balance_deadline", "approved_at", "signed_at", "confirmed_at", "cancelled_at", "cancel_reason", "special_requests", "admin_notes"] },
  inquiries: { table: "trip_inquiries", columns: ["created_at", "status", "inquiry_type", "trip_title", "trip_dates", "full_name", "email", "whatsapp", "country", "travellers", "wants_flight_quote", "special_requests", "admin_notes"] },
  flights: { table: "flight_quote_requests", columns: ["created_at", "status", "source", "trip_type", "origin", "destination", "depart_date", "return_date", "adults", "children", "cabin_class", "preferred_airline", "flexible_dates", "full_name", "email", "whatsapp", "special_requests", "admin_notes"] },
  subscribers: { table: "waitlist_subscribers", columns: ["created_at", "first_name", "email", "country", "destinations", "travel_months", "instagram", "marketing_opt_in", "source"] },
  messages: { table: "contact_messages", columns: ["created_at", "handled", "name", "email", "subject", "message"] },
};

/** Escapes a value for CSV and neutralises spreadsheet formula injection. */
function cell(v: unknown) {
  let s = v == null ? "" : Array.isArray(v) ? v.join("; ") : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(_: Request, { params }: { params: Promise<{ type: string }> }) {
  const admin = await getAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  const cfg = exports[(await params).type];
  if (!cfg) return new NextResponse("Not found", { status: 404 });

  const { data, error } = await admin.supabase.from(cfg.table).select(cfg.columns.join(",")).order("created_at", { ascending: false });
  if (error) return new NextResponse(error.message, { status: 500 });

  const rows = (data as unknown as Record<string, unknown>[]).map((r) => cfg.columns.map((c) => cell(r[c])).join(","));
  const csv = "﻿" + [cfg.columns.join(","), ...rows].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="elsewhere-${(await params).type}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
