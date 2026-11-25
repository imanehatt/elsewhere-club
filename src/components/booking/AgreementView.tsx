import type { AgreementDoc, Block, Seg } from "@/lib/booking/agreement";
import { cn } from "@/lib/utils";

function Segs({ segs }: { segs: Seg[] }) {
  return (
    <>
      {segs.map((s, i) =>
        s.missing ? (
          <mark key={i} className="rounded bg-terracotta/15 px-1 font-medium text-terracotta-dark" title="Not filled in yet">{s.text}</mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h2":
            return <h2 key={i} className="!mt-10 font-serif text-2xl text-olive">{b.text}</h2>;
          case "h3":
            return <h3 key={i} className="!mt-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-olive">{b.text}</h3>;
          case "p":
            return <p key={i}><Segs segs={b.segs} /></p>;
          case "kv":
            return <p key={i}><strong className="font-semibold text-olive">{b.label}:</strong> <Segs segs={b.segs} /></p>;
          case "ul":
          case "ol": {
            const L = b.t === "ul" ? "ul" : "ol";
            return (
              <L key={i} className={cn("space-y-1.5 pl-5", b.t === "ul" ? "list-disc marker:text-terracotta" : "list-decimal marker:text-terracotta")}>
                {b.items.map((it, j) => <li key={j}><Segs segs={it} /></li>)}
              </L>
            );
          }
          case "table":
            return (
              <div key={i} className="overflow-hidden rounded-xl ring-1 ring-olive/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-sand text-olive"><tr>{b.head.map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-olive/10">
                    {b.rows.map((r, j) => <tr key={j}><td className="px-4 py-2.5"><Segs segs={r[0]} /></td><td className="px-4 py-2.5"><Segs segs={r[1]} /></td></tr>)}
                  </tbody>
                </table>
              </div>
            );
          case "hr":
            return <hr key={i} className="!my-8 border-olive/10" />;
        }
      })}
    </>
  );
}

/** The booking agreement, styled like a printed document. */
export function AgreementView({ doc, className }: { doc: AgreementDoc; className?: string }) {
  return (
    <article className={cn("rounded-[22px] bg-white px-5 py-10 text-[15px] leading-relaxed text-olive-soft shadow-[0_30px_60px_-45px_rgba(52,59,49,0.6)] ring-1 ring-olive/5 sm:px-12 sm:py-14", className)}>
      <header className="border-b border-olive/10 pb-8 text-center">
        <p className="font-serif text-sm tracking-[0.3em] text-olive">THE ELSEWHERE CLUB</p>
        <p className="mt-1 font-serif text-sm italic text-terracotta">{doc.tagline}</p>
        <h1 className="mt-6 font-serif text-3xl uppercase tracking-wide text-olive sm:text-4xl">{doc.title}</h1>
        <p className="mt-2 font-medium text-olive">{doc.subtitle}</p>
        <div className="mt-5 space-y-1 text-sm">
          {doc.header.map((h) => <p key={h.label}><strong className="text-olive">{h.label}:</strong> <Segs segs={h.segs} /></p>)}
          <p className="text-xs text-olive/50">Agreement version {doc.version}</p>
        </div>
      </header>
      <div className="mt-8 space-y-3">
        <Blocks blocks={doc.blocks} />
      </div>
      {doc.schedules.map((s) => (
        <section key={s.title} className="mt-12 border-t border-olive/10 pt-8">
          <h2 className="font-serif text-2xl text-olive">{s.title}</h2>
          <p className="mb-4 mt-1 text-sm italic text-olive/60">{s.intro}</p>
          <div className="space-y-3"><Blocks blocks={s.blocks} /></div>
        </section>
      ))}
      <footer className="mt-12 border-t border-olive/10 pt-6 text-center text-sm">
        <p className="font-serif tracking-[0.25em] text-olive">THE ELSEWHERE CLUB</p>
        <p className="font-serif italic text-terracotta">{doc.tagline}</p>
        {doc.footer.map((f, i) => <p key={i}><Segs segs={f} /></p>)}
      </footer>
    </article>
  );
}
