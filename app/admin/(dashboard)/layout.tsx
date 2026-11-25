import Link from "next/link";
import { ExternalLink, Inbox, LayoutDashboard, LogOut, Mail, Map, Plane, Settings, Ticket, Users } from "lucide-react";
import { logout } from "../actions";
import { requireAdmin } from "@/lib/admin";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: Ticket },
  { href: "/admin/trips", label: "Trips", icon: Map },
  { href: "/admin/inquiries", label: "Interest & waitlist", icon: Inbox },
  { href: "/admin/flights", label: "Flight quotes", icon: Plane },
  { href: "/admin/subscribers", label: "Waitlist & members", icon: Users },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/settings", label: "Booking settings", icon: Settings },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="lg:flex">
      <aside className="bg-olive text-ivory lg:sticky lg:top-0 lg:h-svh lg:w-64 lg:shrink-0">
        <div className="flex items-center justify-between px-6 py-5 lg:block lg:py-8">
          <Link href="/admin" className="font-serif text-xl">Elsewhere <em>Admin</em></Link>
          <p className="hidden truncate pt-1 text-xs text-ivory/50 lg:block">{user.email}</p>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ivory/80 transition hover:bg-ivory/10 hover:text-ivory">
              <n.icon className="h-4 w-4" strokeWidth={1.5} />{n.label}
            </Link>
          ))}
          <Link href="/" target="_blank" className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ivory/60 hover:bg-ivory/10 lg:mt-6">
            <ExternalLink className="h-4 w-4" strokeWidth={1.5} />View website
          </Link>
          <form action={logout}>
            <button className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ivory/60 hover:bg-ivory/10">
              <LogOut className="h-4 w-4" strokeWidth={1.5} />Sign out
            </button>
          </form>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-12">{children}</main>
    </div>
  );
}
