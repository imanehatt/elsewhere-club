"use client";

import Image from "next/image";
import { useActionState } from "react";
import { manageImage, uploadTripImages, type AdminState } from "@/app/admin/actions";
import { Notice, Submit } from "./ui";

export function ImageManager({ tripId, cover, gallery }: { tripId: string; cover: string | null; gallery: string[] }) {
  const [state, action] = useActionState<AdminState, FormData>(uploadTripImages, {});
  const all = [cover, ...gallery].filter((x): x is string => Boolean(x));
  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-olive/5">
      <h2 className="mb-1 font-serif text-xl">Photos</h2>
      <p className="mb-5 text-sm text-olive/60">Only upload photos you own or have a licence to use. JPG, PNG, WebP or AVIF, up to 8MB each. Landscape works best.</p>
      {all.length > 0 ? (
        <ul className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {all.map((url) => (
            <li key={url} className="overflow-hidden rounded-xl ring-1 ring-olive/10">
              <div className="relative aspect-[4/3] bg-sand">
                <Image src={url} alt="" fill sizes="200px" className="object-cover" />
                {url === cover && <span className="absolute left-2 top-2 rounded-full bg-olive px-2 py-0.5 text-[10px] uppercase tracking-wider text-ivory">Cover</span>}
              </div>
              <div className="flex justify-between p-1.5">
                {url !== cover ? (
                  <form action={manageImage}>
                    <input type="hidden" name="trip_id" value={tripId} /><input type="hidden" name="url" value={url} /><input type="hidden" name="op" value="cover" />
                    <button className="rounded-full px-2 py-1 text-xs text-olive hover:bg-sand">Make cover</button>
                  </form>
                ) : <span />}
                <form action={manageImage} onSubmit={(e) => { if (!confirm("Delete this photo?")) e.preventDefault(); }}>
                  <input type="hidden" name="trip_id" value={tripId} /><input type="hidden" name="url" value={url} /><input type="hidden" name="op" value="remove" />
                  <button className="rounded-full px-2 py-1 text-xs text-terracotta-dark hover:bg-terracotta/10">Delete</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-6 rounded-xl bg-sand/60 p-4 text-sm text-olive-soft">No photos yet — the website shows labelled placeholders until you upload some.</p>
      )}
      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="hidden" name="trip_id" value={tripId} />
        <input type="file" name="images" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-sand file:px-4 file:py-2 file:text-sm file:text-olive" />
        <Submit variant="ghost">Upload</Submit>
      </form>
      <div className="mt-3"><Notice state={state} /></div>
    </div>
  );
}
