import { Plane } from "lucide-react";
import type { Stay } from "@/lib/types";
import { dayLabel, shortRange, stayDaysLabel } from "@/lib/utils";

/**
 * Stylised map of south Bali with the trip route. Drawn as SVG, so it needs no
 * map service, API key or cookies. Known areas get real coordinates; add more
 * to PLACES if you create trips elsewhere in Bali.
 */
const PLACES: Record<string, [number, number]> = {
  airport: [115.167, -8.748],
  ubud: [115.263, -8.507],
  uluwatu: [115.088, -8.829],
  canggu: [115.135, -8.648],
  seminyak: [115.157, -8.69],
  sanur: [115.263, -8.68],
  nusa_dua: [115.23, -8.8],
  sidemen: [115.43, -8.48],
  jimbaran: [115.165, -8.79],
};
const COAST: [number, number][] = [[114.43,-8.15],[114.58,-8.09],[114.8,-8.17],[115.0,-8.13],[115.18,-8.07],[115.36,-8.11],[115.52,-8.19],[115.63,-8.31],[115.71,-8.39],[115.62,-8.49],[115.49,-8.54],[115.38,-8.57],[115.29,-8.62],[115.26,-8.70],[115.23,-8.74],[115.22,-8.79],[115.23,-8.83],[115.18,-8.85],[115.11,-8.85],[115.08,-8.82],[115.10,-8.78],[115.16,-8.755],[115.17,-8.73],[115.15,-8.69],[115.12,-8.66],[115.04,-8.60],[114.9,-8.50],[114.72,-8.40],[114.56,-8.30],[114.45,-8.22]];
const B = { w: 114.9, e: 115.5, n: -8.36, s: -8.92, W: 800, H: 740 };
const prj = ([lon, lat]: [number, number]) => [((lon - B.w) / (B.e - B.w)) * B.W, ((B.n - lat) / (B.n - B.s)) * B.H] as const;
const key = (name: string) => name.toLowerCase().trim().replace(/\s+/g, "_");
export const partId = (name: string) => `part-${key(name).replace(/_/g, "-")}`;

export function RouteMap({ stays, start, end }: { stays: Stay[]; start: string | null; end: string | null }) {
  const known = stays.filter((s) => PLACES[key(s.name)]);
  const stops = [{ name: "Airport (DPS)", p: prj(PLACES.airport), id: "airport" }, ...known.map((s) => ({ name: s.name, p: prj(PLACES[key(s.name)]), id: partId(s.name) }))];
  const route = [...stops, stops[0]];
  const bends = [0.16, 0.18, 0.22, -0.3, 0.2, -0.2];
  const curve = (a: readonly number[], b: readonly number[], k: number) => {
    const mx = (a[0] + b[0]) / 2 + (b[1] - a[1]) * k;
    const my = (a[1] + b[1]) / 2 - (b[0] - a[0]) * k;
    return `M${a[0]} ${a[1]}Q${mx} ${my} ${b[0]} ${b[1]}`;
  };
  const outline = "M" + COAST.map((c) => prj(c).map((n) => n.toFixed(1)).join(" ")).join("L") + "Z";

  return (
    <div className="grid items-center gap-4 rounded-[20px] bg-white p-3.5 md:grid-cols-[1.7fr_1fr]">
      <svg viewBox={`0 0 ${B.W} ${B.H}`} role="img" aria-label={`Route map: ${route.map((s) => s.name).join(" → ")}`} className="block h-auto w-full rounded-[14px]">
        <defs>
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dfe9e6" /><stop offset="1" stopColor="#cddfdb" /></linearGradient>
          <marker id="ah" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#b65f42" /></marker>
        </defs>
        <rect width={B.W} height={B.H} fill="url(#sea)" />
        <path d={outline} fill="#f4ebdd" stroke="#a6ae94" strokeWidth="2" strokeLinejoin="round" />
        <g fill="#a6ae94" opacity=".28"><ellipse cx="560" cy="90" rx="120" ry="60" /><ellipse cx="300" cy="120" rx="90" ry="50" /></g>
        <text x="600" y="250" fontSize="15" fill="#7f8870" letterSpacing="4">BALI</text>
        <text x="560" y="640" fontSize="13" fill="#7fa3a0" fontStyle="italic">Indian Ocean</text>
        {route.slice(0, -1).map((s, i) => (
          <path key={i} d={curve(s.p, route[i + 1].p, bends[i % bends.length])} fill="none" stroke="#b65f42" strokeWidth="3" strokeDasharray="8 7" markerEnd="url(#ah)" className="motion-safe:animate-[dash_1.6s_linear_infinite]" />
        ))}
        {stops.map((s, i) => {
          const left = s.p[0] > 400 || s.id === "airport";
          const w = s.id === "airport" ? 132 : s.name.length * 9.5 + 24;
          const lx = left ? s.p[0] + 20 : s.p[0] - w - 12;
          return (
            <a key={s.id} href={`#${s.id === "airport" ? "route" : s.id}`} aria-label={s.name}>
              <circle cx={s.p[0]} cy={s.p[1]} r={i === 0 ? 11 : 16} fill={i === 0 ? "#343b31" : "#b65f42"} stroke="#fff" strokeWidth="3" />
              {i > 0 && <text x={s.p[0]} y={s.p[1] + 5} fontSize="14" fontWeight="700" fill="#fff" textAnchor="middle">{i}</text>}
              <rect x={lx - 8} y={s.p[1] - 14} width={w} height="30" rx="15" fill="#fff" opacity=".95" />
              <text x={lx + 4} y={s.p[1] + 6} fontSize="16" fontWeight="600" fill="#343b31">{s.name}</text>
            </a>
          );
        })}
      </svg>
      <ol className="grid gap-2">
        <li className="flex items-center gap-3 rounded-2xl bg-ivory px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-olive text-ivory"><Plane className="h-4 w-4" /></span>
          <span><b className="block text-[14.5px] text-olive">Arrive · Airport (DPS)</b><small className="text-olive-soft">{dayLabel(start ?? undefined)}</small></span>
        </li>
        {stays.map((s, i) => (
          <li key={s.name + i}>
            <a href={`#${partId(s.name)}`} className="flex items-center gap-3 rounded-2xl bg-ivory px-3 py-2.5 transition hover:bg-sand">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terracotta text-sm font-bold text-ivory">{i + 1}</span>
              <span><b className="block text-[14.5px] text-olive">{s.name}</b><small className="text-olive-soft">{stayDaysLabel(s)} · {shortRange(s.start, s.end)}</small></span>
            </a>
          </li>
        ))}
        <li className="flex items-center gap-3 rounded-2xl bg-ivory px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-olive text-ivory"><Plane className="h-4 w-4" /></span>
          <span><b className="block text-[14.5px] text-olive">Depart · Airport (DPS)</b><small className="text-olive-soft">{dayLabel(end ?? undefined)}</small></span>
        </li>
      </ol>
    </div>
  );
}
