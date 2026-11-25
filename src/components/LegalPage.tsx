import { AlertTriangle } from "lucide-react";

export function LegalPage({ title, updated, intro, draft = true, children, document }: { title: string; updated?: string; intro?: React.ReactNode; draft?: boolean; children?: React.ReactNode; document?: React.ReactNode }) {
  return (
    <section className="pb-24 pt-36 sm:pt-44">
      <div className="container-lux max-w-3xl">
        <p className="eyebrow mb-4">Legal</p>
        <h1 className="display-lg">{title}</h1>
        {updated && <p className="mt-3 text-sm text-olive/55">Last updated: {updated}</p>}
        {intro && <div className="lead mt-5">{intro}</div>}
        {draft && (
          <div role="note" className="mt-8 flex gap-3 rounded-2xl border border-terracotta/30 bg-terracotta/5 p-5 text-sm text-terracotta-dark">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>
              <strong>DRAFT — requires legal review before launch.</strong> Items in [square brackets] still need to be completed by The Elsewhere Club, and the
              document should be reviewed by a qualified lawyer in the organizer&rsquo;s jurisdiction.
            </p>
          </div>
        )}
        {document && <div className="mt-10">{document}</div>}
        {children && <div className="prose-lux mt-10">{children}</div>}
      </div>
    </section>
  );
}

/** Renders text pasted in Admin → Settings: blank line = new paragraph, "## " = heading, "- " = bullet. */
export function PlainLegalText({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h2 key={i}>{b.slice(3)}</h2>;
        const lines = b.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{l.trim().slice(2)}</li>)}</ul>;
        return <p key={i} className="whitespace-pre-line">{b}</p>;
      })}
    </>
  );
}
