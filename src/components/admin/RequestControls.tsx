import { updateRequest } from "@/app/admin/actions";
import { AutoSubmitSelect, Submit } from "./ui";

export function RequestControls({ kind, id, status, notes, statuses }: { kind: "inquiries" | "flights"; id: string; status: string; notes: string | null; statuses: string[] }) {
  return (
    <div className="space-y-3">
      <form action={updateRequest}>
        <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} />
        <AutoSubmitSelect name="status" label="Status" defaultValue={status} options={statuses.map((s) => ({ value: s, label: s.replace("_", " ") }))} />
      </form>
      <form action={updateRequest} className="space-y-2">
        <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} />
        <textarea name="admin_notes" defaultValue={notes ?? ""} rows={2} placeholder="Private notes…" aria-label="Private notes" className="field py-2 text-sm" />
        <Submit variant="ghost" className="px-4 py-1.5 text-xs">Save note</Submit>
      </form>
    </div>
  );
}

export function ExportLink({ type }: { type: string }) {
  return (
    <a href={`/admin/export/${type}`} className="inline-flex items-center gap-2 rounded-full border border-olive/15 bg-white px-5 py-2.5 text-sm text-olive hover:bg-sand">
      Export CSV
    </a>
  );
}
