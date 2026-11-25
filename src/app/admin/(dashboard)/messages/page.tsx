import { toggleMessage } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { AdminHeader, Empty, fmtDateTime } from "@/components/admin/AdminHeader";
import { ExportLink } from "@/components/admin/RequestControls";
import { Submit } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function Messages() {
  const { supabase } = await requireAdmin();
  const { data: rows } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(500);
  return (
    <>
      <AdminHeader title="Messages" intro="From the Contact page." actions={<ExportLink type="messages" />} />
      {rows?.length ? (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className={`rounded-2xl bg-white p-6 ring-1 ring-olive/5 ${r.handled ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl">{r.subject}</h2>
                <span className="text-xs text-olive/50">{fmtDateTime(r.created_at)}</span>
              </div>
              <p className="mt-1 text-sm">{r.name} · <a href={`mailto:${r.email}?subject=Re: ${encodeURIComponent(r.subject)}`} className="underline">{r.email}</a></p>
              <p className="mt-3 whitespace-pre-line text-sm text-olive-soft">{r.message}</p>
              <form action={toggleMessage} className="mt-4">
                <input type="hidden" name="id" value={r.id} /><input type="hidden" name="handled" value={String(!r.handled)} />
                <Submit variant="ghost" className="px-4 py-1.5 text-xs">{r.handled ? "Mark as unread" : "Mark as handled"}</Submit>
              </form>
            </li>
          ))}
        </ul>
      ) : <Empty>No messages yet.</Empty>}
    </>
  );
}
