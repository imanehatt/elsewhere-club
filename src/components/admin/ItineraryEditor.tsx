"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2, X } from "lucide-react";
import type { ItineraryDay, Stay, TimelineBlock } from "@/lib/types";
import { dayLabel, nightsBetween } from "@/lib/utils";

/** Built-in photos in /public/images — trip uploads are added to the list automatically. */
const BUILT_IN = ["faq-flatlay", "our-story", "girls-terrace-sunset", "planning-sunset", "camera-sunset", "plane-sunset", "girls-jeep-sunset", "flight-departure", "uluwatu-cliff", "surf-selfcare", "ubud-terraces", "villa-dusk", "uluwatu-sunset", "villa-garden", "yoga-pool", "rafting", "surf-golden", "jimbaran-dinner", "villa-sunset", "girls-pool", "surf-lesson", "waterfall-hike", "villa-dinner", "villa", "beach", "cocktails", "palms", "girls-beach", "pool", "party", "wellness", "surf", "hero", "wing", "wing-sky", "seat", "yoga"].map((n) => `/images/${n}.jpg`);

const inp = "field py-2 text-sm";

function PhotoSelect({ value, onChange, photos, label }: { value?: string; onChange: (v: string) => void; photos: string[]; label: string }) {
  const options = Array.from(new Set([...photos, ...BUILT_IN]));
  return (
    <select aria-label={label} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={inp}>
      <option value="">No photo</option>
      {options.map((p, i) => (
        <option key={p} value={p}>{p.startsWith("/images/") ? p.replace("/images/", "Built-in: ") : `Uploaded photo ${i + 1}`}</option>
      ))}
    </select>
  );
}

/**
 * Structured day-by-day editor. Saved as JSON in a hidden field so the server
 * action can validate it. Add/remove days and activities, mark activities optional.
 */
export function ItineraryEditor({ initial, photos }: { initial: ItineraryDay[]; photos: string[] }) {
  const [days, setDays] = useState<ItineraryDay[]>(initial);
  const [open, setOpen] = useState(0);

  const setDay = (i: number, patch: Partial<ItineraryDay>) => setDays((d) => d.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setBlock = (i: number, b: number, patch: Partial<TimelineBlock>) =>
    setDays((d) => d.map((x, j) => (j === i ? { ...x, timeline: (x.timeline ?? []).map((y, k) => (k === b ? { ...y, ...patch } : y)) } : x)));
  const addDay = () =>
    setDays((d) => {
      const last = d[d.length - 1]?.date;
      let date = "";
      if (last) {
        const n = new Date(last + "T00:00:00Z");
        n.setUTCDate(n.getUTCDate() + 1);
        date = n.toISOString().slice(0, 10);
      }
      setOpen(d.length);
      return [...d, { date, title: "New day", location: "", overnight: "", summary: "", timeline: [{ time: "Morning", title: "Activity", items: [] }] }];
    });

  return (
    <div>
      <input type="hidden" name="itinerary_json" value={JSON.stringify(days)} />
      <div className="space-y-2.5">
        {days.map((d, i) => (
          <div key={i} className="rounded-xl border border-olive/10 bg-sand/30">
            <button type="button" onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-olive">
              <b>Day {i + 1}</b>
              <span className="text-olive-soft">{dayLabel(d.date)}</span>
              <span className="truncate">{d.title} {d.emoji}</span>
              <ChevronDown className={`ml-auto h-4 w-4 shrink-0 transition ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && (
              <div className="space-y-4 border-t border-olive/10 bg-white p-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <label className="text-xs text-olive/60">Date<input type="date" value={d.date ?? ""} onChange={(e) => setDay(i, { date: e.target.value })} className={inp} /></label>
                  <label className="text-xs text-olive/60">Location<input value={d.location ?? ""} onChange={(e) => setDay(i, { location: e.target.value })} placeholder="Ubud → Uluwatu" className={inp} /></label>
                  <label className="text-xs text-olive/60">Overnight<input value={d.overnight ?? ""} onChange={(e) => setDay(i, { overnight: e.target.value })} placeholder="Blank on last day" className={inp} /></label>
                  <label className="text-xs text-olive/60">Emoji<input value={d.emoji ?? ""} onChange={(e) => setDay(i, { emoji: e.target.value })} className={inp} /></label>
                  <label className="text-xs text-olive/60 sm:col-span-2">Day title<input value={d.title} onChange={(e) => setDay(i, { title: e.target.value })} className={inp} /></label>
                  <label className="text-xs text-olive/60 sm:col-span-2">Photo<PhotoSelect label={`Day ${i + 1} photo`} value={d.image} photos={photos} onChange={(v) => setDay(i, { image: v })} /></label>
                  <label className="text-xs text-olive/60 sm:col-span-4">Short description<input value={d.summary ?? ""} onChange={(e) => setDay(i, { summary: e.target.value })} className={inp} /></label>
                </div>
                <div>
                  <p className="field-label">Activities</p>
                  <ol className="space-y-2">
                    {(d.timeline ?? []).map((b, k) => (
                      <li key={k} className="grid gap-2 rounded-lg bg-sand/40 p-2.5 sm:grid-cols-[110px_1fr_2fr_auto_40px] sm:items-start">
                        <input aria-label="Time" placeholder="9:00 AM" value={b.time} onChange={(e) => setBlock(i, k, { time: e.target.value })} className={inp} />
                        <input aria-label="Activity" placeholder="Activity" value={b.title} onChange={(e) => setBlock(i, k, { title: e.target.value })} className={inp} />
                        <textarea aria-label="Details, one per line" placeholder="Details — one per line" rows={2} value={b.items.join("\n")} onChange={(e) => setBlock(i, k, { items: e.target.value.split("\n") })} className={inp} />
                        <span className="grid gap-1 pt-1">
                          <label className="flex items-center gap-2 text-xs text-olive"><input type="checkbox" checked={!!b.optional} onChange={(e) => setBlock(i, k, { optional: e.target.checked })} className="h-4 w-4 accent-terracotta" />Optional</label>
                          <label className="flex items-center gap-2 text-xs text-olive"><input type="checkbox" checked={!!b.extra_cost} onChange={(e) => setBlock(i, k, { extra_cost: e.target.checked })} className="h-4 w-4 accent-terracotta" />Extra cost</label>
                        </span>
                        <button type="button" aria-label="Remove activity" onClick={() => setDay(i, { timeline: (d.timeline ?? []).filter((_, j) => j !== k) })} className="flex h-10 w-10 items-center justify-center rounded-full text-terracotta-dark hover:bg-terracotta/10"><X className="h-4 w-4" /></button>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setDay(i, { timeline: [...(d.timeline ?? []), { time: "", title: "New activity", items: [] }] })} className="inline-flex items-center gap-1.5 rounded-full border border-olive/15 px-4 py-2 text-sm text-olive hover:bg-sand"><Plus className="h-4 w-4" />Add activity</button>
                    <button type="button" onClick={() => { setDays((x) => x.filter((_, j) => j !== i)); setOpen(-1); }} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-terracotta-dark hover:bg-terracotta/10"><Trash2 className="h-4 w-4" />Remove day</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={addDay} className="mt-4 inline-flex items-center gap-2 rounded-full bg-olive px-5 py-2.5 text-sm text-ivory hover:bg-ink"><Plus className="h-4 w-4" />Add day</button>
    </div>
  );
}

/** Areas the trip stays in — used to group the itinerary and draw the route map. */
export function StaysEditor({ initial, photos }: { initial: Stay[]; photos: string[] }) {
  const [stays, setStays] = useState<Stay[]>(initial);
  const set = (i: number, patch: Partial<Stay>) =>
    setStays((s) =>
      s.map((x, j) => {
        if (j !== i) return x;
        const n = { ...x, ...patch };
        if (n.start && n.end && n.end >= n.start) n.nights = nightsBetween(n.start, n.end);
        return n;
      }),
    );
  return (
    <div>
      <input type="hidden" name="stays_json" value={JSON.stringify(stays)} />
      <ol className="space-y-2">
        {stays.map((s, i) => (
          <li key={i} className="grid gap-2 rounded-lg bg-sand/40 p-2.5 sm:grid-cols-[1fr_1fr_1fr_70px_1.6fr_1.2fr_40px] sm:items-center">
            <input aria-label="Area" value={s.name} onChange={(e) => set(i, { name: e.target.value })} className={inp} />
            <input aria-label="Check-in" type="date" value={s.start} onChange={(e) => set(i, { start: e.target.value })} className={inp} />
            <input aria-label="Check-out" type="date" value={s.end} onChange={(e) => set(i, { end: e.target.value })} className={inp} />
            <span className="text-xs text-olive-soft">{s.nights + 1} days</span>
            <input aria-label="Summary" placeholder="Short summary" value={s.summary ?? ""} onChange={(e) => set(i, { summary: e.target.value })} className={inp} />
            <PhotoSelect label={`${s.name} photo`} value={s.image} photos={photos} onChange={(v) => set(i, { image: v })} />
            <button type="button" aria-label="Remove area" onClick={() => setStays((x) => x.filter((_, j) => j !== i))} className="flex h-10 w-10 items-center justify-center rounded-full text-terracotta-dark hover:bg-terracotta/10"><X className="h-4 w-4" /></button>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => setStays((s) => [...s, { name: "New area", start: s[s.length - 1]?.end ?? "", end: s[s.length - 1]?.end ?? "", nights: 0, summary: "", image: "" }])} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-olive/15 px-4 py-2 text-sm text-olive hover:bg-sand">
        <Plus className="h-4 w-4" />Add area
      </button>
      <p className="mt-2 text-xs text-olive/50">Ubud, Uluwatu, Canggu, Seminyak, Sanur, Nusa Dua, Jimbaran and Sidemen appear on the route map automatically.</p>
    </div>
  );
}
