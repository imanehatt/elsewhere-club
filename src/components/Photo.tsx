import Image from "next/image";
import { cn } from "@/lib/utils";

export type PlaceholderTone = "olive" | "sage" | "terracotta" | "dusk" | "sand" | "ocean";

const tones: Record<PlaceholderTone, { bg: string; sun: string; hill: string; hill2: string; text: string }> = {
  olive: { bg: "linear-gradient(180deg,#5d6650 0%,#343b31 70%)", sun: "#e7d6b0", hill: "#2a3027", hill2: "#3f473a", text: "text-ivory" },
  sage: { bg: "linear-gradient(180deg,#d7dbcb 0%,#a6ae94 75%)", sun: "#f8f7f2", hill: "#7f8870", hill2: "#949c84", text: "text-olive" },
  terracotta: { bg: "linear-gradient(180deg,#e9b48f 0%,#b65f42 80%)", sun: "#f8e2c4", hill: "#7f3f2b", hill2: "#9a4d34", text: "text-ivory" },
  dusk: { bg: "linear-gradient(180deg,#f3c9a4 0%,#c8806a 45%,#5a4a52 100%)", sun: "#fbe6c8", hill: "#3a3036", hill2: "#4d3f47", text: "text-ivory" },
  sand: { bg: "linear-gradient(180deg,#f8f7f2 0%,#eadcc5 80%)", sun: "#e7d6b0", hill: "#cdb894", hill2: "#ddcaa8", text: "text-olive" },
  ocean: { bg: "linear-gradient(180deg,#cfe0dc 0%,#7fa3a0 55%,#3f5f63 100%)", sun: "#f8f7f2", hill: "#2f474a", hill2: "#476769", text: "text-ivory" },
};

interface PhotoProps {
  src?: string | null;
  alt: string;
  /** Shown on the placeholder so it's obvious which photo to add. */
  label?: string;
  tone?: PlaceholderTone;
  className?: string;
  priority?: boolean;
  sizes?: string;
  showLabel?: boolean;
}

/**
 * Renders a real photo when `src` is set, otherwise an on-brand illustrated
 * placeholder clearly marked "Placeholder" so it's never mistaken for real imagery.
 */
export function Photo({ src, alt, label, tone = "sage", className, priority, sizes = "100vw", showLabel = true }: PhotoProps) {
  // Callers may position the photo absolutely (e.g. hero backgrounds); otherwise make it a positioning context.
  const position = /\b(absolute|fixed)\b/.test(className ?? "") ? "" : "relative";
  if (src) {
    return (
      <div className={cn(position, "overflow-hidden bg-sand", className)}>
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
      </div>
    );
  }
  const t = tones[tone];
  return (
    <div className={cn("grain overflow-hidden", position, className)} style={{ background: t.bg }} role="img" aria-label={`Placeholder image: ${label ?? alt}`}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden>
        <circle cx="280" cy="120" r="42" fill={t.sun} opacity="0.85" />
        <path d="M0 210 C 70 170, 130 185, 200 200 S 330 160, 400 190 L400 300 L0 300Z" fill={t.hill2} />
        <path d="M0 240 C 90 215, 160 235, 240 230 S 360 215, 400 225 L400 300 L0 300Z" fill={t.hill} />
        {/* palms */}
        <g stroke={t.hill} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.9">
          <path d="M70 245 C 74 215, 78 195, 86 170" />
          <path d="M86 170 c -14 -4 -26 2 -34 12 M86 170 c -6 -12 -18 -18 -30 -16 M86 170 c 6 -12 18 -16 30 -12 M86 170 c 14 0 24 8 28 18 M86 170 c 0 -12 6 -22 14 -28" />
          <path d="M108 248 C 110 228, 112 212, 118 196" />
          <path d="M118 196 c -10 -3 -20 1 -26 9 M118 196 c -4 -9 -13 -13 -22 -12 M118 196 c 5 -9 13 -12 22 -9 M118 196 c 10 0 18 6 21 13" />
        </g>
      </svg>
      {showLabel && (
        <span className={cn("absolute bottom-3 left-3 max-w-[85%] rounded-full bg-black/20 px-3 py-1 text-[10px] font-medium tracking-wide backdrop-blur-sm", t.text)}>
          Placeholder · {label ?? alt}
        </span>
      )}
    </div>
  );
}
