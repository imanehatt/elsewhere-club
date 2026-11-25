import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social sharing preview (WhatsApp, Instagram DMs, iMessage, etc.). */
export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(160deg,#343B31 0%,#4a5246 55%,#B65F42 140%)", color: "#F8F7F2" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 20, letterSpacing: 10, color: "#E7D6B0" }}>THE</div>
          <div style={{ fontSize: 44, fontFamily: "serif" }}>Elsewhere Club</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontFamily: "serif", lineHeight: 1.02 }}>Go Places.</div>
          <div style={{ fontSize: 96, fontFamily: "serif", lineHeight: 1.02, fontStyle: "italic", color: "#E7D6B0" }}>Find Your People.</div>
          <div style={{ fontSize: 26, marginTop: 28, opacity: 0.8 }}>Curated small-group escapes · Bali & beyond</div>
        </div>
      </div>
    ),
    size,
  );
}
