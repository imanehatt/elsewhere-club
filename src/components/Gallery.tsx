"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Photo, type PlaceholderTone } from "./Photo";
import { cn } from "@/lib/utils";

const placeholderTones: PlaceholderTone[] = ["dusk", "sage", "ocean", "terracotta", "olive"];
const placeholderLabels = ["Villa pool at golden hour", "Rice terraces, Ubud", "Beach at sunset", "Group dinner", "Jungle waterfall"];

/** Editorial mosaic + full-screen lightbox. Shows labelled placeholders until photos are uploaded. */
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const hasImages = images.length > 0;
  const tiles = hasImages ? images.slice(0, 5) : placeholderLabels;

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") setIndex((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, images.length]);

  return (
    <>
      <div className="grid h-[48svh] min-h-[320px] max-h-[500px] grid-cols-2 gap-2 overflow-hidden rounded-[18px] sm:grid-cols-4 sm:grid-rows-2 sm:gap-2.5">
        {tiles.map((t, i) => (
          <button
            key={i}
            type="button"
            disabled={!hasImages}
            onClick={() => setIndex(i)}
            aria-label={hasImages ? `Open photo ${i + 1} of ${images.length}` : undefined}
            className={cn(
              "group relative overflow-hidden",
              i === 0 ? "col-span-2 row-span-1 sm:row-span-2" : i > 2 ? "hidden sm:block" : "",
              tiles.length === 4 && i === 3 && "sm:col-span-2",
              hasImages ? "cursor-zoom-in" : "cursor-default",
            )}
          >
            <Photo
              src={hasImages ? t : null}
              alt={`${title} photo ${i + 1}`}
              label={hasImages ? undefined : t}
              tone={placeholderTones[i % placeholderTones.length]}
              priority={i === 0}
              sizes={i === 0 ? "(min-width:640px) 50vw, 100vw" : "25vw"}
              className="h-full w-full transition-transform duration-[1.4s] ease-[var(--ease-lux)] group-hover:scale-105"
            />
            {hasImages && i === 4 && images.length > 5 && (
              <span className="absolute inset-0 flex items-center justify-center bg-ink/45 text-sm font-medium text-ivory">+{images.length - 5} photos</span>
            )}
          </button>
        ))}
      </div>

      {index !== null && hasImages && (
        <div role="dialog" aria-modal="true" aria-label={`${title} gallery`} className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/95 p-4">
          <button type="button" onClick={() => setIndex(null)} aria-label="Close gallery" className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-ivory/10 text-ivory">
            <X className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => setIndex((index - 1 + images.length) % images.length)} aria-label="Previous photo" className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-ivory/10 text-ivory sm:left-6">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="relative h-[80svh] w-full max-w-5xl">
            <Image src={images[index]} alt={`${title} photo ${index + 1}`} fill sizes="90vw" className="object-contain" />
          </div>
          <button type="button" onClick={() => setIndex((index + 1) % images.length)} aria-label="Next photo" className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-ivory/10 text-ivory sm:right-6">
            <ChevronRight className="h-5 w-5" />
          </button>
          <p className="absolute bottom-6 text-xs tracking-[0.2em] text-ivory/60">{index + 1} / {images.length}</p>
        </div>
      )}
    </>
  );
}
