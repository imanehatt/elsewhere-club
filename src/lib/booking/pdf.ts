import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import type { AgreementDoc, Block, Seg } from "./agreement";
import { formatDate, formatPrice, stripEmoji } from "../utils";
import type { Booking, BookingPayment, OrganizerSettings } from "./types";

const A4: [number, number] = [595.28, 841.89];
const M = 56; // page margin
const OLIVE = rgb(52 / 255, 59 / 255, 49 / 255);
const SOFT = rgb(74 / 255, 82 / 255, 70 / 255);
const TERRA = rgb(182 / 255, 95 / 255, 66 / 255);
const SAND = rgb(244 / 255, 235 / 255, 221 / 255);
const LINE = rgb(0.85, 0.83, 0.78);

interface Fonts { body: PDFFont; bold: PDFFont; serif: PDFFont; serifBold: PDFFont; italic: PDFFont }
type Tok = { text: string; color: RGB; font: PDFFont };

/** Standard PDF fonts can't draw emoji or some symbols — drop anything they can't encode. */
const safeCache = new Map<string, boolean>();
function clean(font: PDFFont, s: string) {
  const replaced = s.replace(/\p{Extended_Pictographic}(\u200d\p{Extended_Pictographic}|\ufe0f)*/gu, "").replace(/\s*\u2192\s*/g, " \u2013 ").replace(/[\u2011\u2012]/g, "-").replace(/\u00a0/g, " ");
  let out = "";
  for (const ch of replaced) {
    const key = font.name + ch;
    let ok = safeCache.get(key);
    if (ok === undefined) {
      try { font.widthOfTextAtSize(ch, 10); ok = true; } catch { ok = false; }
      safeCache.set(key, ok);
    }
    if (ok) out += ch;
  }
  return out;
}

class Writer {
  doc: PDFDocument;
  f: Fonts;
  page!: PDFPage;
  y = 0;
  width = A4[0] - M * 2;
  constructor(doc: PDFDocument, f: Fonts) {
    this.doc = doc;
    this.f = f;
    this.newPage();
  }
  newPage() {
    this.page = this.doc.addPage(A4);
    this.y = A4[1] - M;
  }
  ensure(h: number) {
    if (this.y - h < M + 24) this.newPage();
  }
  gap(h: number) {
    this.y -= h;
  }
  /** Draws word-wrapped rich text. */
  rich(tokens: Tok[], { size = 10, lead = 1.45, x = M, width = this.width, align = "left" }: { size?: number; lead?: number; x?: number; width?: number; align?: "left" | "center" } = {}) {
    const words: Tok[] = [];
    for (const t of tokens) {
      const parts = clean(t.font, t.text).split(/(\s+)/);
      for (const p of parts) if (p) words.push({ ...t, text: p });
    }
    const lines: Tok[][] = [];
    let line: Tok[] = [];
    let w = 0;
    for (const word of words) {
      const ww = word.font.widthOfTextAtSize(word.text, size);
      if (/^\s+$/.test(word.text)) {
        if (line.length) { line.push(word); w += ww; }
        continue;
      }
      if (w + ww > width && line.length) {
        while (line.length && /^\s+$/.test(line[line.length - 1].text)) line.pop();
        lines.push(line);
        line = [];
        w = 0;
      }
      line.push(word);
      w += ww;
    }
    if (line.length) lines.push(line);
    const lh = size * lead;
    for (const l of lines) {
      this.ensure(lh);
      const lw = l.reduce((a, t) => a + t.font.widthOfTextAtSize(t.text, size), 0);
      let cx = align === "center" ? x + (width - lw) / 2 : x;
      for (const t of l) {
        this.page.drawText(t.text, { x: cx, y: this.y - size, size, font: t.font, color: t.color });
        cx += t.font.widthOfTextAtSize(t.text, size);
      }
      this.y -= lh;
    }
  }
  text(s: string, opts: { size?: number; font?: PDFFont; color?: RGB; align?: "left" | "center"; x?: number; width?: number; lead?: number } = {}) {
    this.rich([{ text: s, font: opts.font ?? this.f.body, color: opts.color ?? SOFT }], opts);
  }
  segs(segs: Seg[], font = this.f.body): Tok[] {
    return segs.map((s) => ({ text: s.text, font: s.missing ? this.f.bold : font, color: s.missing ? TERRA : SOFT }));
  }
  rule(color = LINE) {
    this.ensure(10);
    this.page.drawLine({ start: { x: M, y: this.y - 4 }, end: { x: A4[0] - M, y: this.y - 4 }, thickness: 0.6, color });
    this.y -= 12;
  }
}

function drawBlocks(w: Writer, blocks: Block[]) {
  for (const b of blocks) {
    if (b.t === "h2") {
      w.gap(10);
      w.ensure(40);
      w.text(b.text, { size: 13.5, font: w.f.serifBold, color: OLIVE });
      w.gap(2);
    } else if (b.t === "h3") {
      w.gap(4);
      w.ensure(30);
      w.text(b.text, { size: 10.5, font: w.f.bold, color: OLIVE });
    } else if (b.t === "p") {
      w.rich(w.segs(b.segs));
      w.gap(3);
    } else if (b.t === "kv") {
      w.rich([{ text: `${b.label}: `, font: w.f.bold, color: OLIVE }, ...w.segs(b.segs)]);
      w.gap(1);
    } else if (b.t === "ul" || b.t === "ol") {
      b.items.forEach((item, i) => {
        const bullet = b.t === "ul" ? "•" : `${i + 1}.`;
        w.ensure(14);
        const y = w.y;
        w.page.drawText(bullet, { x: M + 6, y: y - 10, size: 10, font: w.f.body, color: TERRA });
        w.rich(w.segs(item), { x: M + 22, width: w.width - 22 });
      });
      w.gap(3);
    } else if (b.t === "table") {
      const colW = [w.width * 0.55, w.width * 0.45];
      const row = (cells: Tok[][], head = false) => {
        w.ensure(22);
        const top = w.y;
        if (head) w.page.drawRectangle({ x: M, y: top - 18, width: w.width, height: 18, color: SAND });
        const startY = w.y;
        let minY = startY;
        cells.forEach((c, i) => {
          w.y = startY - 4;
          w.rich(c, { x: M + 6 + (i ? colW[0] : 0), width: colW[i] - 12, size: 9.5 });
          minY = Math.min(minY, w.y);
        });
        w.y = minY - 2;
        w.page.drawLine({ start: { x: M, y: w.y }, end: { x: A4[0] - M, y: w.y }, thickness: 0.5, color: LINE });
      };
      w.ensure(Math.min(220, 26 * (b.rows.length + 1) + 10));
      row(b.head.map((h) => [{ text: h, font: w.f.bold, color: OLIVE }]), true);
      b.rows.forEach((r) => row([w.segs(r[0]), w.segs(r[1])]));
      w.gap(8);
    } else if (b.t === "hr") {
      w.gap(4);
      w.rule();
    }
  }
}

async function fonts(doc: PDFDocument): Promise<Fonts> {
  return {
    body: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    serif: await doc.embedFont(StandardFonts.TimesRoman),
    serifBold: await doc.embedFont(StandardFonts.TimesRomanBold),
    italic: await doc.embedFont(StandardFonts.TimesRomanItalic),
  };
}

function brandHeader(w: Writer) {
  w.text("THE ELSEWHERE CLUB", { size: 11, font: w.f.serifBold, color: OLIVE, align: "center" });
  w.text("Go Places. Find Your People.", { size: 9.5, font: w.f.italic, color: TERRA, align: "center" });
  w.gap(6);
  w.rule();
}

function pageFooters(doc: PDFDocument, f: Fonts, label: string, banner?: string) {
  const pages = doc.getPages();
  pages.forEach((pg, i) => {
    const txt = clean(f.body, `${label}  ·  Page ${i + 1} of ${pages.length}`);
    pg.drawText(txt, { x: M, y: 30, size: 8, font: f.body, color: SOFT });
    if (banner) {
      const b = clean(f.bold, banner);
      const bw = f.bold.widthOfTextAtSize(b, 8);
      pg.drawText(b, { x: A4[0] - M - bw, y: 30, size: 8, font: f.bold, color: TERRA });
    }
  });
}

export interface SignatureInfo {
  name: string;
  png: string; // data:image/png;base64,...
  signedAt: string; // ISO
  ip: string | null;
  hash: string;
}

/** The booking agreement as a PDF — signed (with signature + evidence) or as an unsigned draft. */
export async function agreementPdf(doc: AgreementDoc, opts: { signature?: SignatureInfo | null; test?: boolean; reference?: string | null }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`The Elsewhere Club — ${doc.title}${opts.reference ? ` ${opts.reference}` : ""}`);
  pdf.setAuthor("The Elsewhere Club");
  const f = await fonts(pdf);
  const w = new Writer(pdf, f);

  brandHeader(w);
  w.gap(6);
  w.text(doc.title.toUpperCase(), { size: 18, font: f.serifBold, color: OLIVE, align: "center" });
  w.text(doc.subtitle, { size: 11, font: f.bold, color: SOFT, align: "center" });
  w.gap(10);
  for (const h of doc.header) w.rich([{ text: `${h.label}: `, font: f.bold, color: OLIVE }, ...w.segs(h.segs)]);
  w.text(`Agreement version: ${doc.version}`, { size: 8.5, align: "center" });
  w.gap(8);

  drawBlocks(w, doc.blocks);

  // Signature blocks
  w.gap(10);
  w.ensure(210);
  const sig = opts.signature;
  w.rich([{ text: "Guest Name: ", font: f.bold, color: OLIVE }, { text: sig ? sig.name : "__________________________", font: f.body, color: SOFT }]);
  w.rich([{ text: "Signature: ", font: f.bold, color: OLIVE }, ...(sig ? [] : [{ text: "__________________________", font: f.body, color: SOFT }])]);
  if (sig?.png?.startsWith("data:image/png;base64,")) {
    try {
      const img = await pdf.embedPng(Buffer.from(sig.png.split(",")[1], "base64"));
      const scale = Math.min(200 / img.width, 70 / img.height);
      w.page.drawImage(img, { x: M + 60, y: w.y - img.height * scale, width: img.width * scale, height: img.height * scale });
      w.gap(img.height * scale + 4);
    } catch (e) {
      console.error("[pdf] signature image", e);
    }
  }
  w.rich([{ text: "Date: ", font: f.bold, color: OLIVE }, { text: sig ? formatDate(new Date(sig.signedAt).toISOString().slice(0, 10)) : "__________________________", font: f.body, color: SOFT }]);

  for (const s of doc.schedules) {
    w.newPage();
    w.text(s.title, { size: 14, font: f.serifBold, color: OLIVE });
    w.text(s.intro, { size: 9, font: f.italic });
    w.gap(6);
    drawBlocks(w, s.blocks);
  }

  if (sig) {
    w.gap(16);
    w.ensure(110);
    w.text("Electronic signature record", { size: 11, font: f.bold, color: OLIVE });
    w.text(`Signed electronically by ${sig.name} on ${new Date(sig.signedAt).toUTCString()}.`, { size: 9 });
    if (sig.ip) w.text(`IP address: ${sig.ip}`, { size: 9 });
    w.text(`Document fingerprint (SHA-256): ${sig.hash}`, { size: 8 });
    w.text("The guest confirmed she had reviewed the trip details, payment schedule and booking conditions before signing.", { size: 9 });
  }

  w.gap(18);
  w.ensure(60);
  w.rule();
  w.text("THE ELSEWHERE CLUB", { size: 10, font: f.serifBold, color: OLIVE, align: "center" });
  w.text("Go Places. Find Your People.", { size: 9, font: f.italic, color: TERRA, align: "center" });
  for (const line of doc.footer) w.rich(w.segs(line), { size: 9, align: "center" });

  pageFooters(pdf, f, `Trip Booking Agreement${opts.reference ? ` ${opts.reference}` : ""}`, opts.test ? "TEST MODE — NOT A REAL BOOKING" : sig ? undefined : "DRAFT — NOT SIGNED");
  return pdf.save();
}

/** A simple payment receipt. */
export async function receiptPdf({ booking, payment, org, test }: { booking: Booking; payment: BookingPayment; org: OrganizerSettings; test?: boolean }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Receipt ${payment.receipt_number ?? ""}`);
  pdf.setAuthor("The Elsewhere Club");
  const f = await fonts(pdf);
  const w = new Writer(pdf, f);
  const cur = booking.currency ?? "EUR";
  brandHeader(w);
  w.gap(8);
  w.text("PAYMENT RECEIPT", { size: 18, font: f.serifBold, color: OLIVE, align: "center" });
  w.gap(14);
  const rows: [string, string][] = [
    ["Receipt number", payment.receipt_number ?? "-"],
    ["Booking reference", booking.reference ?? "-"],
    ["Received from", booking.full_name],
    ["Trip", `${stripEmoji(booking.trip_title)}${booking.trip_start ? `, ${formatDate(booking.trip_start)}${booking.trip_end ? ` - ${formatDate(booking.trip_end)}` : ""}` : ""}`],
    ["Payment", payment.kind === "deposit" ? "Deposit" : "Remaining balance"],
    ["Amount received", formatPrice(payment.received_amount ?? payment.expected_amount, cur)],
    ["Date funds received", payment.received_on ? formatDate(payment.received_on) : "-"],
    ["Method", "Bank transfer"],
    ["Total package price", formatPrice(booking.total_amount, cur)],
  ];
  for (const [k, v] of rows) {
    w.rich([{ text: `${k}: `, font: f.bold, color: OLIVE }, { text: v, font: f.body, color: SOFT }], { size: 11 });
    w.gap(3);
  }
  w.gap(16);
  w.rule();
  const issuer = [org.company_legal_name ? `${org.company_legal_name}, trading as The Elsewhere Club` : "The Elsewhere Club", org.company_address, org.registration_number ? `Registration / license: ${org.registration_number}` : "", org.company_email].filter(Boolean);
  for (const l of issuer) w.text(l, { size: 9 });
  pageFooters(pdf, f, `Receipt ${payment.receipt_number ?? ""}`, test ? "TEST MODE — NOT A REAL PAYMENT" : undefined);
  return pdf.save();
}
