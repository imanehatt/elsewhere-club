"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";

/** Draw-your-signature box (mouse, finger or stylus). Writes a PNG data URL into a hidden input. */
export function SignaturePad({ name, onChange }: { name: string; onChange?: (hasSignature: boolean) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const strokes = useRef(0);
  const [value, setValue] = useState("");

  useEffect(() => {
    const c = canvas.current!;
    const resize = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
      const ctx = c.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#23271f";
      strokes.current = 0;
      setValue("");
      onChange?.(false);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [onChange]);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    canvas.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvas.current!.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvas.current!.getContext("2d")!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    strokes.current += 1;
    const url = canvas.current!.toDataURL("image/png");
    setValue(url);
    onChange?.(true);
  };
  const clear = () => {
    const c = canvas.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    strokes.current = 0;
    setValue("");
    onChange?.(false);
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-dashed border-olive/30 bg-white">
        <canvas
          ref={canvas}
          aria-label="Signature box — draw your signature with your mouse or finger"
          role="img"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerLeave={up}
          className="block h-44 w-full cursor-crosshair touch-none"
        />
        {!value && <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-serif text-xl italic text-olive/25">Sign here</span>}
        <span className="pointer-events-none absolute bottom-8 left-6 right-6 border-b border-olive/15" />
      </div>
      <button type="button" onClick={clear} className="mt-2 inline-flex items-center gap-1.5 text-xs text-olive/60 hover:text-terracotta">
        <Eraser className="h-3.5 w-3.5" /> Clear signature
      </button>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
