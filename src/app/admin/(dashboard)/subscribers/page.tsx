import { deleteSubscriber } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { AdminHeader, Empty, fmtDateTime } from "@/components/admin/AdminHeader";
import { ExportLink } from "@/components/admin/RequestControls";
import { ConfirmSubmit } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function Subscribers() {
  const { supabase } = await requireAdmin();
  const { data: rows, count } = await supabase.from("waitlist_subscribers").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(1000);
  return (
    <>
      <AdminHeader title="Waitlist & club members" intro={`${count ?? 0} people have joined. Only email those who opted in to announcements.`} actions={<ExportLink type="subscribers" />} />
      {rows?.length ? (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-olive/5">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-olive/10 text-xs uppercase tracking-[0.12em] text-olive/55">
              <tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Country</th><th className="p-4">Interests</th><th className="p-4">Opt-in</th><th className="p-4">Joined</th><th className="p-4" /></tr>
            </thead>
            <tbody className="divide-y divide-olive/10">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="p-4 font-medium text-olive">{r.first_name}{r.instagram && <span className="block text-xs font-normal text-olive/50">@{r.instagram}</span>}</td>
                  <td className="p-4">{r.email}</td>
                  <td className="p-4">{r.country ?? "—"}</td>
                  <td className="p-4 text-xs text-olive-soft">
                    {(r.destinations ?? []).join(", ") || "—"}
                    {r.travel_months?.length ? <span className="block text-olive/50">{r.travel_months.join(", ")}</span> : null}
                  </td>
                  <td className="p-4">{r.marketing_opt_in ? "Yes" : "No"}</td>
                  <td className="p-4 text-xs text-olive/50">{fmtDateTime(r.created_at)}<span className="block">{r.source}</span></td>
                  <td className="p-4">
                    <form action={deleteSubscriber}><input type="hidden" name="id" value={r.id} /><ConfirmSubmit message={`Remove ${r.email}?`}>Remove</ConfirmSubmit></form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty>No members yet.</Empty>}
    </>
  );
}
